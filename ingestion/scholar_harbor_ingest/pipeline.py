from __future__ import annotations

import hashlib
import json
import logging
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from .adapters import ArxivAdapter, HuggingFaceAdapter, OpenAlexEnricher, SourceAdapter
from .ai_enrichment import enrich_with_ai_if_configured, source_fingerprint
from .models import base_arxiv_id, utc_iso, validate_dataset
from .taxonomy import Taxonomy, load_taxonomy, match_topics, relevance_level

LOGGER = logging.getLogger(__name__)
TOPIC_RULES = {
    "LLM systems": ("language model", "llm", "transformer"),
    "Efficient inference": ("inference", "serving", "cache", "mixture-of-experts", "moe"),
    "Agent systems": ("agent", "reasoning", "tool use"),
    "Multimodal learning": ("multimodal", "vision-language"),
    "Robotics": ("robot", "embodied"),
    "Trustworthy AI": ("security", "privacy", "robust", "safety"),
    "Machine learning": ("learning", "neural", "model"),
}


def _legacy_topics(record: dict[str, Any]) -> list[str]:
    text = f"{record.get('title', '')} {record.get('abstract', '')}".lower()
    topics = [topic for topic, words in TOPIC_RULES.items() if any(word in text for word in words)]
    return topics[:4] or ["Computer science"]


def _link(kind: str, url: str | None, now: str, source: str) -> dict[str, Any] | None:
    if not url or not url.startswith("https://"):
        return None
    return {"kind": kind, "url": url, "verification": {"status": "verified", "checkedAt": now, "source": source}}


def normalize(records: list[dict[str, Any]], now: str, taxonomy: Taxonomy | None = None) -> list[dict[str, Any]]:
    papers: list[dict[str, Any]] = []
    for record in records:
        if not record.get("authors"):
            LOGGER.warning("record_skipped_missing_authors", extra={"source": record.get("source", "unknown")})
            continue
        arxiv_id = record["arxivId"]
        links = [_link("paper", record.get("paperUrl"), now, record["source"]), _link("pdf", record.get("pdfUrl"), now, record["source"]), _link("code", record.get("codeUrl"), now, record["source"])]
        topic_matches = match_topics(record["title"], record["abstract"], taxonomy) if taxonomy else []
        paper: dict[str, Any] = {
            "id": f"paper-{base_arxiv_id(arxiv_id).replace('.', '-')}",
            "arxivId": arxiv_id,
            "title": record["title"],
            "authors": record["authors"],
            "abstract": record["abstract"],
            "publishedAt": record["publishedAt"],
            "updatedAt": record["updatedAt"],
            "provenance": [{"source": record["source"], "sourceRecordId": record["sourceRecordId"], "retrievedAt": now}],
            "categories": record.get("categories") or ["Unclassified"],
            "topics": [match["label"] for match in topic_matches] or _legacy_topics(record),
            "externalLinks": [link for link in links if link],
            "aiEnrichment": {"status": "unavailable"},
        }
        if taxonomy:
            paper["topicMatches"] = topic_matches
        retrieval_contexts = record.get("retrievalContexts", [])
        if retrieval_contexts:
            paper["retrievalContexts"] = [
                {
                    "source": record["source"],
                    "queryGroup": context["queryGroup"],
                    "query": context["query"],
                    "historical": bool(context.get("historical")),
                    "retrievedAt": now,
                }
                for context in retrieval_contexts
            ]
        if record.get("doi"):
            paper["doi"] = record["doi"]
        signals = []
        if isinstance(record.get("upvotes"), int):
            signals.append({"kind": "saves", "value": record["upvotes"], "source": "Hugging Face Papers upvotes", "observedAt": now, "fixture": False})
        if isinstance(record.get("comments"), int):
            signals.append({"kind": "discussions", "value": record["comments"], "source": "Hugging Face Papers comments", "observedAt": now, "fixture": False})
        if isinstance(record.get("citationCount"), int):
            signals.append({"kind": "citations", "value": record["citationCount"], "source": "OpenAlex cited_by_count", "observedAt": now, "fixture": False})
        if signals:
            paper["communitySignals"] = signals
        papers.append(paper)
    return papers


