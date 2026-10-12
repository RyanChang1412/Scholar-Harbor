import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { SectionHeader } from '../components/common/SectionHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { CompactPaperCard } from '../components/papers/CompactPaperCard'
import type { PaperRepository } from '../data/papers/PaperRepository'
import { formatPaperDate } from '../domain/paper'
import {
  getSource,
  queryPapers,
  type PaperMode,
  type PaperSort,
  type TimeRange,
} from '../domain/paper-query'
import { usePaperList } from '../hooks/usePaperRepository'

function getModes() {
  return [
    {
      id: 'for-you',
      label: 'For You',
      description: 'Personal recommendations become available in Phase 04.',
    },
    {
      id: 'latest',
      label: 'Latest',
      description: 'Strictly ordered by original publication time.',
    },
    {
      id: 'trending',
      label: 'Trending',
      description: 'Ordered by clearly labeled community signals.',
    },
  ] as const
}

function isMode(value: string | null): value is PaperMode {
  return value === 'for-you' || value === 'latest' || value === 'trending'
}

function isTimeRange(value: string | null): value is TimeRange {
  return value === 'all' || value === '7d' || value === '30d' || value === '1y'
}

function isSort(value: string | null): value is PaperSort {
  return (
    value === 'recommended' ||
    value === 'newest' ||
    value === 'oldest' ||
    value === 'title'
  )
}

interface PapersPageProps {
  readonly repository: PaperRepository
  readonly snapshotAt?: Date
  readonly snapshotLabel?: string
  readonly defaultMode?: PaperMode
  readonly datasetDescription?: string
  readonly recordLabel?: string
  readonly signalLabel?: string
  readonly signalNotice?: string
}

