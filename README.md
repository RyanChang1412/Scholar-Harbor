# Scholar Harbor

**Focused on your research, open to new ideas.**

Scholar Harbor is a calm, personal academic research observatory. Papers are the
primary content; research news, trends, and rankings provide context. The product
is intended for long-term daily use and favors correctness, traceable data,
privacy, and reading comfort over feature count.

## Repository status

Phase 05 completes the production product surface. Production consumes the
runtime-validated `papers.v1.json`, `news.v1.json`, and `rankings.v1.json`
artifacts. The scheduled Python pipeline builds them from arXiv, Hugging Face
Papers, the official Hugging Face Blog RSS feed, and the official vLLM Releases
Atom feed. OpenAlex DOI enrichment remains optional and disabled by default.

The pipeline isolates source failures, performs bounded retries, merges arXiv
revisions by canonical identity, preserves provenance, refuses empty output,
publishes atomically, and leaves an unchanged or last-known-good dataset alone.
The browser now applies deterministic, explainable Balanced Discovery locally,
using a versioned private research profile and an approximately 70/30
Focused/Explore target. Library states, tags, validated import/export, migrations,
and reset are browser-local. News provides URL-backed search, source/category
filters, attribution, and bounded incremental loading. Rankings distinguishes a
cached Hugging Face signal summary from direct GitHub Trending and LMArena links.
Optional Chinese AI overviews use an
OpenAI-compatible server-side adapter for Alibaba Cloud Model Studio, OpenAI, or
DeepSeek, with structured validation and cache keys.

The V1.4 discovery path uses a shared RSI taxonomy, bounded topic-group retrieval,
query-level provenance, evidence-backed relevance levels, and an explicit
historical backfill mode. See [RSI discovery](docs/RSI_DISCOVERY.md).

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
- [RSI discovery enhancement](docs/RSI_DISCOVERY.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Testing and acceptance gates](docs/TESTING.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Maintenance guide](docs/MAINTENANCE.md)
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
npm run test:ingestion
npm run format:check
npm run build
npm run deploy:dry-run
```

Install and run ingestion manually with:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-ingestion.txt
PYTHONPATH=ingestion .venv/bin/python -m scholar_harbor_ingest.cli
```

Run a bounded one-off historical discovery pass with
`--historical-backfill`. Daily scheduled ingestion never adds this flag.

The default arXiv and Hugging Face sources need no credential. Optional OpenAlex
enrichment needs `OPENALEX_API_KEY` only after `openAlexEnabled` is deliberately
enabled in `config/ingestion.json`.

Optional AI enrichment selects `bailian` (default), `openai`, or `deepseek` with
the `AI_PROVIDER` repository variable and reads only that provider's key from
GitHub Secrets. `AI_MODEL` overrides the provider default; the existing
`BAILIAN_MODEL` variable remains supported. The frontend never receives any
credential. The versioned Chinese system prompt is in
`config/ai-system-prompt-v1.txt`. See
[AI enrichment](docs/AI_ENRICHMENT.md).

Playwright installs its supported Chromium browser in a normal development
environment. When browser downloads are intentionally skipped, select a system
browser with
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium npm run test:e2e`.

The production build writes `dist/index.html`. `wrangler.jsonc` reserves the
production Worker name and provides Cloudflare SPA fallback routing.

## Fixture policy

Development fixtures in `src/fixtures` are fictional and visibly labeled.
Production routes load only the committed, validated public datasets; the build
does not bundle fixture records.

The production build loads only the committed validated public dataset. Its
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
- [375 px source-backed production homepage](artifacts/phase-03/home-375.png)
- [2560 px source-backed Trending view](artifacts/phase-03/papers-2560.png)
- [1440 px source-backed paper detail](artifacts/phase-03/detail-1440.png)
- [375 px fixture-backed private profile settings](artifacts/phase-04/fixture-settings-375.png)
- [2560 px production Balanced Discovery](artifacts/phase-04/production-papers-2560.png)
- [1440 px integrated production homepage](artifacts/phase-05/production-home-1440.png)
- [1440 px production news](artifacts/phase-05/production-news-1440.png)
- [2560 px production ranking references](artifacts/phase-05/production-rankings-2560.png)

## Documentation conventions

Documentation distinguishes accepted decisions from implemented behavior. A
planned capability must not be described as working until its code and relevant
validation exist. Each development phase updates the status and commands affected
by that phase.
