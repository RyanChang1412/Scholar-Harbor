from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from scholar_harbor_ingest.adapters import ArxivAdapter, OpenAlexEnricher
from scholar_harbor_ingest.http import SourceUnavailable, with_retries
from scholar_harbor_ingest.models import DataValidationError, validate_dataset
from scholar_harbor_ingest.pipeline import deduplicate, normalize, run_pipeline

NOW = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)
ROOT = Path(__file__).resolve().parents[2]
ATOM = b'''<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
  <entry><id>http://arxiv.org/abs/2610.12345v2</id><updated>2026-10-11T10:00:00Z</updated>
  <published>2026-10-10T09:00:00Z</published><title> Reliable Agent Serving </title>
  <summary> A source-backed abstract about language model agents. </summary>
  <author><name>Ada Researcher</name></author><category term="cs.AI" />
  <link href="https://arxiv.org/abs/2610.12345v2" rel="alternate" />
  <link href="https://arxiv.org/pdf/2610.12345v2" title="pdf" />
  </entry></feed>'''


class FakeAdapter:
    def __init__(self, source_id: str, records=None, error: Exception | None = None):
        self.source_id = source_id
        self.records = records or []
        self.error = error

    def fetch(self):
        if self.error:
            raise self.error
        return self.records


def source_record(version="v2", title="Reliable Agent Serving"):
    return {
        "source": "arXiv",
        "sourceRecordId": f"2610.12345{version}",
        "arxivId": f"2610.12345{version}",
        "title": title,
        "authors": ["Ada Researcher"],
        "abstract": "A source-backed abstract about language model agents.",
        "publishedAt": "2026-10-10T09:00:00Z",
        "updatedAt": "2026-10-11T10:00:00Z" if version == "v2" else "2026-10-10T09:00:00Z",
        "categories": ["cs.AI"],
        "paperUrl": f"https://arxiv.org/abs/2610.12345{version}",
        "pdfUrl": f"https://arxiv.org/pdf/2610.12345{version}",
    }


