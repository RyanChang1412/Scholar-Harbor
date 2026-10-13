from __future__ import annotations

import unittest
from pathlib import Path

from scholar_harbor_ingest.evaluation import evaluate
from scholar_harbor_ingest.taxonomy import load_taxonomy, match_topics, relevance_level

ROOT = Path(__file__).resolve().parents[2]


class RsiDiscoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.taxonomy = load_taxonomy(ROOT / "config/research-taxonomy.v1.json")

    def test_ambiguous_rsi_requires_ai_context_and_honors_exclusions(self):
        finance = match_topics(
            "RSI Signals for Trading",
            "The relative strength index (RSI) measures stock momentum.",
            self.taxonomy,
        )
        ai = match_topics(
            "RSI for Agents",
            "The AI agent uses recursive self-improvement after feedback.",
            self.taxonomy,
        )
        self.assertEqual(relevance_level(finance), "ineligible")
        self.assertEqual(relevance_level(ai), "direct-rsi")

    def test_matching_is_deterministic_and_evidence_backed(self):
        first = match_topics(
            "Efficient LLM Serving with KV Cache Replication",
            "A systems method.",
            self.taxonomy,
        )
        second = match_topics(
            "Efficient LLM Serving with KV Cache Replication",
            "A systems method.",
            self.taxonomy,
        )
        self.assertEqual(first, second)
        self.assertTrue(all(match["evidence"] for match in first))
        self.assertEqual(relevance_level(first), "enabling-systems")

    def test_fixed_benchmark_improves_precision_and_relevance_accuracy(self):
        report = evaluate(
            ROOT / "config/evaluation/rsi-discovery-benchmark.v1.json",
            ROOT / "config/research-taxonomy.v1.json",
        )
        self.assertEqual(report["recordCount"], 10)
        self.assertEqual(report["realMetadataRecords"], 6)
        self.assertEqual(report["syntheticNegativeRecords"], 4)
        self.assertGreater(
            report["enhanced"]["eligiblePrecision"],
            report["baseline"]["eligiblePrecision"],
        )
        self.assertGreater(
            report["enhanced"]["exactRelevanceAccuracy"],
            report["baseline"]["exactRelevanceAccuracy"],
        )


if __name__ == "__main__":
    unittest.main()
