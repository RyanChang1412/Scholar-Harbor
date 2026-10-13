import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { PageContainer } from '../components/layout/PageContainer'
import { NewsPreviewCard } from '../components/news/NewsPreviewCard'
import type { ContentRepository } from '../data/content/PublicContentRepository'
import { formatContentDate } from '../domain/news'
import { useNews } from '../hooks/useContentRepository'

export function NewsPage({
  repository,
  recordLabel,
}: {
  readonly repository: ContentRepository
  readonly recordLabel?: string | undefined
}) {
  const { data, loading, error } = useNews(repository)
  const [parameters, setParameters] = useSearchParams()
  const [visible, setVisible] = useState(12)
  const query = parameters.get('q') ?? ''
  const category = parameters.get('category') ?? 'all'
  const source = parameters.get('source') ?? 'all'
  const categories = [...new Set(data?.news.map((item) => item.category) ?? [])]
  const sources = [...new Set(data?.news.map((item) => item.source) ?? [])]
  const filtered = useMemo(
    () =>
      (data?.news ?? []).filter((item) => {
        const matchesCategory = category === 'all' || item.category === category
        const matchesSource = source === 'all' || item.source === source
        const needle = query.trim().toLocaleLowerCase()
        return (
          matchesCategory &&
          matchesSource &&
          (!needle ||
            `${item.headline} ${item.description} ${item.source}`
              .toLocaleLowerCase()
              .includes(needle))
        )
      }),
    [category, data, query, source],
  )

  function update(key: string, value: string) {
    const next = new URLSearchParams(parameters)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setVisible(12)
    setParameters(next)
  }

  return (
    <PageContainer className="py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-action uppercase">
          Research context
        </p>
        <h1 className="mt-3 font-editorial text-4xl font-semibold text-text sm:text-5xl">
          News
        </h1>
        <p className="mt-4 text-base leading-7 text-text-muted">
          Chronological updates from selected official research and open-source
          feeds. Every item links to its original source.
        </p>
      </div>

      {data && (
        <div className="mt-6">
          <DataFreshnessIndicator
            label={`Feeds checked ${formatContentDate(data.lastSuccessfulUpdateAt)}`}
          />
        </div>
      )}

      <div className="mt-10 grid gap-4 rounded-xl border border-border bg-surface p-5 md:grid-cols-[minmax(0,1fr)_15rem_15rem]">
        <label className="text-sm font-semibold text-text">
          Search news
          <input
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-canvas px-3 font-normal"
            onChange={(event) => update('q', event.target.value)}
            placeholder="Headline, description, or source"
            type="search"
            value={query}
          />
        </label>
        <label className="text-sm font-semibold text-text">
          Category
          <select
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-canvas px-3 font-normal"
            onChange={(event) => update('category', event.target.value)}
            value={category}
          >
            <option value="all">All categories</option>
            {categories.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-text">
          Source
          <select
            className="mt-2 min-h-11 w-full rounded-md border border-border bg-canvas px-3 font-normal"
            onChange={(event) => update('source', event.target.value)}
            value={source}
          >
            <option value="all">All sources</option>
            {sources.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      <section aria-live="polite" className="mt-10" aria-label="News results">
        {loading && (
          <LoadingState
            title="Loading attributed news"
            description="Fetching and validating the published feed snapshot."
          />
        )}
        {error && (
          <ErrorState
            title="News could not be loaded"
            description={`${error} Try again later; failed ingestion does not replace the last accepted dataset.`}
          />
        )}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title="No news matches these filters"
            description="Change the search or category to see other source-backed items."
          />
        )}
        {filtered.length > 0 && (
          <div className="grid gap-x-10 lg:grid-cols-2">
            {filtered.slice(0, visible).map((item) => (
              <NewsPreviewCard
                item={item}
                key={item.id}
                recordLabel={recordLabel}
              />
            ))}
          </div>
        )}
        {visible < filtered.length && (
          <button
            className="mt-8 min-h-11 rounded-md border border-primary px-4 text-sm font-semibold text-action hover:bg-surface-soft"
            onClick={() => setVisible((count) => count + 12)}
            type="button"
          >
            Load more news
          </button>
        )}
      </section>
    </PageContainer>
  )
}
