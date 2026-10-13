from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

ARXIV_ID = re.compile(r"^\d{4}\.\d{4,5}(?:v\d+)?$")
DOI = re.compile(r"^10\.\d{4,9}/\S+$", re.IGNORECASE)


class DataValidationError(ValueError):
    pass


def utc_iso(value: str | datetime) -> str:
    parsed = value if isinstance(value, datetime) else datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def base_arxiv_id(value: str) -> str:
    return re.sub(r"v\d+$", "", value)


def validate_paper(paper: dict[str, Any]) -> None:
    required_strings = ("id", "arxivId", "title", "abstract", "publishedAt", "updatedAt")
    for key in required_strings:
        if not isinstance(paper.get(key), str) or not paper[key].strip():
            raise DataValidationError(f"paper.{key} must be a non-empty string")
    if not paper["id"].startswith("paper-") or not ARXIV_ID.fullmatch(paper["arxivId"]):
        raise DataValidationError("paper identity is invalid")
    expected_id = f"paper-{base_arxiv_id(paper['arxivId']).replace('.', '-')}"
    if paper["id"] != expected_id:
        raise DataValidationError("paper ID does not match canonical arXiv identity")
    if "doi" in paper and not DOI.fullmatch(paper["doi"]):
        raise DataValidationError("paper DOI is invalid")
    published = datetime.fromisoformat(paper["publishedAt"].replace("Z", "+00:00"))
    updated = datetime.fromisoformat(paper["updatedAt"].replace("Z", "+00:00"))
    if updated < published:
        raise DataValidationError("updatedAt precedes publishedAt")
    for key in ("authors", "categories", "topics"):
        values = paper.get(key)
        if (
            not isinstance(values, list)
            or not values
            or not all(isinstance(value, str) and value.strip() for value in values)
        ):
            raise DataValidationError(f"paper.{key} must be a non-empty list")
    topic_matches = paper.get("topicMatches", [])
    if not isinstance(topic_matches, list):
        raise DataValidationError("paper.topicMatches must be a list")
    for match in topic_matches:
        if (
            not isinstance(match, dict)
            or match.get("relevance") not in {
                "direct-rsi",
                "enabling-systems",
                "application-research",
                "adjacent-exploration",
            }
            or match.get("group") not in {
                "core-rsi",
                "enabling-systems",
                "application-ai4s",
                "application-embodied",
                "open-exploration",
            }
            or match.get("confidence") not in {"high", "medium"}
            or not all(
                isinstance(match.get(key), str) and match[key].strip()
                for key in ("topicId", "label")
            )
            or not isinstance(match.get("evidence"), list)
            or not match["evidence"]
        ):
            raise DataValidationError("paper topic match is invalid")
        if not all(
            isinstance(item, dict)
            and item.get("field") in {"title", "abstract"}
            and isinstance(item.get("term"), str)
            and item["term"].strip()
            for item in match["evidence"]
        ):
            raise DataValidationError("paper topic evidence is invalid")
    retrieval_contexts = paper.get("retrievalContexts", [])
    if not isinstance(retrieval_contexts, list):
        raise DataValidationError("paper.retrievalContexts must be a list")
    for context in retrieval_contexts:
        if (
            not isinstance(context, dict)
            or not all(
                isinstance(context.get(key), str) and context[key].strip()
                for key in ("source", "queryGroup", "query", "retrievedAt")
            )
            or not isinstance(context.get("historical"), bool)
        ):
            raise DataValidationError("paper retrieval context is invalid")
        utc_iso(context["retrievedAt"])
    provenance = paper.get("provenance")
    if not isinstance(provenance, list) or not provenance:
        raise DataValidationError("paper.provenance must be a non-empty list")
    for entry in provenance:
        if not isinstance(entry, dict) or not all(
            isinstance(entry.get(key), str) and entry[key].strip()
            for key in ("source", "sourceRecordId", "retrievedAt")
        ):
            raise DataValidationError("paper provenance entry is invalid")
        utc_iso(entry["retrievedAt"])
    links = paper.get("externalLinks")
    if not isinstance(links, list) or not links:
        raise DataValidationError("paper.externalLinks must be a non-empty list")
    for link in links:
        if not isinstance(link, dict) or link.get("kind") not in {"paper", "pdf", "code"}:
            raise DataValidationError("paper link kind is invalid")
        if urlparse(link.get("url", "")).scheme != "https":
            raise DataValidationError("paper links must use HTTPS")
        verification = link.get("verification")
        if (
            not isinstance(verification, dict)
            or verification.get("status") not in {"verified", "fixture"}
            or not isinstance(verification.get("source"), str)
        ):
            raise DataValidationError("paper link verification is invalid")
        utc_iso(verification.get("checkedAt", ""))
    if not any(link["kind"] == "paper" for link in links):
        raise DataValidationError("paper page link is required")
    signals = paper.get("communitySignals", [])
    if not isinstance(signals, list):
        raise DataValidationError("paper.communitySignals must be a list")
    for signal in signals:
        if (
            not isinstance(signal, dict)
            or signal.get("kind") not in {"saves", "discussions", "citations"}
            or not isinstance(signal.get("value"), (int, float))
            or signal["value"] < 0
            or not isinstance(signal.get("source"), str)
            or not isinstance(signal.get("fixture"), bool)
        ):
            raise DataValidationError("paper community signal is invalid")
        utc_iso(signal.get("observedAt", ""))
    enrichment = paper.get("aiEnrichment")
    if enrichment is not None and (
        not isinstance(enrichment, dict)
        or enrichment.get("status") not in {"unavailable", "available"}
    ):
        raise DataValidationError("paper AI enrichment state is invalid")
    if enrichment and enrichment.get("status") == "available":
        overview = enrichment.get("overview")
        legacy_overview = isinstance(overview, str) and overview.strip()
        structured_overview = (
            isinstance(overview, dict)
            and set(overview)
            == {"researchProblem", "coreApproach", "researchRelevance"}
            and all(
                isinstance(value, str) and value.strip()
                for value in overview.values()
            )
        )
        if not legacy_overview and not structured_overview:
            raise DataValidationError("paper AI overview is invalid")
        if enrichment.get("basis") not in {"title-abstract", "full-text"}:
            raise DataValidationError("paper AI basis is invalid")
        for key in ("generatedAt", "promptVersion", "sourceFingerprint"):
            if not isinstance(enrichment.get(key), str) or not enrichment[key].strip():
                raise DataValidationError(f"paper AI {key} is invalid")
        if structured_overview:
            if enrichment.get("provider") not in {
                "Alibaba Cloud Model Studio",
                "OpenAI",
                "DeepSeek",
            }:
                raise DataValidationError("paper AI provider is invalid")
            for key in ("model", "cacheKey"):
                if not isinstance(enrichment.get(key), str) or not enrichment[key].strip():
                    raise DataValidationError(f"paper AI {key} is invalid")
        utc_iso(enrichment["generatedAt"])


