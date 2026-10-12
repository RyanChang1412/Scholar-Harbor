from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from .pipeline import run_pipeline


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
    args = parser.parse_args()
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler])
    try:
        changed = run_pipeline(config_path=args.config, output_path=args.output)
    except Exception as error:
        logging.getLogger(__name__).error("pipeline_failed", extra={"error_type": type(error).__name__})
        return 1
    logging.getLogger(__name__).info("pipeline_complete", extra={"paper_count": "changed" if changed else "unchanged"})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
