# Scholar Harbor

**Focused on your research, open to new ideas.**

Scholar Harbor is a calm, personal academic research observatory. Papers are the
primary content; research news, trends, and rankings provide context. The product
is intended for long-term daily use and favors correctness, traceable data,
privacy, and reading comfort over feature count.

## Repository status

Phase 02 is implemented on top of the Phase 01 foundation. Development and test
routes include a runtime-validated normalized Paper schema, a replaceable
repository interface, For You/Latest/Trending browsing, URL-backed search and
filters, bounded pagination, stable detail routes, BibTeX export, and versioned
browser-local bookmark and reading-status state.

All paper records and popularity signals remain clearly labeled fictional
fixtures. Live ingestion, real academic datasets, AI enrichment, recommendation
algorithms, full library management, and scheduled workflows remain intentionally
unimplemented.

## Accepted technical direction

- React, strict TypeScript, Vite, and a maintained client-side router.
- Tailwind CSS, selectively using shadcn/ui primitives and Lucide icons.
- Python adapters for scheduled academic-data ingestion.
- Versioned, validated static JSON as the boundary between ingestion and the UI.
- Browser-local, versioned storage for non-sensitive personal state in V1.
- Cloudflare Workers Static Assets on a `workers.dev` domain.
- Cloudflare Workers Builds connected to the public GitHub repository as the only
  production frontend deployment mechanism.
- Scheduled GitHub Actions may update public datasets; an accepted dataset commit
  on `main` then triggers the Cloudflare build.

GitHub Pages is outside the architecture. Do not add Pages workflows, base-path
workarounds, or a second production deployment pipeline.

## Documentation

- [Product contract](docs/PRODUCT.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Data sources and publication](docs/DATA_SOURCES.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Testing and acceptance gates](docs/TESTING.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Cloudflare deployment decision](docs/decisions/0001-cloudflare-workers-static-assets.md)

Persistent contributor and coding-agent rules are in [AGENTS.md](AGENTS.md).

## Local development

Requirements: Node.js 22.12 or later and npm 11.

```sh
npm ci
npm run dev
```

Quality commands:

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run format:check
npm run build
npm run deploy:dry-run
```

Playwright installs its supported Chromium browser in a normal development
environment. When browser downloads are intentionally skipped, select a system
browser with
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm run test:e2e`.

The production build writes `dist/index.html`. `wrangler.jsonc` reserves the
production Worker name and provides Cloudflare SPA fallback routing.

## Fixture policy

All papers, authors, dates, sources, popularity signals, news items, and pulse
observations are fictional. They live in `src/fixtures`, and paper records pass
the same runtime validation intended for future public data. Fixtures appear only
in development and automated browser-test routes, where they are visibly
labeled.

The default production build selects production-safe empty states instead. Its
verification script rejects known fixture markers, common credential formats, and
email-like personal identifiers in `dist`.

## Visual evidence

- [375 px mobile development prototype](artifacts/phase-01/home-375.png)
- [1440 px desktop development prototype](artifacts/phase-01/home-1440.png)
- [2560 × 1440 wide-screen development prototype](artifacts/phase-01/home-2560x1440.png)
- [1280 px production-safe empty state](artifacts/phase-01/production-safe-home.png)
- [2560 px Phase 02 homepage](artifacts/phase-02/home-2560x1440.png)
- [375 px mobile paper discovery](artifacts/phase-02/papers-375.png)
- [1440 px paper detail](artifacts/phase-02/detail-1440.png)
- [2560 px wide-screen paper discovery](artifacts/phase-02/papers-2560.png)

## Documentation conventions

Documentation distinguishes accepted decisions from implemented behavior. A
planned capability must not be described as working until its code and relevant
validation exist. Each development phase updates the status and commands affected
by that phase.
