from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .taxonomy import load_taxonomy, match_topics, relevance_level

BASELINE_TERMS = (
    "language model",
    "llm",
    "transformer",
    "inference",
    "serving",
    "cache",
    "mixture-of-experts",
    "moe",
    "agent",
    "reasoning",
    "tool use",
    "multimodal",
    "vision-language",
    "robot",
    "embodied",
    "security",
    "privacy",
    "robust",
    "safety",
    "learning",
    "neural",
    "model",
)


def _metrics(expected: list[str], predicted: list[str]) -> dict[str, Any]:
    expected_eligible = [value != "ineligible" for value in expected]
    predicted_eligible = [value != "ineligible" for value in predicted]
    true_positive = sum(a and b for a, b in zip(expected_eligible, predicted_eligible))
    false_positive = sum(not a and b for a, b in zip(expected_eligible, predicted_eligible))
    false_negative = sum(a and not b for a, b in zip(expected_eligible, predicted_eligible))
    precision = true_positive / max(1, true_positive + false_positive)
    recall = true_positive / max(1, true_positive + false_negative)
    return {
        "eligiblePrecision": round(precision, 4),
        "eligibleRecall": round(recall, 4),
        "eligibleF1": round(2 * precision * recall / max(0.0001, precision + recall), 4),
        "exactRelevanceAccuracy": round(
            sum(a == b for a, b in zip(expected, predicted)) / len(expected), 4
        ),
    }


def evaluate(benchmark_path: Path, taxonomy_path: Path) -> dict[str, Any]:
    benchmark = json.loads(benchmark_path.read_text(encoding="utf-8"))
    if benchmark.get("schemaVersion") != 1 or len(benchmark.get("records", [])) < 10:
        raise ValueError("RSI discovery benchmark is incomplete")
    taxonomy = load_taxonomy(taxonomy_path)
    expected: list[str] = []
    baseline: list[str] = []
    enhanced: list[str] = []
    results = []
    for record in benchmark["records"]:
        text = f"{record['title']} {record['abstractExcerpt']}".casefold()
        baseline_level = "adjacent-exploration" if any(term in text for term in BASELINE_TERMS) else "ineligible"
        matches = match_topics(record["title"], record["abstractExcerpt"], taxonomy)
        enhanced_level = relevance_level(matches)
        expected.append(record["expectedRelevance"])
        baseline.append(baseline_level)
        enhanced.append(enhanced_level)
        results.append(
            {
                "id": record["id"],
                "expected": record["expectedRelevance"],
                "baseline": baseline_level,
                "enhanced": enhanced_level,
                "matchedTopics": [match["topicId"] for match in matches],
            }
        )
    return {
        "schemaVersion": 1,
        "methodology": benchmark["methodology"],
        "recordCount": len(results),
        "realMetadataRecords": sum(record["kind"] == "real-metadata" for record in benchmark["records"]),
        "syntheticNegativeRecords": sum(record["kind"] == "synthetic-negative" for record in benchmark["records"]),
        "baseline": _metrics(expected, baseline),
        "enhanced": _metrics(expected, enhanced),
        "records": results,
    }
