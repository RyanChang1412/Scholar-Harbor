from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

GROUPS = {
    "core-rsi",
    "enabling-systems",
    "application-ai4s",
    "application-embodied",
    "open-exploration",
}
RELEVANCE = {
    "direct-rsi",
    "enabling-systems",
    "application-research",
    "adjacent-exploration",
}
RELEVANCE_ORDER = {
    "direct-rsi": 0,
    "enabling-systems": 1,
    "application-research": 2,
    "adjacent-exploration": 3,
    "ineligible": 4,
}


@dataclass(frozen=True)
class Taxonomy:
    schema_version: int
    topics: tuple[dict[str, Any], ...]


def load_taxonomy(path: Path) -> Taxonomy:
    value = json.loads(path.read_text(encoding="utf-8"))
    if value.get("schemaVersion") != 1 or not isinstance(value.get("topics"), list):
        raise ValueError("unsupported research taxonomy")
    seen: set[str] = set()
    for topic in value["topics"]:
        topic_id = topic.get("id")
        if (
            not isinstance(topic_id, str)
            or not topic_id
            or topic_id in seen
            or topic.get("group") not in GROUPS
            or topic.get("relevance") not in RELEVANCE
            or not isinstance(topic.get("label"), str)
            or not isinstance(topic.get("aliases"), list)
            or not topic["aliases"]
        ):
            raise ValueError("research taxonomy topic is invalid")
        seen.add(topic_id)
    for topic in value["topics"]:
        related = topic.get("relatedTopicIds", [])
        if (
            not isinstance(related, list)
            or any(not isinstance(topic_id, str) or topic_id not in seen for topic_id in related)
        ):
            raise ValueError("research taxonomy related topic is invalid")
    return Taxonomy(value["schemaVersion"], tuple(value["topics"]))


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    value = re.sub(r"[\u2010-\u2015_/]", "-", value)
    return re.sub(r"\s+", " ", value).strip()


def _contains(text: str, phrase: str) -> bool:
    normalized = normalize_text(phrase)
    if not normalized:
        return False
    pattern = r"(?<![\w])" + re.escape(normalized).replace(r"\ ", r"[\s-]+") + r"(?![\w])"
    return re.search(pattern, text, flags=re.UNICODE) is not None


def match_topics(title: str, abstract: str, taxonomy: Taxonomy) -> list[dict[str, Any]]:
    fields = {"title": normalize_text(title), "abstract": normalize_text(abstract)}
    matches: list[dict[str, Any]] = []
    for index, topic in enumerate(taxonomy.topics):
        combined = f"{fields['title']} {fields['abstract']}"
        if any(_contains(combined, term) for term in topic.get("excludeTerms", [])):
            continue
        evidence: list[dict[str, str]] = []
        for alias in topic["aliases"]:
            for field, value in fields.items():
                if _contains(value, alias):
                    evidence.append({"field": field, "term": alias})
                    break
        for alias in topic.get("ambiguousAliases", []):
            alias_field = next(
                (field for field, value in fields.items() if _contains(value, alias)),
                None,
            )
            has_context = any(
                _contains(combined, term) for term in topic.get("contextTerms", [])
            )
            if alias_field and has_context:
                evidence.append({"field": alias_field, "term": alias})
        unique_evidence = list(
            {f"{item['field']}\0{item['term']}": item for item in evidence}.values()
        )
        if not unique_evidence:
            continue
        confidence = (
            "high"
            if any(item["field"] == "title" for item in unique_evidence)
            or len(unique_evidence) >= 2
            else "medium"
        )
        matches.append(
            {
                "topicId": topic["id"],
                "label": topic["label"],
                "group": topic["group"],
                "relevance": topic["relevance"],
                "confidence": confidence,
                "evidence": unique_evidence[:4],
                "_index": index,
            }
        )
    matches.sort(
        key=lambda item: (
            RELEVANCE_ORDER[item["relevance"]],
            0 if item["confidence"] == "high" else 1,
            item["_index"],
        )
    )
    for item in matches:
        item.pop("_index")
    return matches[:12]


def relevance_level(matches: list[dict[str, Any]]) -> str:
    return min(
        (item["relevance"] for item in matches),
        key=lambda value: RELEVANCE_ORDER[value],
        default="ineligible",
    )
