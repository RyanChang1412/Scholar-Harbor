from __future__ import annotations

import hashlib
import html
import json
import logging
import os
import re
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .http import fetch_bytes, with_retries
from .models import utc_iso

LOGGER = logging.getLogger(__name__)
TRACKING_PARAMETERS = {"ref", "source", "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term"}


def _text(value: str | None) -> str:
    plain = re.sub(r"<[^>]+>", " ", html.unescape(value or ""))
    plain = re.sub(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", "[contact removed]", plain)
    return re.sub(r"\s+", " ", plain).strip()


def _canonical_url(value: str) -> str:
    parts = urlsplit(value)
    if parts.scheme != "https" or not parts.netloc:
        raise ValueError("news URLs must use HTTPS")
    query = urlencode([(key, val) for key, val in parse_qsl(parts.query) if key.lower() not in TRACKING_PARAMETERS])
    return urlunsplit((parts.scheme, parts.netloc.lower(), parts.path.rstrip("/") or "/", query, ""))


def _date(value: str) -> str:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        parsed = parsedate_to_datetime(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return utc_iso(parsed)


def parse_feed(payload: bytes, source: dict[str, Any], retrieved_at: str, max_items: int | None = None) -> list[dict[str, Any]]:
    root = ET.fromstring(payload)
    records: list[dict[str, Any]] = []
    if root.tag.endswith("feed"):
        entries = root.findall("{*}entry")[:max_items]
        for entry in entries:
            link = next((node.attrib.get("href") for node in entry.findall("{*}link") if node.attrib.get("rel", "alternate") == "alternate"), None)
            headline = _text(entry.findtext("{*}title"))
            description = _text(entry.findtext("{*}summary") or entry.findtext("{*}content"))
            published = entry.findtext("{*}published") or entry.findtext("{*}updated")
            if link and headline and description and published:
                records.append(_record(source, link, headline, description, published, retrieved_at))
    else:
        for item in root.findall(".//item")[:max_items]:
            link = _text(item.findtext("link"))
            headline = _text(item.findtext("title"))
            description = _text(item.findtext("description") or item.findtext("{*}encoded"))
            if not description and source.get("headlineOnlyDescription"):
                description = f"Official post from {source['name']}: {headline}"
            published = _text(item.findtext("pubDate") or item.findtext("{*}date"))
            if link and headline and description and published:
                records.append(_record(source, link, headline, description, published, retrieved_at))
    return records


def _record(source: dict[str, str], link: str, headline: str, description: str, published: str, retrieved_at: str) -> dict[str, Any]:
    canonical = _canonical_url(link)
    identifier = hashlib.sha256(canonical.encode()).hexdigest()[:20]
    if description.startswith(("Signed-off-by:", "Co-authored-by:")):
        description = f"Official release notes from {source['name']} for {headline}."
    return {
        "id": f"news-{identifier}",
        "headline": headline,
        "source": source["name"],
        "sourceId": source["id"],
        "originalUrl": canonical,
        "publishedAt": _date(published),
        "retrievedAt": retrieved_at,
        "description": description[:560],
        "category": source["category"],
        "topics": [],
    }


def validate_news_dataset(dataset: dict[str, Any]) -> None:
    if dataset.get("schemaVersion") != 1 or not isinstance(dataset.get("news"), list) or not dataset["news"]:
        raise ValueError("a non-empty version 1 news dataset is required")
    utc_iso(dataset.get("generatedAt", ""))
    utc_iso(dataset.get("lastSuccessfulUpdateAt", ""))
    sources = dataset.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError("news source metadata is required")
    for source in sources:
        if (
            not isinstance(source, dict)
            or not isinstance(source.get("id"), str)
            or source.get("status") not in {"ok", "unavailable"}
            or not isinstance(source.get("recordCount"), int)
            or source["recordCount"] < 0
        ):
            raise ValueError("news source metadata is invalid")
        if source.get("lastSuccessfulUpdateAt"):
            utc_iso(source["lastSuccessfulUpdateAt"])
    seen_ids: set[str] = set()
    seen_urls: set[str] = set()
    for item in dataset["news"]:
        required = ("id", "headline", "source", "sourceId", "originalUrl", "publishedAt", "retrievedAt", "description", "category")
        if not all(isinstance(item.get(key), str) and item[key].strip() for key in required):
            raise ValueError("news record has missing fields")
        if not item["id"].startswith("news-") or item["id"] in seen_ids:
            raise ValueError("news identity is invalid or duplicated")
        canonical = _canonical_url(item["originalUrl"])
        if canonical in seen_urls:
            raise ValueError("news URL is duplicated")
        _date(item["publishedAt"])
        _date(item["retrievedAt"])
        if not isinstance(item.get("topics"), list):
            raise ValueError("news topics must be a list")
        seen_ids.add(item["id"])
        seen_urls.add(canonical)


def _atomic_write(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w") as temporary:
            json.dump(payload, temporary, ensure_ascii=False, indent=2, sort_keys=True)
            temporary.write("\n")
            temporary.flush()
            os.fsync(temporary.fileno())
        os.replace(temporary_name, path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def _stable_news(news: list[dict[str, Any]]) -> str:
    clean = [{key: value for key, value in item.items() if key != "retrievedAt"} for item in news]
    return json.dumps(clean, sort_keys=True, separators=(",", ":"))


def _source_health(sources: list[dict[str, Any]]) -> list[tuple[str, str, int]]:
    return [(source["id"], source["status"], source["recordCount"]) for source in sources]


def run_news_pipeline(*, config_path: Path, output_path: Path, now: datetime | None = None, fetcher=fetch_bytes) -> bool:
    config = json.loads(config_path.read_text())
    now_iso = utc_iso(now or datetime.now(timezone.utc))
    existing: dict[str, Any] | None = None
    if output_path.exists():
        loaded = json.loads(output_path.read_text())
        validate_news_dataset(loaded)
        existing = loaded
    records: list[dict[str, Any]] = []
    statuses: list[dict[str, Any]] = []
    failed_ids: set[str] = set()
    successful_sources = 0
    previous_sources = {item["id"]: item for item in existing.get("sources", [])} if existing else {}
    for source in config["sources"]:
        try:
            payload = with_retries(lambda source=source: fetcher(source["feedUrl"], timeout=config["requestTimeoutSeconds"]), source=source["id"], attempts=config["maxAttempts"], backoff=config["backoffSeconds"])
            source_records = parse_feed(payload, source, now_iso, config.get("maxItemsPerSource"))
            if not source_records:
                raise ValueError("feed returned no usable items")
            records.extend(source_records)
            statuses.append({"id": source["id"], "status": "ok", "lastSuccessfulUpdateAt": now_iso, "recordCount": len(source_records)})
            successful_sources += 1
        except Exception as error:
            failed_ids.add(source["id"])
            status = {"id": source["id"], "status": "unavailable", "recordCount": 0}
            last_success = previous_sources.get(source["id"], {}).get("lastSuccessfulUpdateAt")
            if last_success:
                status["lastSuccessfulUpdateAt"] = last_success
            statuses.append(status)
            LOGGER.error("news_source_failed", extra={"source": source["id"], "error_type": type(error).__name__})
    if existing and failed_ids:
        records.extend(item for item in existing["news"] if item["sourceId"] in failed_ids)
    if not records:
        raise RuntimeError("all news sources failed; last-known-good dataset preserved")
    by_url: dict[str, dict[str, Any]] = {}
    seen_headlines: set[str] = set()
    for record in records:
        key = _canonical_url(record["originalUrl"])
        headline_key = re.sub(r"[^a-z0-9]+", " ", record["headline"].lower()).strip()
        if headline_key in seen_headlines and key not in by_url:
            continue
        current = by_url.get(key)
        if current is None or record["retrievedAt"] > current["retrievedAt"]:
            by_url[key] = record
            seen_headlines.add(headline_key)
    news = sorted(by_url.values(), key=lambda item: (item["publishedAt"], item["id"]), reverse=True)[: config["maxNewsItems"]]
    last_successful_update = now_iso if successful_sources else existing["lastSuccessfulUpdateAt"]
    dataset = {"schemaVersion": 1, "generatedAt": now_iso, "lastSuccessfulUpdateAt": last_successful_update, "sources": statuses, "news": news}
    validate_news_dataset(dataset)
    if existing and _stable_news(existing["news"]) == _stable_news(news) and _source_health(existing["sources"]) == _source_health(statuses):
        return False
    _atomic_write(output_path, dataset)
    return True


def build_rankings(*, papers_path: Path, output_path: Path, now: datetime | None = None) -> bool:
    papers_dataset = json.loads(papers_path.read_text())
    generated_at = utc_iso(now or datetime.now(timezone.utc))
    scored: list[tuple[int, dict[str, Any], str]] = []
    for paper in papers_dataset["papers"]:
        hf_signals = [signal for signal in paper.get("communitySignals", []) if signal["source"].startswith("Hugging Face") and not signal["fixture"]]
        if hf_signals:
            score = sum(int(signal["value"]) for signal in hf_signals)
            label = " · ".join(f"{int(signal['value'])} {signal['kind']}" for signal in hf_signals)
            scored.append((score, paper, label))
    scored.sort(key=lambda row: (-row[0], row[1]["id"]))
    payload = {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "cards": [
            {
                "id": "hugging-face-papers-snapshot",
                "kind": "cached-summary",
                "title": "Hugging Face Papers snapshot",
                "description": "A cached summary ordered from source-backed Hugging Face community signals in the current paper dataset.",
                "source": "Hugging Face Papers",
                "url": "https://huggingface.co/papers/trending",
                "retrievedAt": papers_dataset["lastSuccessfulUpdateAt"],
                "items": [{"paperId": paper["id"], "title": paper["title"], "signalLabel": label} for _, paper, label in scored[:10]],
            },
            {"id": "github-trending", "kind": "official-link", "title": "GitHub Trending", "description": "Open GitHub's live Trending page for current repository discovery.", "source": "GitHub", "url": "https://github.com/trending"},
            {"id": "lmarena-leaderboard", "kind": "official-link", "title": "LMArena Leaderboard", "description": "Open the official LMArena leaderboard for its current model comparison results and methodology.", "source": "LMArena", "url": "https://lmarena.ai/leaderboard"},
        ],
    }
    validate_rankings_dataset(payload)
    stable = json.dumps(payload["cards"], sort_keys=True, separators=(",", ":"))
    if output_path.exists():
        existing = json.loads(output_path.read_text())
        if json.dumps(existing.get("cards"), sort_keys=True, separators=(",", ":")) == stable:
            return False
    _atomic_write(output_path, payload)
    return True


def validate_rankings_dataset(dataset: dict[str, Any]) -> None:
    if dataset.get("schemaVersion") != 1:
        raise ValueError("unsupported rankings schema")
    utc_iso(dataset.get("generatedAt", ""))
    cards = dataset.get("cards")
    if not isinstance(cards, list) or len(cards) < 3:
        raise ValueError("rankings require one summary and two official links")
    kinds = [card.get("kind") for card in cards if isinstance(card, dict)]
    if kinds.count("cached-summary") != 1 or kinds.count("official-link") < 2:
        raise ValueError("ranking card kinds are invalid")
    for card in cards:
        if not all(isinstance(card.get(key), str) and card[key].strip() for key in ("id", "title", "description", "source", "url")):
            raise ValueError("ranking card metadata is invalid")
        _canonical_url(card["url"])
        if card["kind"] == "cached-summary":
            utc_iso(card.get("retrievedAt", ""))
            if not isinstance(card.get("items"), list):
                raise ValueError("ranking summary items are invalid")
