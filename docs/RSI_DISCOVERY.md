# RSI research discovery enhancement

## Diagnostic finding

The earlier pipeline was healthy but poorly aligned with an RSI-focused profile.
Its arXiv adapter issued one recent, category-wide query, retained only records
containing one of eight broad words, and assigned seven hard-coded topics. The
rule for `Machine learning` included the word `model`, which admitted generic
work. Meanwhile, a Settings value such as `Recursive Self-Improvement` could not
match any generated topic because browser recommendation used exact,
case-sensitive topic labels. Topic weights inherited that same mismatch. The AI
cache was not involved in classification, so clearing it could not improve the
candidate pool.

The public dataset inspected before this change contained 53 papers. Four had
direct self-improvement language, while the generated labels were dominated by
`Machine learning` (44) and `LLM systems` (33). No record carried a retrieval
query, classification evidence, or relevance level. A 30-day arXiv window also
made older work disappear unless it happened to arrive through a source-backed
community signal.

## Implemented model

`config/research-taxonomy.v1.json` is the shared, versioned ontology used by
Python ingestion and TypeScript recommendation. It groups canonical topics into:

- core RSI and AI self-evolution;
- enabling training, inference, serving, and agent systems;
- AI-for-science applications;
- embodied and robotics applications;
- open adjacent exploration.

Each topic has a stable ID, human label, aliases, common abbreviations where
appropriate, and optional related-topic and exclusion lists. The bare acronym
`RSI` requires AI context and is rejected when `relative strength index` or
`repetitive strain injury` is present. Unicode, case, whitespace, punctuation,
and hyphens are normalized before phrase-boundary matching.

Matching is deterministic and produces the levels `direct-rsi`,
`enabling-systems`, `application-research`, `adjacent-exploration`, or
`ineligible`. Every accepted match records the topic, confidence, matched term,
and whether the evidence came from the source title or abstract. Optional AI
enrichment remains separate from this decision. No model call is needed for the
current deterministic classifier; any later semantic fallback must run only for
unresolved ambiguous records and must not override original metadata.

## Retrieval and historical coverage

Daily ingestion uses five bounded arXiv query groups plus five bounded Hugging
Face Papers searches. Every normalized record retains its source, query group,
exact public query, retrieval time, and whether it came from a historical run.
Canonical arXiv IDs deduplicate records while preserving all query attribution.

Historical discovery is an explicit, bounded operation:

```sh
PYTHONPATH=ingestion .venv/bin/python -m scholar_harbor_ingest.cli --historical-backfill
```

GitHub Actions exposes the same operation as the manual
`historical_backfill` input. Scheduled daily runs do not execute historical
queries. Accepted historical records remain eligible for up to the configured
retention window and are carried forward by normal runs, so coverage does not
depend on repeating a full-history search every day.

Provider timeouts, bounded retry/backoff, source-isolated failure handling,
atomic publication, last-known-good retention, schema validation, and unchanged
dataset detection still apply. Retrieval timestamps are excluded from content
fingerprints, avoiding meaningless daily commits.

## Recommendation and private profile behavior

Settings labels and aliases resolve to canonical topic IDs at runtime. Unknown
custom topics remain supported and match normalized source topic metadata. A
focused topic can use explicit related-topic edges at reduced relevance. Topic
weights resolve through canonical IDs, and the Settings weight controls update
immediately while the focused-topic text is edited.

Balanced Discovery still selects approximately 70% Focused and 30% Explore,
relaxes a missing lane, deduplicates IDs, and uses deterministic MMR reranking.
Similarity now includes mechanism/application groups as well as paper topics and
categories. Reasons cite a matched term and its source field. Latest remains
chronological, and Trending remains based only on traceable community signals.

## Evaluation contract

`config/evaluation/rsi-discovery-benchmark.v1.json` contains six real arXiv
metadata examples and four clearly marked synthetic hard negatives. The fixed
set is intentionally small and is not a production quality estimate. Run:

```sh
python3 scripts/evaluate-rsi-discovery.py
```

The report compares the previous broad keyword/topic rules with the enhanced
classifier on the same labeled records. It reports eligible precision, recall,
F1, exact relevance-level accuracy, per-record labels, and matched canonical
topics. Live ingestion smoke results are reported separately because daily
retrieval volume is operational telemetry rather than labeled relevance truth.

## V1.4 verification record

Validated on 2026-10-13:

- the fixed set improved eligible precision from `0.75` to `1.00`, retained
  `1.00` recall, and improved exact relevance-level accuracy from `0.20` to
  `1.00`;
- the official-source backfill smoke retrieved 148 raw / 147 unique arXiv
  records and 36 raw / 36 unique Hugging Face records;
- after cross-source normalization, 183 candidates produced 127 eligible
  in-window records, 31 evidence-free rejections, and 25 otherwise relevant
  records outside retention; the bounded artifact selected 96;
- selected relevance levels were 36 Direct RSI, 19 Enabling Systems, 32
  Application Research, and 9 Adjacent Exploration; 16 selected records carried
  historical-query attribution;
- the default local profile selected 7 Focused and 3 Explore records without
  quota relaxation.

Both official sources completed successfully. AI enrichment was skipped because
no provider credential was configured, as intended. Counts describe that one
smoke run and are not future acceptance thresholds.
