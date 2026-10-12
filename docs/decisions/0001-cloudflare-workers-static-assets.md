# ADR 0001: Cloudflare Workers Static Assets deployment

- Status: Accepted
- Date: 2026-10-12

## Context

Scholar Harbor is a client-rendered research application with static, versioned
public datasets and browser-local personal state. Stable paper-detail routes need
to survive direct navigation. Scheduled ingestion must lead to a production data
update without exposing credentials or creating competing deployments.

Earlier specifications mentioned GitHub Pages. The deployment amendment replaces
all such requirements.

## Decision

Host the frontend on Cloudflare Workers Static Assets under the Worker name
`scholar-harbor`, initially using its `workers.dev` subdomain. Configure Wrangler's
asset directory as `dist` and set `not_found_handling` to
`single-page-application`. Keep all frontend routes root-relative.

Connect the public GitHub repository's `main` branch to Cloudflare Workers Builds.
That Git integration is the only production frontend deployment mechanism.

Run academic ingestion on a GitHub Actions schedule. After validation, publish
changed public artifacts through a least-privileged commit (or protected automated
data PR) to `main`. The accepted commit triggers the same Cloudflare build and
therefore delivers the updated dataset with the application.

## Consequences

- Refreshed client routes receive the SPA shell rather than an asset 404.
- No GitHub Pages base path or Pages workflow is needed.
- GitHub Actions owns data generation but does not own frontend deployment.
- A data-only commit rebuilds the static site; this favors operational simplicity
  over avoiding a small build.
- Cloudflare and GitHub secrets stay in their respective trusted systems and never
  enter the browser or public datasets.
- Build and deploy commands cannot be finalized until the frontend foundation
  commits a package manager, lockfile, and pinned Wrangler dependency.

## Rejected alternatives

- **GitHub Pages:** superseded by the deployment amendment and complicates routing
  with repository base paths.
- **A second GitHub Actions deploy:** creates competing production publishers.
- **Frontend runtime calls to private APIs:** would expose credentials and make
  source reliability part of every page view.
