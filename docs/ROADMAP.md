# Incremental roadmap

This roadmap protects the project from attempting the full product in one pass.
The exact content of each implementation phase can be refined by a later phase
prompt, but changes must preserve the contracts in `AGENTS.md`.

## 0. Contract baseline — complete

- Product, architecture, data, design, testing, and deployment documentation.
- Cloudflare Workers Static Assets SPA routing baseline.
- Repository hygiene defaults.

No application behavior is delivered by this phase.

## 1. Frontend foundation — complete

- Reproducible React + strict TypeScript + Vite project and lockfile.
- Routing shell, semantic layout, design tokens, and representative states.
- Runtime schema boundary with a small deterministic fixture dataset.
- Test, lint, typecheck, build, and Wrangler preview commands.
- Validate direct refresh of a representative detail route.

Phase 01 uses clearly labeled fictional fixtures only. It does not implement live
data, recommendation scoring, or personal storage.

## 2. Paper data and discovery — complete

- Runtime-validated normalized Paper schema and replaceable repository boundary.
- Fixture-backed For You, chronological Latest, and mock-signal-backed Trending.
- URL-backed search, topic/source/time filters, sorting, and bounded pagination.
- Stable detail pages with provenance, safe links, original abstracts, explicit
  AI-unavailable handling, citation copy, and local bookmark/reading status.
- Deterministic domain, repository, component, navigation, and browser tests.

Phase 02 deliberately excluded live APIs; Phase 03 added them without changing
the Phase 02 fixture-based development contract.

## 3. Real academic data — complete

- Official arXiv and Hugging Face Papers retrieval with optional OpenAlex DOI
  enrichment.
- Canonical revision handling, provenance-preserving deduplication, topic tags,
  runtime validation, bounded versioned output, and atomic publication.
- Timeouts, rate limiting, bounded retries, source isolation, structured logs,
  last-known-good protection, and unchanged-output suppression.
- Scheduled/manual least-privilege GitHub Actions publication to `main`, which
  triggers the existing Cloudflare build.
- Production frontend loading and validation of genuine source-backed records.

## 4. Personalization, library, and optional AI — complete

- Editable research profile and deterministic Balanced Discovery.
- Local saved/reading state, tags, import/export, migration, and reset.
- Explainable recommendations and privacy validation.
- Optional bounded Alibaba Cloud Model Studio, OpenAI, or DeepSeek enrichment
  with structured output, provider/prompt/model-aware cache reuse, and
  credential-free degradation.

## 5. Context, integration, and deployment readiness — complete

- Reviewed official news feeds with schema validation, deduplication, filtering,
  provenance, and per-source recovery.
- Cached Hugging Face signal summary and authoritative GitHub Trending/LMArena
  official links with explicit status labels.
- Source-backed Research Pulse snapshot counts and homepage integration.
- Production security/content verification, responsive browser validation, and
  Cloudflare Workers Static Assets packaging.

## Deployment activation — external configuration

- Connect the public repository to Cloudflare Workers Builds and confirm the
  account-specific `workers.dev` URL. This requires the repository owner's
  Cloudflare account and cannot be represented as completed by source code.

Do not begin optional AI work before the non-AI publication path is reliable.
