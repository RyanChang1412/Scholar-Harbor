import { ArrowUpRight, Database, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { PageContainer } from '../components/layout/PageContainer'
import type { ContentRepository } from '../data/content/PublicContentRepository'
import { formatContentDate } from '../domain/news'
import type { RankingCard } from '../domain/ranking'
import { useRankings } from '../hooks/useContentRepository'

function RankingReferenceCard({ card }: { readonly card: RankingCard }) {
  return (
    <article className="min-w-0 rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-action uppercase">
        {card.kind === 'cached-summary' ? (
          <Database aria-hidden="true" size={15} />
        ) : (
          <ExternalLink aria-hidden="true" size={15} />
        )}
        {card.kind === 'cached-summary'
          ? 'Cached source snapshot'
          : 'Official external link'}
      </div>
      <h2 className="mt-3 font-editorial text-2xl font-semibold text-text">
        {card.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-text-muted">
        {card.description}
      </p>
      {card.kind === 'cached-summary' && (
        <>
          <div className="mt-4">
            <DataFreshnessIndicator
              label={`Retrieved ${formatContentDate(card.retrievedAt)}`}
            />
          </div>
          {card.items.length ? (
            <ol className="mt-5 divide-y divide-border border-y border-border">
              {card.items.map((item, index) => (
                <li
                  className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4"
                  key={item.paperId}
                >
                  <span className="font-editorial text-lg text-text-muted">
                    {index + 1}
                  </span>
                  <div>
                    <Link
                      className="font-semibold text-text hover:text-action"
                      to={`/papers/${item.paperId}`}
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.signalLabel} · source-backed snapshot signal
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm text-text-muted">
              No Hugging Face community signals are present in this snapshot.
            </p>
          )}
        </>
      )}
      <a
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-action hover:bg-surface-soft"
        href={card.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        Open {card.source}
        <ArrowUpRight aria-hidden="true" size={16} />
      </a>
    </article>
  )
}

export function RankingsPage({
  repository,
}: {
  readonly repository: ContentRepository
}) {
  const { data, loading, error } = useRankings(repository)
  const cached = data?.cards.find((card) => card.kind === 'cached-summary')
  const official = data?.cards.filter((card) => card.kind === 'official-link')
  return (
    <PageContainer className="py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.16em] text-action uppercase">
          Authoritative references
        </p>
        <h1 className="mt-3 font-editorial text-4xl font-semibold text-text sm:text-5xl">
          Rankings
        </h1>
        <p className="mt-4 text-base leading-7 text-text-muted">
          A restrained index of source-backed snapshots and official
          destinations. Each card says whether its content is cached here or
          lives on the source site.
        </p>
      </div>
      <div className="mt-10">
        {loading && (
          <LoadingState
            title="Loading ranking references"
            description="Validating the published ranking index."
          />
        )}
        {error && (
          <ErrorState
            title="Ranking references could not be loaded"
            description={error}
          />
        )}
        {!loading && !error && !data?.cards.length && (
          <EmptyState
            title="No ranking references published"
            description="No unverified ranking data will be substituted."
          />
        )}
        {data && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] lg:items-start">
            {cached && <RankingReferenceCard card={cached} />}
            <div className="grid gap-5">
              {official?.map((card) => (
                <RankingReferenceCard card={card} key={card.id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