export function PapersPage({
  repository,
  snapshotAt = new Date(),
  snapshotLabel,
  defaultMode = 'for-you',
  datasetDescription = 'Search and compare validated, source-attributed academic records.',
  recordLabel,
  signalLabel,
  signalNotice = 'Community values retain their source and observation time.',
}: PapersPageProps) {
  const { papers, loading, error } = usePaperList(repository)
  const [searchParams, setSearchParams] = useSearchParams()
  const querySearch = searchParams.get('q') ?? ''
  const rawMode = searchParams.get('mode')
  const mode: PaperMode = isMode(rawMode) ? rawMode : defaultMode
  const modes = getModes()
  const rawRange = searchParams.get('range')
  const timeRange: TimeRange = isTimeRange(rawRange) ? rawRange : 'all'
  const rawSort = searchParams.get('sort')
  const requestedSort: PaperSort = isSort(rawSort) ? rawSort : 'recommended'
  const sort: PaperSort =
    mode === 'latest'
      ? 'newest'
      : mode === 'trending'
        ? 'recommended'
        : requestedSort
  const selectedTopics = searchParams.getAll('topic')
  const source = searchParams.get('source') ?? ''
  const requestedPage = Number(searchParams.get('page') ?? '1')
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const topics = useMemo(
    () => [...new Set(papers.flatMap((paper) => paper.topics))].sort(),
    [papers],
  )
  const sources = useMemo(
    () => [...new Set(papers.map(getSource))].sort(),
    [papers],
  )
  const freshnessLabel = useMemo(() => {
    if (snapshotLabel) return snapshotLabel
    const latestRetrieval = papers
      .flatMap((paper) => paper.provenance)
      .map((entry) => entry.retrievedAt)
      .sort()
      .at(-1)
    return latestRetrieval
      ? `Dataset retrieved ${formatPaperDate(latestRetrieval)}`
      : 'Published dataset unavailable'
  }, [papers, snapshotLabel])
  const result = useMemo(
    () =>
      queryPapers(
        papers,
        {
          mode,
          search: querySearch,
          topics: selectedTopics,
          source,
          timeRange,
          sort,
          page,
          pageSize: 6,
        },
        snapshotAt,
      ),
    [
      mode,
      page,
      papers,
      querySearch,
      selectedTopics,
      snapshotAt,
      sort,
      source,
      timeRange,
    ],
  )

  function updateParams(
    updates: Readonly<Record<string, string | readonly string[] | null>>,
  ) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      next.delete(key)
      if (value !== null && typeof value !== 'string') {
        value.forEach((item) => next.append(key, item))
      } else if (value) {
        next.set(key, value)
      }
    }
    if (!('page' in updates)) next.delete('page')
    setSearchParams(next)
  }

  function toggleTopic(topic: string) {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((item) => item !== topic)
      : [...selectedTopics, topic]
    updateParams({ topic: next })
  }

  const activeMode = modes.find((item) => item.id === mode)!
  const hasFilters =
    Boolean(querySearch || source || selectedTopics.length) ||
    timeRange !== 'all'

  return (
    <PageContainer className="py-12 sm:py-16">
      <SectionHeader
        as="h1"
        description={datasetDescription}
        eyebrow="Paper discovery"
        title="Papers"
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <DataFreshnessIndicator label={freshnessLabel} />
        <span className="text-xs text-text-muted">{signalNotice}</span>
      </div>

      <nav
        aria-label="Paper discovery modes"
        className="mt-8 grid gap-2 sm:grid-cols-3"
      >
        {modes.map((item) => {
          const next = new URLSearchParams(searchParams)
          next.set('mode', item.id)
          next.delete('page')
          return (
            <Link
              aria-current={mode === item.id ? 'page' : undefined}
              className="rounded-lg border border-border bg-surface p-4 hover:border-primary aria-[current=page]:border-primary aria-[current=page]:bg-surface-soft"
              key={item.id}
              to={{ search: next.toString() }}
            >
              <span className="font-semibold text-text">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-text-muted">
                {item.description}
              </span>
            </Link>
          )
        })}
      </nav>

      <form
        className="mt-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          const value = new FormData(event.currentTarget).get('q')
          updateParams({
            q: typeof value === 'string' ? value.trim() || null : null,
          })
        }}
        role="search"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search papers</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            size={18}
          />
          <input
            className="min-h-11 w-full rounded-md border border-border bg-surface pr-3 pl-10 text-sm text-text placeholder:text-text-muted focus:border-primary"
            defaultValue={querySearch}
            key={querySearch}
            name="q"
            placeholder="Search titles, authors, abstracts, or topics"
            type="search"
          />
        </label>
        <button
          className="min-h-11 rounded-md bg-action px-5 text-sm font-semibold text-surface hover:bg-text"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside
          aria-label="Paper filters"
          className="self-start rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 font-semibold text-text">
              <SlidersHorizontal aria-hidden="true" size={17} />
              Filters
            </h2>
            {hasFilters && (
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold text-action hover:text-text"
                onClick={() =>
                  setSearchParams(mode === 'for-you' ? {} : { mode })
                }
                type="button"
              >
                <X aria-hidden="true" size={14} />
                Clear
              </button>
            )}
          </div>

          <label className="mt-5 block text-xs font-semibold text-text">
            Time range
            <select
              className="mt-2 min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
              onChange={(event) => updateParams({ range: event.target.value })}
              value={timeRange}
            >
              <option value="all">All available dates</option>
              <option value="7d">Past 7 days</option>
              <option value="30d">Past 30 days</option>
              <option value="1y">Past year</option>
            </select>
          </label>

          <label className="mt-5 block text-xs font-semibold text-text">
            Source
            <select
              className="mt-2 min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
              onChange={(event) =>
                updateParams({ source: event.target.value || null })
              }
              value={source}
            >
              <option value="">All sources</option>
              {sources.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="mt-5">
            <legend className="text-xs font-semibold text-text">Topics</legend>
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
              {topics.map((topic) => (
                <label
                  className="flex cursor-pointer items-start gap-2 text-sm text-text-muted"
                  key={topic}
                >
                  <input
                    checked={selectedTopics.includes(topic)}
                    className="mt-0.5 size-4 accent-primary"
                    onChange={() => toggleTopic(topic)}
                    type="checkbox"
                  />
                  <span>{topic}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </aside>

        <section aria-labelledby="paper-results-title" className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-action uppercase">
                {activeMode.label}
              </p>
              <h2
                className="mt-1 font-editorial text-2xl font-semibold text-text"
                id="paper-results-title"
              >
                {loading ? 'Loading papers' : `${result.total} paper results`}
              </h2>
            </div>
            {mode === 'for-you' ? (
              <label className="text-xs font-semibold text-text">
                Sort
                <select
                  className="ml-2 min-h-10 rounded-md border border-border bg-surface px-3 text-sm font-normal"
                  onChange={(event) =>
                    updateParams({ sort: event.target.value })
                  }
                  value={sort}
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            ) : (
              <p className="text-xs text-text-muted">
                {mode === 'latest'
                  ? 'Sort: publication date, newest first'
                  : `Sort: ${signalLabel?.toLocaleLowerCase() ?? 'community'} signal score, highest first`}
              </p>
            )}
          </div>

          <div aria-live="polite" className="mt-6">
            {loading && (
              <LoadingState
                description="Validating the paper collection."
                title="Loading paper records"
              />
            )}
            {error && (
              <ErrorState
                description={error}
                title="Paper records could not be loaded"
              />
            )}
            {!loading && !error && result.items.length === 0 && (
              <EmptyState
                description="Try removing a topic, widening the time range, or clearing the search."
                title="No papers match these filters"
              />
            )}
            {!loading && !error && result.items.length > 0 && (
              <div className="paper-results-grid grid min-w-0 gap-5 xl:grid-cols-2">
                {result.items.map((paper) => (
                  <CompactPaperCard
                    key={paper.id}
                    paper={paper}
                    showRecommendation={mode === 'for-you'}
                    showTrendSignal={mode === 'trending'}
                    recordLabel={recordLabel}
                    signalLabel={signalLabel}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && !error && result.totalPages > 1 && (
            <nav
              aria-label="Paper result pages"
              className="mt-8 flex items-center justify-between border-t border-border pt-5"
            >
              <button
                className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-action disabled:cursor-not-allowed disabled:opacity-40"
                disabled={result.page === 1}
                onClick={() => updateParams({ page: String(result.page - 1) })}
                type="button"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {result.page} of {result.totalPages}
              </span>
              <button
                className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold text-action disabled:cursor-not-allowed disabled:opacity-40"
                disabled={result.page === result.totalPages}
                onClick={() => updateParams({ page: String(result.page + 1) })}
                type="button"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </PageContainer>
  )
}
