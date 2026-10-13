from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "ingestion"))

from scholar_harbor_ingest.evaluation import evaluate  # noqa: E402


if __name__ == "__main__":
    report = evaluate(
        ROOT / "config/evaluation/rsi-discovery-benchmark.v1.json",
        ROOT / "config/research-taxonomy.v1.json",
    )
    print(json.dumps(report, indent=2, sort_keys=True))
