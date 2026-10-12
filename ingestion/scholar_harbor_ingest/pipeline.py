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
from .models import base_arxiv_id, utc_iso, validate_dataset

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


def _topics(record: dict[str, Any]) -> list[str]:
    text = f"{record.get('title', '')} {record.get('abstract', '')}".lower()
    topics = [topic for topic, words in TOPIC_RULES.items() if any(word in text for word in words)]
    return topics[:4] or ["Computer science"]


def _link(kind: str, url: str | None, now: str, source: str) -> dict[str, Any] | None:
    if not url or not url.startswith("https://"):
        return None
    return {"kind": kind, "url": url, "verification": {"status": "verified", "checkedAt": now, "source": source}}


def normalize(records: list[dict[str, Any]], now: str) -> list[dict[str, Any]]:
    papers: list[dict[str, Any]] = []
    for record in records:
        if not record.get("authors"):
            LOGGER.warning("record_skipped_missing_authors", extra={"source": record.get("source", "unknown")})
            continue
        arxiv_id = record["arxivId"]
        links = [_link("paper", record.get("paperUrl"), now, record["source"]), _link("pdf", record.get("pdfUrl"), now, record["source"]), _link("code", record.get("codeUrl"), now, record["source"])]
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
            "topics": _topics(record),
            "externalLinks": [link for link in links if link],
            "aiEnrichment": {"status": "unavailable"},
        }
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
    return hashlib.sha256(json.dumps(stable, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def run_pipeline(*, config_path: Path, output_path: Path, adapters: list[SourceAdapter] | None = None, now: datetime | None = None) -> bool:
    config = json.loads(config_path.read_text())
    run_time = now or datetime.now(timezone.utc)
    now_iso = utc_iso(run_time)
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
        ArxivAdapter(config["categories"], config["keywords"], config["maxArxivResults"], config["requestTimeoutSeconds"], config["maxAttempts"], config["backoffSeconds"]),
        HuggingFaceAdapter(config["huggingFaceQueries"], config["maxHuggingFaceResults"], config["requestTimeoutSeconds"], config["maxAttempts"], config["backoffSeconds"], config["huggingFaceRequestDelaySeconds"]),
    ]
    for adapter in active_adapters:
        try:
            records = adapter.fetch()
            raw_records.extend(records)
            sources.append({"id": adapter.source_id, "status": "ok", "lastSuccessfulUpdateAt": now_iso, "recordCount": len(records)})
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
    papers = deduplicate(normalize(raw_records, now_iso))
    deduplicated_count = len(papers)
    if existing and any(source["status"] == "unavailable" for source in sources):
        papers.extend(existing["papers"])
        papers = deduplicate(papers)
    cutoff = run_time - timedelta(days=config["windowDays"])
    papers = [
        paper
        for paper in papers
        if datetime.fromisoformat(
            paper["publishedAt"].replace("Z", "+00:00")
        )
        >= cutoff
        or paper.get("communitySignals")
    ][: config["maxPublishedPapers"]]
    dataset = {
        "schemaVersion": 1,
        "generatedAt": now_iso,
        "lastSuccessfulUpdateAt": now_iso,
        "sources": sources,
        "statistics": {"inputRecords": len(raw_records), "publishedPapers": len(papers), "duplicatesMerged": len(raw_records) - deduplicated_count},
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
