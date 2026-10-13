# Architecture

## Status

Phase 05 adds normalized news, ranking references, and integrated homepage
context to the completed paper, personalization, library, and optional AI
foundation. Development and test routes retain deterministic fixtures;
production routes fetch and validate three bounded public artifacts. The
recommendation path remains deterministic and usable when AI is unavailable.

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
accepted paper/news/ranking dataset commit on main
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

RSS and Atom news adapters strip markup, normalize UTC timestamps and canonical
HTTPS URLs, retain source/retrieval metadata, and deduplicate by canonical URL
and normalized headline. Each source has bounded retries and independent status.
An unavailable source retains its last accepted items. The published feed and
per-source parsing are bounded, so historical growth does not expand the browser
payload without review.

The rankings artifact contains one cached Hugging Face Papers signal summary
derived from the validated paper artifact plus official-link cards for GitHub
Trending and LMArena. The UI labels these modes explicitly and does not treat an
external live page or an old snapshot as a current local ranking.

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
`scholar-harbor.personal.v2` in browser-local storage. A strict versioned envelope
contains the research profile, bookmarks, four reading states, and personal tags.
Malformed content falls back safely; v1 state migrates `read` to `finished`.
Validated JSON import/export and explicit reset are available in Settings.
Personal fields never appear in the public Paper schema or leave the browser.

## Recommendation flow

The browser builds an eligible recent pool, applies exclusions and optional
source/category constraints, classifies Focused and Explore candidates, computes
normalized relevance/recency/community/novelty features, and reranks each lane
with a deterministic MMR-style topic penalty. It selects a configurable ratio
(70/30 by default), relaxes the quota when one lane is short, prevents duplicate
IDs, and attaches a reason grounded in matched topics or explicit keywords.
Latest and Trending continue to use their independent chronological and
source-signal ordering.

## Public data contract

Public JSON includes a top-level schema version, generation timestamp, source
metadata, and bounded records. Breaking changes require a schema-version change
and coordinated reader update. The UI rejects unsupported versions with a useful
stale/error state.

Personal interests, bookmarks, status, tags, and browsing history never enter
these artifacts.

## AI enrichment boundary

AI runs only in trusted CI or server-side processing. The implemented adapter
uses one small OpenAI-compatible client behind a checked-in provider registry for
Alibaba Cloud Model Studio, OpenAI, and DeepSeek. An enrichment record stores its
source-content fingerprint, prompt version, generation time, model/provider, a
composite cache key, and whether it used title/abstract or full text. Provider ID
and model are part of the cache identity. Three Chinese sections are strictly
validated. Generated text is rendered as untrusted content and visibly labeled.
Calls are bounded per run, paper failures are isolated, and the non-AI pipeline
remains complete and deployable.

## Routing and deployment

Frontend routes are root-relative. Vite must retain a `/` base. The Worker name
and Wrangler `name` are `scholar-harbor`. The asset directory is `dist`, and
unmatched navigation routes fall back to `index.html`; this lets routes such as
`/papers/<stable-id>` survive direct navigation and refresh.

See [DEPLOYMENT.md](DEPLOYMENT.md) and the accepted
[deployment decision](decisions/0001-cloudflare-workers-static-assets.md).
