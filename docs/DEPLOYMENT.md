# Deployment

## Accepted production architecture

- Source: public GitHub repository `RyanChang1412/Scholar-Harbor`.
- Host: Cloudflare Workers Static Assets.
- Initial domain: the free `workers.dev` subdomain.
- Production automation: Cloudflare Workers Builds connected to GitHub.
- Public-data schedule: GitHub Actions.
- Personal state: browser-local storage.
- Private AI/API credentials: GitHub Secrets or trusted server-side secrets only.

GitHub Pages and a GitHub Actions frontend deployment are prohibited. This avoids
two systems racing to publish different versions of the site.

## Checked-in Wrangler baseline

`wrangler.jsonc` fixes the project name as `scholar-harbor`, serves the Vite
`dist` directory, and uses `single-page-application` not-found handling. Cloudflare
therefore serves `dist/index.html` with `200` for unmatched navigation requests,
including refreshed paper-detail URLs.

The frontend phase must keep Vite's base root-relative (`/`) and must produce
`dist/index.html`. The Worker project created in Cloudflare must also be named
`scholar-harbor`; do not create a second name in dashboard configuration.

## Workers Builds settings

Apply these settings after the frontend package and lockfile exist:

| Setting           | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| Repository        | `RyanChang1412/Scholar-Harbor`                           |
| Production branch | `main`                                                   |
| Root directory    | repository root                                          |
| Build command     | `npm run build`                                          |
| Deploy command    | `npm run deploy:worker`                                  |
| Production URL    | `https://scholar-harbor.<account-subdomain>.workers.dev` |

## One-time production activation

The repository cannot create or inspect the account-owned Git integration by
itself. In the Cloudflare dashboard:

1. Open **Workers & Pages → Create → Import a repository** and authorize the
   public `RyanChang1412/Scholar-Harbor` repository.
2. Set both project and Worker name to `scholar-harbor`, production branch to
   `main`, and root directory to the repository root.
3. Use `npm ci` for dependency installation, `npm run build` for the build, and
   `npm run deploy:worker` for deployment. Do not add a GitHub Actions frontend
   deployment.
4. Enable the `workers.dev` route and record the account-specific public URL.
5. After the first build, open `/`, `/news`, `/rankings`, and a real
   `/papers/<id>` URL directly. Each must return the SPA and render its route.
6. Run **Ingest public research data** manually on `main` once. If it creates a
   validated data commit, verify that the same Git integration starts a second
   production build.

No Cloudflare API token belongs in the frontend or repository. Workers Builds
uses the Cloudflare account authorization configured in the dashboard. Optional
ingestion provider keys remain GitHub Actions secrets as described below.

Workers Builds uses the committed Wrangler version from the package manifest
rather than an unpinned global tool. The deploy command does not rebuild because
Cloudflare runs the build command as its separate first step.

## Dataset-to-production path

The committed `ingest-papers.yml` workflow publishes papers, news, and ranking
reference artifacts through this sequence:

1. A scheduled GitHub Actions job checks out `main` and installs pinned Python
   dependencies.
2. Adapters download only approved public sources and build output in a temporary
   location.
3. Schema validation, integrity checks, deterministic tests, and secret scanning
   complete before publication.
4. Valid bounded artifacts replace `papers.v1.json`, `news.v1.json`, and
   `rankings.v1.json`.
5. If and only if tracked dataset content changed, the workflow creates one bot
   commit on `main` containing only generated public artifacts and their manifest.
6. That commit triggers the existing Cloudflare Workers Build, which rebuilds and
   deploys the frontend together with the new data.

The ingestion workflow needs `contents: write` only for the publishing job. Other
jobs use `contents: read`. Set explicit job-level permissions, prevent overlapping
scheduled publishers with concurrency control, and never print or publish API
credentials. If branch protection requires a pull request, use an automated data
PR and let the merge to `main` trigger Cloudflare; document that choice when it is
implemented.

The workflow is idempotent and unattended: provider requests use
timeouts and bounded backoff, unchanged results exit successfully without a
commit, and any failed validation or transient provider outage preserves the
last-known-good artifacts. Failure output must identify the affected adapter and
next diagnostic step without exposing response secrets. Routine scheduled runs
must not depend on a person repairing them each day.

The schedule is `04:23 UTC` daily and the same workflow supports
`workflow_dispatch`. GitHub does not guarantee exact scheduled start times. The
ingest job has `contents: read`; only the separate publish job receives
`contents: write`. An unchanged dataset exits without a commit. A valid changed
artifact is committed to `main`, which triggers the sole Cloudflare Workers Build
deployment path. The workflow never deploys the frontend itself.

Optional AI enrichment uses `AI_PROVIDER` (`bailian`, `openai`, or `deepseek`) and
`AI_MODEL` GitHub repository variables. The selected provider reads its matching
GitHub Actions secret: `DASHSCOPE_API_KEY`, `OPENAI_API_KEY`, or
`DEEPSEEK_API_KEY`. `BAILIAN_MODEL` remains a compatibility fallback. If the
selected secret is absent, the step logs a credential-free skip and completes the
ordinary ingestion path. Do not set any key as a Vite variable or Cloudflare
public environment value. The default configuration limits generation to six
high-priority records per changed run.

## Validation before production

Before enabling the Git integration, verify locally that:

- the production build creates `dist/index.html`;
- Wrangler configuration validation and dry-run packaging succeed;
- a local Wrangler preview serves `/` and a representative detail route;
- direct navigation to that detail route returns the SPA shell;
- public dataset schema and freshness metadata load successfully;
- no secret or private browser state appears in `dist`.

`npm run build` enforces the final point with
`scripts/verify-production-build.mjs`. It also rejects Phase 01 development
fixture markers so a production deployment cannot accidentally publish prototype
paper or news records.

## Official references

Configuration was checked against Cloudflare's current documentation on
2026-10-12:

- [Workers Static Assets SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

Recheck these references in the phase that adds or changes deployment tooling.
