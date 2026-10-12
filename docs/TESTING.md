# Testing and acceptance gates

## Status

Phase 01 provides strict TypeScript checking, ESLint, Prettier, Vitest with Testing
Library, Playwright browser checks, a Vite production build, and a Wrangler
packaging dry-run.

Run the default checks with:

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run format:check
npm run build
npm run deploy:dry-run
```

The production build includes `npm run verify:build`, which scans emitted text
assets and fails when it finds development fixture markers, common credential
formats, or email-like personal identifiers.

The browser suite starts the development server automatically and checks 375,
768, 1280, and 1440 px viewports. It covers required routes, long-title bounds,
unexpected horizontal scrolling, fixture labeling, skip-link focus, and keyboard
operation of the mobile menu. Screenshots are stored under
`artifacts/phase-01/`.

## Phase 01 validation record

Validated on 2026-10-12 in the onboarding environment:

| Check                               | Result                                    |
| ----------------------------------- | ----------------------------------------- |
| Frozen install (`npm ci`)           | Passed                                    |
| Strict TypeScript                   | Passed                                    |
| ESLint and Prettier                 | Passed                                    |
| Vitest component/route suite        | 14 passed                                 |
| Playwright browser suite            | 6 passed                                  |
| Target viewports                    | 375, 768, 1280, and 1440 px passed        |
| Vite production build               | Passed                                    |
| Production build-content scan       | Passed; 5 emitted text assets scanned     |
| Wrangler packaging dry-run          | Passed; 16 static assets read             |
| Wrangler local `/`                  | `200 OK`                                  |
| Wrangler local paper-detail refresh | `200 OK`; SPA fallback behavior confirmed |
| Production runtime content check    | Passed; no fixture records rendered       |

The desktop and mobile screenshots were inspected after the browser suite. They
showed readable type hierarchy, single-column mobile flow, bounded long titles,
and no unexpected horizontal overflow.

## Test strategy

Use deterministic fixtures for core behavior. Live provider calls belong only in
explicit integration tests and are not part of the default unit suite. Tests must
exercise behavior that can fail rather than mirror implementation details.

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
