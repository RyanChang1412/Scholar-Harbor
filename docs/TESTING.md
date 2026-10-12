# Testing and acceptance gates

## Status

Phase 03 retains the frontend gates and adds deterministic Python tests for
source parsing, canonical identity, failure isolation, retries, historical-data
preservation, schema validation, and atomic/idempotent publication.

Run the default checks with:

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:ingestion
npm run format:check
npm run build
npm run deploy:dry-run
```

The production build includes `npm run verify:build`, which scans emitted text
assets and fails when it finds development fixture markers, common credential
formats, or email-like personal identifiers.

The browser suite starts the development server automatically and checks 375,
768, 1280, 1440, 2560 × 1440, and 2560 × 1600 px viewports. It covers required
routes, long-title bounds, unexpected horizontal scrolling, fixture labeling,
skip-link focus, and keyboard operation of the mobile menu. Phase-specific
screenshots are stored under `artifacts/phase-01/` and `artifacts/phase-02/`.

## Phase 01 validation record

Validated on 2026-10-12 in the onboarding environment:

| Check                               | Result                                                |
| ----------------------------------- | ----------------------------------------------------- |
| Frozen install (`npm ci`)           | Passed                                                |
| Strict TypeScript                   | Passed                                                |
| ESLint and Prettier                 | Passed                                                |
| Vitest component/route suite        | 14 passed                                             |
| Playwright browser suite            | 8 passed                                              |
| Target viewports                    | 375, 768, 1280, 1440, 2560×1440, and 2560×1600 passed |
| Vite production build               | Passed                                                |
| Production build-content scan       | Passed; 5 emitted text assets scanned                 |
| Wrangler packaging dry-run          | Passed; 16 static assets read                         |
| Wrangler local `/`                  | `200 OK`                                              |
| Wrangler local paper-detail refresh | `200 OK`; SPA fallback behavior confirmed             |
| Production runtime content check    | Passed; no fixture records rendered                   |

The desktop and mobile screenshots were inspected after the browser suite. They
showed readable type hierarchy, single-column mobile flow, bounded long titles,
and no unexpected horizontal overflow.

## Phase 02 validation record

Validated on 2026-10-12 in the onboarding environment:

| Check                               | Result                                                |
| ----------------------------------- | ----------------------------------------------------- |
| Strict TypeScript                   | Passed                                                |
| ESLint and Prettier                 | Passed                                                |
| Vitest domain/component/route suite | 36 passed                                             |
| Playwright browser suite            | 15 passed                                             |
| Target viewports                    | 375, 768, 1280, 1440, 2560×1440, and 2560×1600 passed |
| List/detail responsive screenshots  | Passed; mobile, desktop, and ultra-wide inspected     |
| Vite production build               | Passed                                                |
| Production build-content scan       | Passed; fixture records and sensitive patterns absent |
| Wrangler packaging dry-run          | Passed; 16 static assets read                         |

Phase 02 tests cover Paper runtime validation, stable identity, Latest and
Trending ordering, search, topic/source/time filters, pagination, empty/error
states, missing optional links, long metadata, detail navigation, safe external
links, citation copy, browser-local bookmarks/status, and Back/Forward filter
restoration.

## Phase 03 validation record

Validated on 2026-10-12 in the onboarding environment:

| Check                                           | Result                                            |
| ----------------------------------------------- | ------------------------------------------------- |
| Pinned Python dependency install                | Passed in isolated `.venv`                        |
| Python ingestion unit suite                     | 14 passed                                         |
| Live arXiv integration                          | Passed; 25 filtered records                       |
| Live Hugging Face integration                   | Passed; 28 records with traceable signals         |
| Immediate repeat ingestion                      | Passed; dataset unchanged and not rewritten       |
| Strict TypeScript, ESLint, Prettier             | Passed                                            |
| Vitest domain/component/route suite             | 36 passed                                         |
| Playwright browser suite                        | 15 passed                                         |
| Production mobile/desktop/ultra-wide inspection | Passed; no horizontal overflow                    |
| Vite build and production-content scan          | Passed; 6 text assets scanned                     |
| Direct production `/` and paper-detail requests | `200 OK`; dataset served with 53 validated papers |
| Wrangler packaging dry-run                      | Passed; 18 static assets read                     |

OpenAlex API connectivity was verified independently. The generated dataset did
not enable OpenAlex enrichment, so no private credential was requested and no
OpenAlex-derived field is claimed in the artifact.

## Test strategy

Use deterministic fixtures for core behavior. Live provider calls belong only in
explicit integration tests and are not part of the default unit suite. Tests must
exercise behavior that can fail rather than mirror implementation details.
Ingestion acceptance prioritizes recovery from unavailable or malformed sources,
strict published-schema validation, and retained source provenance. The number of
papers returned on a particular day is diagnostic information, not a pass/fail
threshold.

## Required coverage by capability

### Data and identity

- Provider-to-domain normalization.
- DOI and arXiv identifier normalization.
- Conservative cross-source deduplication and non-merge cases.
- Provenance and timestamp preservation.
- Missing, malformed, and partial metadata.
- Public schema-version compatibility and unsupported-version behavior.

### Recommendations

- Focused/Explore/Ineligible classification.
- 70/30 composition for representative page sizes.
- Graceful quota relaxation when one pool is short.
- No duplicate result slots.
- Deterministic tie behavior and diversity reranking.
- Explainable reasons matching the features actually used.
- Latest remains chronological and Trending remains signal-backed.

### Personal state

- Schema serialization, migration, and safe defaults.
- Corrupt local data recovery.
- Import validation, export round-trip, and reset.
- Public datasets and build output contain no personal state.

### Interface

- Core navigation and stable paper-detail routes.
- Filter/context preservation between list and detail.
- Loading, empty, stale, error, and missing-data states.
- Keyboard navigation, labels, focus visibility, and reduced motion.
- Responsive behavior with long titles, abstracts, and author lists.

### Build and deployment

- Strict TypeScript compilation.
- Linting and unit/component tests.
- Production build output.
- Wrangler configuration validation or dry-run packaging.
- Local request to `/` and a representative `/papers/<id>` route, proving the SPA
  fallback returns the application shell.
- Generated artifact schema and freshness checks.
- Dependency and secret scanning appropriate to the phase.

## Phase definition of done

A phase is complete only when its requested behavior exists, relevant automated
checks pass, the production build passes, required UI states are handled, no
credential is exposed, and documentation reflects the result. Unimplemented future
requirements do not block a narrowly scoped phase, but must not be reported as
complete.
