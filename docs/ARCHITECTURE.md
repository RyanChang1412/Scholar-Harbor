# Architecture

## Status

Phase 03 implements source adapters, canonical arXiv identity resolution,
deterministic normalization, runtime validation, failure-isolated publication,
and production loading of the bounded `papers.v1.json` dataset. Development and
test routes retain deterministic fixtures; production routes fetch and validate
the generated public artifact. Recommendation scoring, AI enrichment, and full
library management remain planned.

Development and test builds select the fixture route set. Production builds
select a separate route set backed by `/data/papers.v1.json`, allowing Rollup to
omit the fixture modules. A post-build verifier rejects fixture markers, common
secret formats, and email-like personal identifiers before deployment packaging.

## System boundaries

The repository will contain two build-time systems and one browser runtime:

```text
Academic APIs / feeds
        |
        v
Python ingestion in scheduled GitHub Actions
  normalize -> validate -> deduplicate -> enrich -> bounded versioned JSON
        |
        v
accepted dataset commit on main
        |
        v
Cloudflare Workers Builds -> Vite build -> Workers Static Assets
        |
        v
Browser React app <-> versioned local personal state
```

Cloudflare Git integration is the only production frontend deployment path. The
scheduled ingestion workflow publishes accepted public-data changes by committing
them to `main`, which produces the Git event consumed by Workers Builds. A later
implementation may replace bot commits with another single, documented artifact
delivery path, but it must preserve automatic production updates and must not add
a competing frontend deploy workflow.

## Frontend layers

- **Presentation:** routes, page layouts, components, semantic markup, typography,
  loading/empty/error/stale states, and user interactions.
- **Domain:** `Paper`, `NewsItem`, `RankingSource`, `ResearchProfile`, and
  `PersonalPaperState` plus pure domain operations.
- **Data access:** fetches bounded static files, validates schema versions, and
  exposes normalized query methods. It does not expose provider-specific shapes.
- **Recommendation:** deterministic classification, transparent scoring, quota
  selection, diversity reranking, and reason generation.
- **Personal state:** schema-versioned browser storage with migrations, safe
  defaults, import/export validation, and reset.

Dependency direction points inward: presentation consumes domain services; domain
logic does not import UI or provider adapters.

## Ingestion layers

Each external source has a small adapter. Records pass through parsing, runtime
validation, canonical normalization, provenance capture, deduplication, optional
metadata enrichment, optional AI enrichment, and output validation before public
artifacts are replaced.

Failed optional enrichment must not remove usable source metadata. A failed
required validation must prevent publication of the invalid artifact while
leaving the last accepted dataset available.

## Paper identity and provenance

Canonical identity prefers normalized arXiv identifiers and DOI values. Cautious
normalized-title matching is only a fallback and cannot merge papers based on a
superficial title resemblance alone. Every merged field retains source
provenance.

The schema distinguishes:

- first publication time;
- latest paper update time;
- source retrieval time;
- metadata enrichment time;
- AI generation time.

External timestamps are parsed consistently and serialized in an explicit
timezone, preferably UTC ISO 8601. Missing values remain absent rather than being
guessed.

The implemented Phase 02 Paper schema enforces stable internal IDs, arXiv
identity, optional DOI, original and update timestamps, HTTPS external links,
link-verification state, source provenance, categories/topics, optional community
signals, and optional AI-enrichment metadata. Fixture input enters the repository
as `unknown`, so the UI cannot bypass runtime validation.

## Personal paper state

Bookmarks and reading status use
`scholar-harbor.personal-papers.v1` in browser-local storage. A strict versioned
envelope is validated whenever it is read; malformed content falls back to an
empty safe state. Personal fields never appear in the public Paper schema. Phase
02 provides repository and paper-level controls; library views, tags,
import/export, reset UI, and migrations remain deferred.

## Public data contract

Public JSON includes a top-level schema version, generation timestamp, source
metadata, and bounded records. Breaking changes require a schema-version change
and coordinated reader update. The UI rejects unsupported versions with a useful
stale/error state.

Personal interests, bookmarks, status, tags, and browsing history never enter
these artifacts.

## AI enrichment boundary

AI runs only in trusted CI or server-side processing. An enrichment record stores
its source-content fingerprint, prompt version, generation time, and whether it
used title/abstract or full text. Generated text is rendered as untrusted content
and visibly labeled. The non-AI pipeline remains complete and deployable.

## Routing and deployment

Frontend routes are root-relative. Vite must retain a `/` base. The Worker name
and Wrangler `name` are `scholar-harbor`. The asset directory is `dist`, and
unmatched navigation routes fall back to `index.html`; this lets routes such as
`/papers/<stable-id>` survive direct navigation and refresh.

See [DEPLOYMENT.md](DEPLOYMENT.md) and the accepted
[deployment decision](decisions/0001-cloudflare-workers-static-assets.md).
