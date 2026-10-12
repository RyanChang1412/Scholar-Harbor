# Scholar Harbor development rules

This file is the persistent engineering contract for contributors and coding
agents. Read it before changing the repository.

## Scope and execution

- Inspect the repository and preserve working behavior before editing.
- Implement only the requested phase. Do not build all product modules from the
  master specification in one pass.
- Keep documentation aligned with behavior that was actually implemented and
  commands that were actually run.
- Report blocked integrations and provide explicit, labeled fallback behavior.
- Never claim that a build, test, API call, or deployment succeeded without
  executing it successfully.

## Architectural invariants

- Papers are the primary product surface.
- Keep presentation, domain, data access, recommendation, personal state, and
  ingestion concerns separate.
- External provider responses never flow directly into UI components. Normalize
  and runtime-validate them at the ingestion/data boundary.
- Keep public academic data separate from private personal state. V1 personal
  state lives only in versioned browser-local storage with import, export, and
  reset support.
- Keep TypeScript strict mode enabled. Prefer explicit schemas, pure domain
  functions, deterministic fixtures, and small integration adapters.
- Missing metadata stays missing. Preserve provenance and never fabricate facts,
  rankings, citations, links, dates, scores, or AI conclusions.
- AI enrichment is optional, cached, labeled, and performed only in CI or another
  trusted server-side context. The original metadata path must work without it.
- “For You” targets a 70/30 Focused/Explore composition. “Latest” remains
  chronological. “Trending” uses only traceable source-backed signals.

## Deployment invariants

- Production frontend hosting is Cloudflare Workers Static Assets on
  `workers.dev`; the Worker and Wrangler names are both `scholar-harbor`.
- Use root-relative frontend routing and
  `assets.not_found_handling = "single-page-application"` so detail routes can be
  refreshed directly.
- Cloudflare Workers Builds with GitHub integration is the sole production
  frontend deployment mechanism.
- Do not add GitHub Pages configuration, Pages base paths, Pages workflows, or a
  competing GitHub Actions deployment.
- Scheduled GitHub Actions may ingest public data. They must use minimal
  permissions and deliver accepted dataset changes to `main`; the resulting
  commit triggers Cloudflare's production build.
- Never expose credentials in frontend bundles, public JSON, logs, fixtures, or
  Git history. Use GitHub Secrets for ingestion and Cloudflare build secrets only
  when a phase actually needs them.

## Quality gates

- Use the committed lockfile and frozen/reproducible installation command once a
  package manifest exists.
- Relevant normalization, deduplication, recommendation, storage, navigation,
  accessibility, responsive, and production-build checks must pass for the phase
  that introduces those capabilities.
- Tests must not depend on live external APIs unless clearly marked as separate
  integration tests.
- Handle loading, empty, stale, missing-data, and error states in every feature
  phase that can produce them.
- Target WCAG 2.2 AA, keyboard access, visible focus, safe external links, and
  reduced-motion support.

## Repository hygiene

- Do not commit generated personal state, API keys, tokens, local environment
  files, dependency caches, build output, or ingestion scratch data.
- Keep fictional fixtures limited to development and automated-test routes. The
  default production build must use production-safe empty states and pass the
  build-content verification script.
- Do not create a worktree during cloud tasks unless the user explicitly asks for
  one; use the checkout already provided under `/workspace`.
