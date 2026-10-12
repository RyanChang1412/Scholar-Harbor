# Data sources and publication policy

## Status

No external source adapter, feed, dataset, or ingestion workflow is implemented
yet. Every source must be reviewed and recorded here before production use.

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

## AI enrichment

AI processing is optional and runs only in a trusted context. Cache output using a
fingerprint of normalized source content plus prompt version. Store the generation
time and whether the model saw title/abstract or full text. AI output must never
block publication of otherwise valid original metadata.
