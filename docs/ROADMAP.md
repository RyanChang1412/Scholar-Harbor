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

## 2. Paper data and discovery — planned

- First reviewed paper source adapter and normalized versioned schema.
- Paper lists, detail pages, identity, provenance, search/filtering, and freshness.
- Deterministic ingestion tests and bounded public artifacts.

## 3. Personalization and library — planned

- Editable research profile and deterministic Balanced Discovery.
- Local saved/reading state, tags, import/export, migration, and reset.
- Explainable recommendations and privacy validation.

## 4. Context modules — planned

- Reviewed news feeds and deduplication.
- Traceable Trending signals and authoritative ranking links/summaries.
- Research Pulse using only defined source-backed data.

## 5. Production automation and optional AI — planned

- Scheduled least-privileged ingestion workflow with validated dataset commits.
- Cloudflare Workers Builds production connection and deployment verification.
- Optional cached AI enrichment in trusted CI/server context with graceful failure.

Do not begin optional AI work before the non-AI publication path is reliable.
