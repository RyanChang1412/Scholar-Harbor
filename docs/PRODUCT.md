# Product contract

## Product definition

Scholar Harbor is a publicly accessible academic discovery site designed around
one researcher's daily workflow. It combines paper discovery with restrained
research news, trends, and authoritative ranking links while keeping personal
reading state private to the browser.

The product principles are:

1. Papers first.
2. Balanced discovery: approximately 70% focused and 30% exploratory results.
3. Editorial home, efficient paper lists, and spacious paper detail reading.
4. Explainable recommendations rather than opaque scores.
5. AI assistance that summarizes and categorizes without inventing evidence.
6. Strict separation of public content and private personal state.
7. Calm, accessible design with restrained interaction.
8. Simple and deterministic foundations before advanced infrastructure.

## Planned product surfaces

These are accepted product requirements, not claims of current implementation.

### Home

An editorial introduction, a dominant “Papers for You” section, visible Focused
and Explore labels, a compact Research Pulse, a small news section, optional
trending/ranking links, and a visible data-freshness indicator.

### Papers

- **For You:** explainable, personalized Balanced Discovery.
- **Latest:** chronological order, independent of personalization.
- **Trending:** ordering backed by traceable community signals.

The surface will support search, source/topic filters, sorting, and bounded
pagination or incremental loading.

### Paper detail

Each normalized paper has a stable internal route and presents official metadata,
original abstract, identifiers, dates, provenance, verified external links,
recommendation reason, optional clearly labeled AI overview, local reading state,
and BibTeX only when a reliable citation record exists.

### News and rankings

News preserves source attribution and original URLs and supports basic category
filtering and deduplication. Rankings use structured, permitted sources when
available; otherwise they provide labeled links to authoritative sources. The
product never invents ranking positions or benchmark results.

### Library and settings

Saved papers, reading status, personal tags, research interests, keywords,
exclusions, topic weights, recommendation preferences, and theme settings remain
in browser-local storage for V1. Users can export, import, and reset that state.

## Initial editable research profile

Focused topics:

- LLM systems
- Efficient LLM inference
- KV cache and memory management
- LLM serving and scheduling
- Agent systems and reasoning
- Multimodal models
- Trustworthy and secure AI

Exploratory topics:

- AI for science
- World models
- Robotics
- New model architectures
- Emerging machine-learning topics

These are editable defaults, never hardcoded permanent restrictions. A visitor
without a profile receives a reasonable public default feed.

## Recommendation contract

The 70/30 target is a result-composition quota, not a weighted average. The
pipeline retrieves recent candidates, normalizes and deduplicates them, assigns
topics, classifies Focused/Explore/Ineligible, scores transparent features,
selects by quota, reranks for diversity, and produces a readable reason.

A paper can match multiple topics but occupies one result slot. When supply is
insufficient, relax the quota rather than add irrelevant papers. Missing
community attention must not penalize new papers. Personalized scoring never
silently changes Latest or Trending.

## V1 boundaries

- No authentication or cloud synchronization.
- No embedded PDF annotation system.
- No database, vector database, or permanent backend unless a later phase proves
  it necessary.
- No claim that browser-local state is encrypted.
- No automatic judgment of scientific quality.
- No unbounded historical dataset shipped to every browser.