def validate_dataset(dataset: dict[str, Any]) -> None:
    if dataset.get("schemaVersion") != 1:
        raise DataValidationError("unsupported dataset schemaVersion")
    if "taxonomyVersion" in dataset and dataset["taxonomyVersion"] != 1:
        raise DataValidationError("unsupported taxonomyVersion")
    for key in ("generatedAt", "lastSuccessfulUpdateAt"):
        utc_iso(dataset.get(key, ""))
    if not isinstance(dataset.get("sources"), list) or not dataset["sources"]:
        raise DataValidationError("dataset sources are required")
    for source in dataset["sources"]:
        if (
            not isinstance(source, dict)
            or not isinstance(source.get("id"), str)
            or source.get("status") not in {"ok", "unavailable"}
            or not isinstance(source.get("recordCount"), int)
            or source["recordCount"] < 0
            or (
                "rawRecordCount" in source
                and (
                    not isinstance(source["rawRecordCount"], int)
                    or source["rawRecordCount"] < source["recordCount"]
                )
            )
        ):
            raise DataValidationError("dataset source metadata is invalid")
        if source["status"] == "ok":
            utc_iso(source.get("lastSuccessfulUpdateAt", ""))
    papers = dataset.get("papers")
    if not isinstance(papers, list) or not papers:
        raise DataValidationError("refusing to publish an empty paper dataset")
    seen: set[str] = set()
    for paper in papers:
        if not isinstance(paper, dict):
            raise DataValidationError("paper record must be an object")
        validate_paper(paper)
        canonical = base_arxiv_id(paper["arxivId"])
        if canonical in seen:
            raise DataValidationError(f"duplicate arXiv identity: {canonical}")
        seen.add(canonical)
    statistics = dataset.get("statistics")
    if (
        not isinstance(statistics, dict)
        or statistics.get("publishedPapers") != len(papers)
        or not all(
            isinstance(statistics.get(key), int) and statistics[key] >= 0
            for key in ("inputRecords", "publishedPapers", "duplicatesMerged")
        )
    ):
        raise DataValidationError("dataset processing statistics are invalid")
    classification = statistics.get("classification")
    for optional_count in ("rawSourceRecords", "eligibleBeforeLimit"):
        if optional_count in statistics and (
            not isinstance(statistics[optional_count], int)
            or statistics[optional_count] < 0
        ):
            raise DataValidationError(f"dataset {optional_count} is invalid")
    if classification is not None and (
        not isinstance(classification, dict)
        or not all(
            isinstance(classification.get(key), int) and classification[key] >= 0
            for key in (
                "direct-rsi",
                "enabling-systems",
                "application-research",
                "adjacent-exploration",
                "ineligibleRejected",
            )
        )
    ):
        raise DataValidationError("dataset classification statistics are invalid")