def deduplicate(papers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for paper in sorted(papers, key=lambda item: (base_arxiv_id(item["arxivId"]), item["provenance"][0]["source"])):
        key = base_arxiv_id(paper["arxivId"])
        current = merged.get(key)
        if current is None:
            merged[key] = paper
            continue
        provenance_ids = {
            (item["source"], item["sourceRecordId"])
            for item in current["provenance"]
        }
        current["provenance"].extend(
            item
            for item in paper["provenance"]
            if (item["source"], item["sourceRecordId"]) not in provenance_ids
        )
        if paper["updatedAt"] > current["updatedAt"]:
            for field in ("arxivId", "title", "authors", "abstract", "publishedAt", "updatedAt", "categories"):
                current[field] = paper[field]
        for field in ("externalLinks", "communitySignals"):
            existing = current.setdefault(field, [])
            identities = {(item.get("kind"), item.get("url"), item.get("source")) for item in existing}
            existing.extend(item for item in paper.get(field, []) if (item.get("kind"), item.get("url"), item.get("source")) not in identities)
        contexts = current.setdefault("retrievalContexts", [])
        context_ids = {(item["source"], item["queryGroup"], item["query"], item["historical"]) for item in contexts}
        contexts.extend(item for item in paper.get("retrievalContexts", []) if (item["source"], item["queryGroup"], item["query"], item["historical"]) not in context_ids)
        if paper.get("topicMatches"):
            current["topicMatches"] = paper["topicMatches"]
            current["topics"] = paper["topics"]
    return sorted(merged.values(), key=lambda item: (-datetime.fromisoformat(item["publishedAt"].replace("Z", "+00:00")).timestamp(), item["id"]))


def _paper_fingerprint(papers: list[dict[str, Any]]) -> str:
    stable = json.loads(json.dumps(papers))
    for paper in stable:
        for provenance in paper["provenance"]:
            provenance.pop("retrievedAt", None)
        for link in paper["externalLinks"]:
            link["verification"].pop("checkedAt", None)
        for signal in paper.get("communitySignals", []):
            signal.pop("observedAt", None)
        for context in paper.get("retrievalContexts", []):
            context.pop("retrievedAt", None)
    return hashlib.sha256(json.dumps(stable, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def run_pipeline(*, config_path: Path, output_path: Path, adapters: list[SourceAdapter] | None = None, now: datetime | None = None, historical_backfill: bool = False) -> bool:
    config = json.loads(config_path.read_text())
    run_time = now or datetime.now(timezone.utc)
    now_iso = utc_iso(run_time)
    repository_root = config_path.resolve().parent.parent
    taxonomy = (
        load_taxonomy(repository_root / config["taxonomyPath"])
        if config.get("taxonomyPath")
        else None
    )
    existing = None
    if output_path.exists():
        try:
            loaded = json.loads(output_path.read_text())
            validate_dataset(loaded)
            existing = loaded
        except (OSError, ValueError, TypeError) as error:
            LOGGER.error(
                "existing_dataset_invalid",
                extra={"error_type": type(error).__name__},
            )
    sources: list[dict[str, Any]] = []
    raw_records: list[dict[str, Any]] = []
    active_adapters = adapters or [
        ArxivAdapter(
            config["categories"],
            timeout=config["requestTimeoutSeconds"],
            attempts=config["maxAttempts"],
            backoff=config["backoffSeconds"],
            query_groups=config["arxivQueryGroups"],
            historical_query_groups=config.get("arxivHistoricalQueryGroups", []),
            include_historical=historical_backfill,
            request_delay=config.get("arxivRequestDelaySeconds", 3),
        ),
        HuggingFaceAdapter(config["huggingFaceQueries"], config["maxHuggingFaceResults"], config["requestTimeoutSeconds"], config["maxAttempts"], config["backoffSeconds"], config["huggingFaceRequestDelaySeconds"]),
    ]
    for adapter in active_adapters:
        try:
            records = adapter.fetch()
            raw_records.extend(records)
            source_result = {"id": adapter.source_id, "status": "ok", "lastSuccessfulUpdateAt": now_iso, "recordCount": len(records)}
            if isinstance(getattr(adapter, "raw_record_count", None), int):
                source_result["rawRecordCount"] = adapter.raw_record_count
            sources.append(source_result)
            LOGGER.info("source_complete", extra={"source": adapter.source_id, "record_count": len(records)})
        except Exception as error:
            LOGGER.error("source_failed", extra={"source": adapter.source_id, "error_type": type(error).__name__})
            sources.append({"id": adapter.source_id, "status": "unavailable", "recordCount": 0})
    if not raw_records:
        raise RuntimeError("all configured sources failed or returned no usable records; last-known-good dataset preserved")
    if adapters is None and config.get("openAlexEnabled"):
        api_key = os.environ.get("OPENALEX_API_KEY")
        if not api_key:
            LOGGER.warning("source_skipped_missing_credential", extra={"source": "openalex"})
        else:
            try:
                enriched = OpenAlexEnricher(api_key, config["requestTimeoutSeconds"], config["maxAttempts"], config["backoffSeconds"]).enrich(raw_records)
                sources.append({"id": "openalex", "status": "ok", "lastSuccessfulUpdateAt": now_iso, "recordCount": enriched})
            except Exception as error:
                LOGGER.error("source_failed", extra={"source": "openalex", "error_type": type(error).__name__})
                sources.append({"id": "openalex", "status": "unavailable", "recordCount": 0})
    papers = deduplicate(normalize(raw_records, now_iso, taxonomy))
    if existing:
        existing_by_id = {paper["id"]: paper for paper in existing["papers"]}
        ai_config = config.get("aiEnrichment", {})
        provider_id = os.environ.get("AI_PROVIDER") or ai_config.get(
            "provider", "bailian"
        )
        provider_config = ai_config.get("providers", {}).get(provider_id, {})
        legacy_model_env = provider_config.get("legacyModelEnv")
        configured_model = (
            os.environ.get("AI_MODEL")
            or (
                os.environ.get(legacy_model_env)
                if isinstance(legacy_model_env, str)
                else None
            )
            or provider_config.get("defaultModel")
        )
        configured_provider = provider_config.get("displayName")
        for paper in papers:
            cached = existing_by_id.get(paper["id"], {}).get("aiEnrichment", {})
            source_matches = cached.get("sourceFingerprint") == source_fingerprint(
                paper
            )
            legacy_cache = (
                cached.get("status") == "available"
                and isinstance(cached.get("overview"), str)
                and source_matches
            )
            configured_cache = (
                cached.get("status") == "available"
                and source_matches
                and cached.get("model") == configured_model
                and cached.get("provider") == configured_provider
                and cached.get("promptVersion") == ai_config.get("promptVersion")
            )
            if legacy_cache or configured_cache:
                paper["aiEnrichment"] = cached
    deduplicated_count = len(papers)
    if existing and any(source["status"] == "unavailable" for source in sources):
        papers.extend(existing["papers"])
        papers = deduplicate(papers)
    if existing and taxonomy:
        historical_papers = [
            paper
            for paper in existing["papers"]
            if any(context.get("historical") for context in paper.get("retrievalContexts", []))
        ]
        if historical_papers:
            papers = deduplicate([*papers, *historical_papers])
    cutoff = run_time - timedelta(days=config["windowDays"])
    historical_cutoff = run_time - timedelta(days=config.get("historicalRetentionDays", config["windowDays"]))
    rejected_ineligible = sum(
        1 for paper in papers if taxonomy and relevance_level(paper.get("topicMatches", [])) == "ineligible"
    )
    papers = [
        paper
        for paper in papers
        if (not taxonomy or relevance_level(paper.get("topicMatches", [])) != "ineligible")
        and (datetime.fromisoformat(
            paper["publishedAt"].replace("Z", "+00:00")
        )
        >= cutoff
        or (
            datetime.fromisoformat(paper["publishedAt"].replace("Z", "+00:00")) >= historical_cutoff
            and (paper.get("communitySignals") or any(context.get("historical") for context in paper.get("retrievalContexts", [])))
        ))
    ]
    eligible_before_limit = len(papers)
    papers = papers[: config["maxPublishedPapers"]]
    enrich_with_ai_if_configured(papers, config, repository_root)
    classification_counts = {
        key: sum(1 for paper in papers if relevance_level(paper.get("topicMatches", [])) == key)
        for key in ("direct-rsi", "enabling-systems", "application-research", "adjacent-exploration")
    }
    dataset = {
        "schemaVersion": 1,
        **({"taxonomyVersion": taxonomy.schema_version} if taxonomy else {}),
        "generatedAt": now_iso,
        "lastSuccessfulUpdateAt": now_iso,
        "sources": sources,
        "statistics": {
            "inputRecords": len(raw_records),
            "rawSourceRecords": sum(source.get("rawRecordCount", source["recordCount"]) for source in sources),
            "eligibleBeforeLimit": eligible_before_limit,
            "publishedPapers": len(papers),
            "duplicatesMerged": len(raw_records) - deduplicated_count,
            **({"classification": {**classification_counts, "ineligibleRejected": rejected_ineligible}} if taxonomy else {}),
        },
        "papers": papers,
    }
    validate_dataset(dataset)
    if existing and _paper_fingerprint(existing["papers"]) == _paper_fingerprint(papers):
        LOGGER.info("dataset_unchanged", extra={"paper_count": len(papers)})
        return False
    output_path.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary_name = tempfile.mkstemp(prefix=f".{output_path.name}.", dir=output_path.parent)
    try:
        with os.fdopen(handle, "w") as temporary:
            json.dump(dataset, temporary, ensure_ascii=False, indent=2, sort_keys=True)
            temporary.write("\n")
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_name, output_path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)
    LOGGER.info("dataset_published", extra={"paper_count": len(papers), "output": str(output_path)})
    return True