class IngestionTests(unittest.TestCase):
    def test_arxiv_normalization_and_dates(self):
        record = ArxivAdapter.parse(ATOM)[0]
        self.assertEqual(record["arxivId"], "2610.12345v2")
        self.assertEqual(record["authors"], ["Ada Researcher"])
        self.assertEqual(record["publishedAt"], "2026-10-10T09:00:00Z")

    def test_malformed_arxiv_response_is_rejected(self):
        with self.assertRaises(Exception):
            ArxivAdapter.parse(b"not xml")

    def test_grouped_arxiv_queries_merge_query_attribution(self):
        adapter = ArxivAdapter(
            ["cs.AI"],
            timeout=1,
            attempts=1,
            backoff=0,
            query_groups=[
                {"id": "core-rsi", "terms": ["recursive self-improvement"], "maxResults": 4}
            ],
            historical_query_groups=[
                {"id": "core-rsi-history", "terms": ["self-improving agent"], "maxResults": 4}
            ],
            include_historical=True,
            request_delay=0,
        )
        with patch("scholar_harbor_ingest.adapters.fetch_bytes", return_value=ATOM):
            records = adapter.fetch()
        self.assertEqual(len(records), 1)
        self.assertEqual(
            [context["queryGroup"] for context in records[0]["retrievalContexts"]],
            ["core-rsi", "core-rsi-history"],
        )
        self.assertEqual(
            [context["historical"] for context in records[0]["retrievalContexts"]],
            [False, True],
        )

    def test_revision_deduplication_keeps_latest_and_provenance(self):
        earlier = source_record("v1", "Original title")
        later = source_record("v2", "Revised title")
        later["source"] = "Hugging Face Papers"
        papers = deduplicate(normalize([earlier, later], "2026-10-12T12:00:00Z"))
        self.assertEqual(len(papers), 1)
        self.assertEqual(papers[0]["arxivId"], "2610.12345v2")
        self.assertEqual(len(papers[0]["provenance"]), 2)

    def test_missing_doi_and_pdf_remain_missing(self):
        record = source_record()
        record.pop("pdfUrl")
        paper = normalize([record], "2026-10-12T12:00:00Z")[0]
        self.assertNotIn("doi", paper)
        self.assertNotIn("pdf", [link["kind"] for link in paper["externalLinks"]])

    def test_retry_is_bounded(self):
        attempts = 0
        def fail():
            nonlocal attempts
            attempts += 1
            raise TimeoutError("timeout")
        with patch("scholar_harbor_ingest.http.time.sleep"), self.assertRaises(SourceUnavailable):
            with_retries(fail, source="test", attempts=3, backoff=0)
        self.assertEqual(attempts, 3)

    def test_openalex_enrichment_uses_only_traceable_doi_matches(self):
        record = source_record()
        record["doi"] = "10.1000/example"
        response = {
            "results": [
                {
                    "id": "https://openalex.org/W1",
                    "doi": "https://doi.org/10.1000/example",
                    "cited_by_count": 12,
                }
            ]
        }
        with patch("scholar_harbor_ingest.adapters.fetch_json", return_value=response):
            count = OpenAlexEnricher("test-key", 1, 1, 0).enrich([record])
        self.assertEqual(count, 1)
        self.assertEqual(record["citationCount"], 12)

    def test_empty_dataset_is_rejected(self):
        with self.assertRaises(DataValidationError):
            validate_dataset(
                {
                    "schemaVersion": 1,
                    "generatedAt": "2026-10-12T12:00:00Z",
                    "lastSuccessfulUpdateAt": "2026-10-12T12:00:00Z",
                    "sources": [
                        {
                            "id": "arxiv",
                            "status": "ok",
                            "lastSuccessfulUpdateAt": "2026-10-12T12:00:00Z",
                            "recordCount": 0,
                        }
                    ],
                    "statistics": {
                        "inputRecords": 0,
                        "publishedPapers": 0,
                        "duplicatesMerged": 0,
                    },
                    "papers": [],
                }
            )

    def test_malformed_provenance_is_rejected(self):
        paper = normalize([source_record()], "2026-10-12T12:00:00Z")[0]
        paper["provenance"] = [{"source": "arXiv"}]
        dataset = {
            "schemaVersion": 1,
            "generatedAt": "2026-10-12T12:00:00Z",
            "lastSuccessfulUpdateAt": "2026-10-12T12:00:00Z",
            "sources": [{"id": "arxiv", "status": "ok", "lastSuccessfulUpdateAt": "2026-10-12T12:00:00Z", "recordCount": 1}],
            "statistics": {"inputRecords": 1, "publishedPapers": 1, "duplicatesMerged": 0},
            "papers": [paper],
        }
        with self.assertRaises(DataValidationError):
            validate_dataset(dataset)

    def test_source_outage_preserves_historical_data(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "config.json"
            output = root / "papers.json"
            config.write_text(json.dumps({"windowDays": 30, "maxPublishedPapers": 10}))
            run_pipeline(config_path=config, output_path=output, adapters=[FakeAdapter("arxiv", [source_record()])], now=NOW)
            before = output.read_text()
            with self.assertRaises(RuntimeError):
                run_pipeline(config_path=config, output_path=output, adapters=[FakeAdapter("arxiv", error=TimeoutError())], now=NOW)
            self.assertEqual(output.read_text(), before)

    def test_partial_outage_keeps_prior_records(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "config.json"
            output = root / "papers.json"
            config.write_text(json.dumps({"windowDays": 30, "maxPublishedPapers": 10}))
            run_pipeline(config_path=config, output_path=output, adapters=[FakeAdapter("arxiv", [source_record()])], now=NOW)
            other = source_record("v2", "Different identity")
            other["arxivId"] = other["sourceRecordId"] = "2610.54321v1"
            run_pipeline(config_path=config, output_path=output, adapters=[FakeAdapter("arxiv", error=TimeoutError()), FakeAdapter("huggingface", [other])], now=NOW)
            ids = {paper["id"] for paper in json.loads(output.read_text())["papers"]}
            self.assertEqual(ids, {"paper-2610-12345", "paper-2610-54321"})

    def test_partial_outage_retains_cross_source_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "config.json"
            output = root / "papers.json"
            config.write_text(json.dumps({"windowDays": 30, "maxPublishedPapers": 10}))
            arxiv = source_record()
            hub = source_record()
            hub["source"] = "Hugging Face Papers"
            run_pipeline(config_path=config, output_path=output, adapters=[FakeAdapter("arxiv", [arxiv]), FakeAdapter("huggingface", [hub])], now=NOW)
            run_pipeline(config_path=config, output_path=output, adapters=[FakeAdapter("arxiv", [arxiv]), FakeAdapter("huggingface", error=TimeoutError())], now=datetime(2026, 10, 13, tzinfo=timezone.utc))
            paper = json.loads(output.read_text())["papers"][0]
            self.assertEqual(
                {entry["source"] for entry in paper["provenance"]},
                {"arXiv", "Hugging Face Papers"},
            )

    def test_unchanged_content_does_not_rewrite_dataset(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "config.json"
            output = root / "papers.json"
            config.write_text(json.dumps({"windowDays": 30, "maxPublishedPapers": 10}))
            record = source_record()
            record["retrievalContexts"] = [
                {
                    "queryGroup": "core-rsi",
                    "query": 'all:"recursive self-improvement"',
                    "historical": False,
                }
            ]
            adapter = FakeAdapter("arxiv", [record])
            self.assertTrue(run_pipeline(config_path=config, output_path=output, adapters=[adapter], now=NOW))
            before = output.read_bytes()
            self.assertFalse(run_pipeline(config_path=config, output_path=output, adapters=[adapter], now=datetime(2026, 10, 13, tzinfo=timezone.utc)))
            self.assertEqual(output.read_bytes(), before)

    def test_invalid_existing_dataset_is_rebuilt_before_unchanged_check(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "config.json"
            output = root / "papers.json"
            config.write_text(json.dumps({"windowDays": 30, "maxPublishedPapers": 10}))
            output.write_text('{"schemaVersion": 1, "papers": []}')
            changed = run_pipeline(
                config_path=config,
                output_path=output,
                adapters=[FakeAdapter("arxiv", [source_record()])],
                now=NOW,
            )
            self.assertTrue(changed)
            rebuilt = json.loads(output.read_text())
            validate_dataset(rebuilt)
            self.assertEqual(rebuilt["statistics"]["publishedPapers"], 1)

    def test_output_order_is_deterministic(self):
        first = source_record()
        second = source_record()
        second["arxivId"] = second["sourceRecordId"] = "2610.00001v1"
        second["publishedAt"] = second["updatedAt"] = "2026-10-09T09:00:00Z"
        ordered = deduplicate(normalize([second, first], "2026-10-12T12:00:00Z"))
        self.assertEqual([paper["id"] for paper in ordered], ["paper-2610-12345", "paper-2610-00001"])

    def test_historical_backfill_is_retained_without_daily_full_history(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "config.json"
            output = root / "papers.json"
            config.write_text(
                json.dumps(
                    {
                        "taxonomyPath": str(ROOT / "config/research-taxonomy.v1.json"),
                        "windowDays": 30,
                        "historicalRetentionDays": 1095,
                        "maxPublishedPapers": 10,
                    }
                )
            )
            historical = source_record(title="Recursive Self-Improvement for AI Agents")
            historical["publishedAt"] = historical["updatedAt"] = "2025-05-10T09:00:00Z"
            historical["retrievalContexts"] = [
                {
                    "queryGroup": "core-rsi-history",
                    "query": 'all:"recursive self-improvement"',
                    "historical": True,
                }
            ]
            run_pipeline(
                config_path=config,
                output_path=output,
                adapters=[FakeAdapter("arxiv", [historical])],
                now=NOW,
                historical_backfill=True,
            )
            current = source_record(title="Continual Learning for AI Agents")
            current["arxivId"] = current["sourceRecordId"] = "2610.54321v1"
            run_pipeline(
                config_path=config,
                output_path=output,
                adapters=[FakeAdapter("arxiv", [current])],
                now=datetime(2026, 10, 13, tzinfo=timezone.utc),
            )
            dataset = json.loads(output.read_text())
            self.assertEqual(
                {paper["id"] for paper in dataset["papers"]},
                {"paper-2610-12345", "paper-2610-54321"},
            )
            validate_dataset(dataset)


if __name__ == "__main__":
    unittest.main()
