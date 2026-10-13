from __future__ import annotations

import logging
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Protocol

from .http import fetch_bytes, fetch_json, with_retries
from .models import base_arxiv_id, utc_iso

LOGGER = logging.getLogger(__name__)
ATOM = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}


class SourceAdapter(Protocol):
    source_id: str
    def fetch(self) -> list[dict[str, Any]]: ...


def _text(element: ET.Element, path: str) -> str:
    node = element.find(path, ATOM)
    if node is None or node.text is None:
        return ""
    return " ".join(node.text.split())


class ArxivAdapter:
    source_id = "arxiv"

    def __init__(self, categories: list[str], keywords: list[str] | None = None, max_results: int | None = None, timeout: float = 20, attempts: int = 3, backoff: float = 2, *, query_groups: list[dict[str, Any]] | None = None, historical_query_groups: list[dict[str, Any]] | None = None, include_historical: bool = False, request_delay: float = 3):
        self.categories = categories
        self.keywords = keywords
        self.max_results = max_results
        self.timeout = timeout
        self.attempts = attempts
        self.backoff = backoff
        self.query_groups = query_groups
        self.historical_query_groups = historical_query_groups or []
        self.include_historical = include_historical
        self.request_delay = request_delay

    def fetch(self) -> list[dict[str, Any]]:
        if self.query_groups is None:
            query = " OR ".join(f"cat:{category}" for category in self.categories)
            records = self._fetch_query(query, self.max_results or 48, "legacy-broad", False, "submittedDate")
            self.raw_record_count = len(records)
            return records
        groups = list(self.query_groups)
        if self.include_historical:
            groups.extend({**group, "historical": True} for group in self.historical_query_groups)
        merged: dict[str, dict[str, Any]] = {}
        self.raw_record_count = 0
        category_query = " OR ".join(f"cat:{category}" for category in self.categories)
        for index, group in enumerate(groups):
            if index:
                time.sleep(self.request_delay)
            term_query = " OR ".join(f'all:"{term}"' for term in group["terms"])
            query = f"({term_query}) AND ({category_query})"
            historical = bool(group.get("historical"))
            records = self._fetch_query(
                query,
                int(group["maxResults"]),
                group["id"],
                historical,
                "relevance" if historical else "submittedDate",
            )
            self.raw_record_count += len(records)
            for record in records:
                key = base_arxiv_id(record["arxivId"])
                if key in merged:
                    merged[key]["retrievalContexts"].extend(record["retrievalContexts"])
                else:
                    merged[key] = record
        return list(merged.values())

    def _fetch_query(self, query: str, max_results: int, group: str, historical: bool, sort_by: str) -> list[dict[str, Any]]:
        params = urllib.parse.urlencode({"search_query": query, "start": 0, "max_results": max_results, "sortBy": sort_by, "sortOrder": "descending"})
        payload = with_retries(lambda: fetch_bytes(f"https://export.arxiv.org/api/query?{params}", timeout=self.timeout), source=self.source_id, attempts=self.attempts, backoff=self.backoff)
        records = self.parse(payload)
        for record in records:
            record["retrievalContexts"] = [{"queryGroup": group, "query": query, "historical": historical}]
        if self.query_groups is None and self.keywords:
            return [record for record in records if any(keyword.casefold() in f"{record['title']} {record['abstract']}".casefold() for keyword in self.keywords)]
        return records

    @staticmethod
    def parse(payload: bytes) -> list[dict[str, Any]]:
        root = ET.fromstring(payload)
        records: list[dict[str, Any]] = []
        for entry in root.findall("atom:entry", ATOM):
            raw_id = _text(entry, "atom:id").rsplit("/", 1)[-1]
            if not raw_id:
                continue
            links = {link.attrib.get("title", link.attrib.get("rel", "")): link.attrib.get("href", "") for link in entry.findall("atom:link", ATOM)}
            doi = _text(entry, "arxiv:doi") or None
            records.append({
                "source": "arXiv",
                "sourceRecordId": raw_id,
                "arxivId": raw_id,
                "doi": doi,
                "title": _text(entry, "atom:title"),
                "authors": [_text(author, "atom:name") for author in entry.findall("atom:author", ATOM)],
                "abstract": _text(entry, "atom:summary"),
                "publishedAt": utc_iso(_text(entry, "atom:published")),
                "updatedAt": utc_iso(_text(entry, "atom:updated")),
                "categories": [node.attrib["term"] for node in entry.findall("atom:category", ATOM) if node.attrib.get("term")],
                "paperUrl": links.get("alternate") or f"https://arxiv.org/abs/{raw_id}",
                "pdfUrl": links.get("pdf") or None,
            })
        return records


