from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from .pipeline import run_pipeline
from .content_pipeline import build_rankings, run_news_pipeline


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {"level": record.levelname.lower(), "event": record.getMessage()}
        for key in ("source", "record_count", "paper_count", "error_type", "output"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        return json.dumps(payload, sort_keys=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Scholar Harbor's validated public paper dataset.")
    parser.add_argument("--config", type=Path, default=Path("config/ingestion.json"))
    parser.add_argument("--output", type=Path, default=Path("public/data/papers.v1.json"))
    parser.add_argument("--content-config", type=Path, default=Path("config/content-sources.json"))
    parser.add_argument("--news-output", type=Path, default=Path("public/data/news.v1.json"))
    parser.add_argument("--rankings-output", type=Path, default=Path("public/data/rankings.v1.json"))
    args = parser.parse_args()
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler])
    try:
        paper_changed = run_pipeline(config_path=args.config, output_path=args.output)
        news_changed = run_news_pipeline(config_path=args.content_config, output_path=args.news_output)
        rankings_changed = build_rankings(papers_path=args.output, output_path=args.rankings_output)
    except Exception as error:
        logging.getLogger(__name__).error("pipeline_failed", extra={"error_type": type(error).__name__})
        return 1
    logging.getLogger(__name__).info(
        "pipeline_complete",
        extra={"paper_count": "changed" if any((paper_changed, news_changed, rankings_changed)) else "unchanged"},
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
