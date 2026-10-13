from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scholar_harbor_ingest.content_pipeline import parse_feed, run_news_pipeline, validate_news_dataset, validate_rankings_dataset

NOW = datetime(2026, 10, 13, 1, 0, tzinfo=timezone.utc)
RSS = b'''<rss><channel><item><title>Research systems update</title><link>https://example.org/post?utm_source=test</link><pubDate>Mon, 12 Oct 2026 09:00:00 GMT</pubDate><description>A source-provided summary.</description></item></channel></rss>'''
ATOM = b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Release 1.0</title><updated>2026-10-12T08:00:00Z</updated><link href="https://example.org/release"/><content>Release notes from the project.</content></entry></feed>'''


def source(identifier: str) -> dict[str, str]:
    return {"id": identifier, "name": identifier.title(), "feedUrl": f"https://example.org/{identifier}.xml", "homepageUrl": "https://example.org", "category": "Research"}


class NewsPipelineTests(unittest.TestCase):
    def test_rss_and_atom_normalize_with_provenance(self):
        rss = parse_feed(RSS, source("lab"), "2026-10-13T01:00:00Z")[0]
        atom = parse_feed(ATOM, source("project"), "2026-10-13T01:00:00Z")[0]
        self.assertEqual(rss["originalUrl"], "https://example.org/post")
        self.assertEqual(rss["sourceId"], "lab")
        self.assertEqual(atom["description"], "Release notes from the project.")

    def test_public_descriptions_remove_contact_addresses(self):
        payload = RSS.replace(b"A source-provided summary.", b"Contact author@example.org for details.")
        item = parse_feed(payload, source("lab"), "2026-10-13T01:00:00Z")[0]
        self.assertNotIn("author@example.org", item["description"])
        self.assertIn("[contact removed]", item["description"])

    def test_duplicate_urls_are_rejected(self):
        item = parse_feed(RSS, source("lab"), "2026-10-13T01:00:00Z")[0]
        dataset = {"schemaVersion": 1, "generatedAt": "2026-10-13T01:00:00Z", "lastSuccessfulUpdateAt": "2026-10-13T01:00:00Z", "sources": [], "news": [item, {**item, "id": "news-11111111111111111111"}]}
        with self.assertRaises(ValueError):
            validate_news_dataset(dataset)

    def test_missing_news_source_metadata_is_rejected(self):
        item = parse_feed(RSS, source("lab"), "2026-10-13T01:00:00Z")[0]
        dataset = {"schemaVersion": 1, "generatedAt": "2026-10-13T01:00:00Z", "lastSuccessfulUpdateAt": "2026-10-13T01:00:00Z", "sources": [], "news": [item]}
        with self.assertRaises(ValueError):
            validate_news_dataset(dataset)

    def test_rankings_require_traceable_card_kinds(self):
        with self.assertRaises(ValueError):
            validate_rankings_dataset({"schemaVersion": 1, "generatedAt": "2026-10-13T01:00:00Z", "cards": []})

    def test_partial_outage_retains_failed_sources_last_known_good(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "sources.json"
            output = root / "news.json"
            config.write_text(json.dumps({"requestTimeoutSeconds": 1, "maxAttempts": 1, "backoffSeconds": 0, "maxNewsItems": 20, "sources": [source("lab"), source("project")]}))
            payloads = {"https://example.org/lab.xml": RSS, "https://example.org/project.xml": ATOM}
            run_news_pipeline(config_path=config, output_path=output, now=NOW, fetcher=lambda url, timeout: payloads[url])
            payloads.pop("https://example.org/lab.xml")

            def partial(url, timeout):
                if url not in payloads:
                    raise TimeoutError("source down")
                return payloads[url]

            run_news_pipeline(config_path=config, output_path=output, now=datetime(2026, 10, 13, 2, tzinfo=timezone.utc), fetcher=partial)
            dataset = json.loads(output.read_text())
            self.assertEqual({item["sourceId"] for item in dataset["news"]}, {"lab", "project"})
            self.assertEqual(next(status for status in dataset["sources"] if status["id"] == "lab")["status"], "unavailable")

    def test_total_outage_preserves_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "sources.json"
            output = root / "news.json"
            config.write_text(json.dumps({"requestTimeoutSeconds": 1, "maxAttempts": 1, "backoffSeconds": 0, "maxNewsItems": 20, "sources": [source("lab")]}))
            run_news_pipeline(config_path=config, output_path=output, now=NOW, fetcher=lambda url, timeout: RSS)
            before = output.read_text()
            run_news_pipeline(config_path=config, output_path=output, now=NOW, fetcher=lambda url, timeout: (_ for _ in ()).throw(TimeoutError()))
            self.assertEqual(json.loads(output.read_text())["news"], json.loads(before)["news"])
            self.assertEqual(json.loads(output.read_text())["sources"][0]["status"], "unavailable")

    def test_unchanged_healthy_feeds_do_not_rewrite_dataset(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            config = root / "sources.json"
            output = root / "news.json"
            config.write_text(json.dumps({"requestTimeoutSeconds": 1, "maxAttempts": 1, "backoffSeconds": 0, "maxNewsItems": 20, "sources": [source("lab")]}))
            run_news_pipeline(config_path=config, output_path=output, now=NOW, fetcher=lambda url, timeout: RSS)
            before = output.read_text()
            changed = run_news_pipeline(config_path=config, output_path=output, now=datetime(2026, 10, 13, 2, tzinfo=timezone.utc), fetcher=lambda url, timeout: RSS)
            self.assertFalse(changed)
            self.assertEqual(output.read_text(), before)


if __name__ == "__main__":
    unittest.main()