class HuggingFaceAdapter:
    source_id = "huggingface"

    def __init__(self, queries: list[str | dict[str, Any]], limit: int, timeout: float, attempts: int, backoff: float, request_delay: float):
        self.queries = queries
        self.limit = limit
        self.timeout = timeout
        self.attempts = attempts
        self.backoff = backoff
        self.request_delay = request_delay

    def fetch(self) -> list[dict[str, Any]]:
        def operation(query: str, limit: int) -> list[Any]:
            import httpx2
            from huggingface_hub import HfApi, set_client_factory
            set_client_factory(
                lambda: httpx2.Client(
                    timeout=self.timeout,
                    follow_redirects=True,
                )
            )
            return list(HfApi().list_papers(query=query, limit=limit, token=False))

        papers: dict[str, tuple[Any, list[dict[str, Any]]]] = {}
        self.raw_record_count = 0
        for index, query_config in enumerate(self.queries):
            if index:
                time.sleep(self.request_delay)
            query = query_config if isinstance(query_config, str) else query_config["query"]
            group = "legacy" if isinstance(query_config, str) else query_config["group"]
            per_query = max(1, min(10, self.limit // len(self.queries))) if isinstance(query_config, str) else int(query_config.get("maxResults", 6))
            found = with_retries(lambda query=query, per_query=per_query: operation(query, per_query), source=self.source_id, attempts=self.attempts, backoff=self.backoff)
            self.raw_record_count += len(found)
            for paper in found:
                context = {"queryGroup": group, "query": query, "historical": False}
                if paper.id in papers:
                    papers[paper.id][1].append(context)
                else:
                    papers[paper.id] = (paper, [context])
        records = []
        for paper, retrieval_contexts in list(papers.values())[: self.limit]:
            arxiv_id = getattr(paper, "id", "")
            if not arxiv_id or not getattr(paper, "title", None) or not getattr(paper, "summary", None):
                continue
            published = getattr(paper, "published_at", None) or datetime.now(timezone.utc)
            records.append({
                "source": "Hugging Face Papers",
                "sourceRecordId": arxiv_id,
                "arxivId": arxiv_id,
                "title": paper.title,
                "authors": [author.name for author in (paper.authors or []) if author.name],
                "abstract": paper.summary,
                "publishedAt": utc_iso(published),
                "updatedAt": utc_iso(published),
                "categories": [],
                "paperUrl": f"https://huggingface.co/papers/{base_arxiv_id(arxiv_id)}",
                "pdfUrl": f"https://arxiv.org/pdf/{base_arxiv_id(arxiv_id)}",
                "codeUrl": getattr(paper, "github_repo", None),
                "upvotes": getattr(paper, "upvotes", None),
                "comments": getattr(paper, "comments", None),
                "retrievalContexts": retrieval_contexts,
            })
        return records


class OpenAlexEnricher:
    source_id = "openalex"

    def __init__(self, api_key: str, timeout: float, attempts: int, backoff: float):
        self.api_key = api_key
        self.timeout = timeout
        self.attempts = attempts
        self.backoff = backoff

    def enrich(self, records: list[dict[str, Any]]) -> int:
        candidates = [record for record in records if record.get("doi")][:50]
        if not candidates:
            return 0
        dois = "|".join(record["doi"] for record in candidates)
        params = urllib.parse.urlencode(
            {
                "filter": f"doi:{dois}",
                "per-page": len(candidates),
                "select": "id,doi,cited_by_count",
                "api_key": self.api_key,
            }
        )
        response = with_retries(
            lambda: fetch_json(
                f"https://api.openalex.org/works?{params}", timeout=self.timeout
            ),
            source=self.source_id,
            attempts=self.attempts,
            backoff=self.backoff,
        )
        works = {
            work.get("doi", "").removeprefix("https://doi.org/").casefold(): work
            for work in response.get("results", [])
            if isinstance(work, dict)
        }
        enriched = 0
        for record in candidates:
            work = works.get(record["doi"].casefold())
            if not work:
                continue
            record["openAlexId"] = work.get("id")
            record["citationCount"] = work.get("cited_by_count")
            enriched += 1
        return enriched
