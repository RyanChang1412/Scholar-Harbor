# Data sources and publication policy

## Status

No external source adapter, feed, dataset, or ingestion workflow is implemented
yet. Phase 02 uses only fictional, visibly labeled records from `src/fixtures`.
Every real source must be reviewed and recorded here before production use.

The fixture records include invented provenance entries and invented community
signals solely to validate schema, ordering, and interface behavior. Trending
uses a deterministic score over those labeled mock signals. Fixture URLs use the
reserved non-resolving `example.invalid` domain and have a `fixture`
verification status; they are never presented as verified live destinations.

## Source acceptance requirements

A source is acceptable only when its access method is documented and permitted,
its records can be attributed, and its update behavior and failure modes are
understood. Prefer official APIs and approved RSS/Atom feeds. Do not scrape around
access controls or represent inferred signals as official rankings.

For each implemented source, record:

| Field             | Required record                                            |
| ----------------- | ---------------------------------------------------------- |
| Provider          | Official name and owner                                    |
| Purpose           | Papers, metadata, news, ranking links, or community signal |
| Endpoint/feed     | Public documentation URL, not a secret-bearing request     |
| Terms/rate limits | Relevant permitted-use and request constraints             |
| Identity          | arXiv ID, DOI, provider ID, or another stable key          |
| Update cadence    | Schedule and expected source latency                       |
| Provenance        | Fields retained in public artifacts                        |
| Failure behavior  | Retry, stale-data fallback, and publication gate           |
| Credentials       | Requirement name and storage location; never the value     |

## Planned source categories

- Paper metadata from official academic APIs and feeds.
- DOI/citation metadata from authoritative services when permitted.
- Academic and research-engineering news from selected attributed feeds.
- Ranking summaries only from structured authoritative sources; otherwise expose
  descriptive links to the official ranking pages.
- Trending signals only when their source, retrieval time, and meaning are
  recorded. Absence of a signal is not a negative score.

These categories do not approve a particular provider. A feature phase must
evaluate the concrete provider and update this document.

## Normalization and integrity

Adapters map provider records into internal schemas before any frontend use.
Canonical matching prioritizes arXiv IDs and DOI values, with conservative title
matching as a fallback. Deduplication preserves provenance and cannot overwrite a
reliable value with a less reliable one silently.

Record publication, update, retrieval, enrichment, and AI-generation timestamps
separately. Keep missing metadata absent. Public artifacts include a schema
version and generation metadata, remain bounded for browser performance, and pass
runtime validation before publication.

## Publication contract

The scheduled ingestion workflow builds proposed artifacts in isolation and
publishes only after validation. Accepted changes are committed to `main` by a
least-privileged GitHub Actions publishing job (or merged through a protected
automated data PR). The resulting `main` commit triggers the existing Cloudflare
Workers Build so the new dataset reaches production.

Do not deploy the frontend from the ingestion workflow. Do not commit temporary
downloads, logs, credentials, personal state, or unvalidated output. If ingestion
or optional AI enrichment fails, retain the last accepted public dataset and make
freshness visible to the frontend.

## Operational reliability contract

Future ingestion must run unattended and remain safe to rerun. Each adapter must
use documented timeouts, rate limits, bounded retries with backoff, and stable
checkpoints or conditional requests where the provider supports them. Scheduled
runs must use concurrency control, treat an unchanged dataset as success, and
publish atomically only after validation.

A transient provider, network, or optional-enrichment failure must leave the
last accepted dataset available. The workflow must report an actionable failure
summary without logging credentials or requiring routine daily intervention.
Repeated failures may require a deliberate source review, but a normal failed run
must never corrupt production data or create a manual repair loop.

## AI enrichment

AI processing is optional and runs only in a trusted context. Cache output using a
fingerprint of normalized source content plus prompt version. Store the generation
time and whether the model saw title/abstract or full text. AI output must never
block publication of otherwise valid original metadata.
