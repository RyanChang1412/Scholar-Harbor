import { ArrowLeft, Bookmark } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { TopicBadge } from '../components/common/TopicBadge'
import { PageContainer } from '../components/layout/PageContainer'
import { fixturePapers, fixtureSnapshotLabel } from '../fixtures/home'

export function PaperDetailPage() {
  const { paperId } = useParams()
  const paper = fixturePapers.find((item) => item.id === paperId)

  if (!paper) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <EmptyState
          description="Only the clearly labeled Phase 01 fixture papers are available. Live paper loading is intentionally deferred."
          title="Paper fixture not found"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-10 sm:py-16">
      <article className="mx-auto max-w-[780px]">
        <Link
          className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-action hover:text-text"
          to="/papers"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to paper fixtures
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <TopicBadge lane={paper.lane}>{paper.lane}</TopicBadge>
          <TopicBadge>Fictional fixture</TopicBadge>
        </div>

        <h1 className="mt-5 break-words text-pretty font-editorial text-[clamp(2rem,6vw,3.35rem)] leading-[1.06] font-semibold tracking-[-0.035em] text-text">
          {paper.title}
        </h1>
        <p className="mt-6 break-words leading-7 text-text-muted">
          {paper.authors.join(' · ')}
        </p>

        <dl className="mt-8 grid gap-4 border-y border-border py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-text">Publication</dt>
            <dd className="mt-1 text-text-muted">{paper.publishedLabel}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text">Source</dt>
            <dd className="mt-1 text-text-muted">{paper.sourceLabel}</dd>
          </div>
        </dl>

        <section className="mt-9" aria-labelledby="fixture-abstract-title">
          <h2
            className="font-editorial text-2xl font-semibold text-text"
            id="fixture-abstract-title"
          >
            Fixture abstract
          </h2>
          <p className="mt-4 text-pretty text-base leading-8 text-text-muted">
            {paper.abstract}
          </p>
        </section>

        <section
          className="mt-8 rounded-lg bg-surface-soft p-5"
          aria-labelledby="fixture-reason-title"
        >
          <h2
            className="text-sm font-semibold text-action"
            id="fixture-reason-title"
          >
            Prototype recommendation reason
          </h2>
          <p className="mt-2 leading-7 text-text-muted">
            {paper.recommendationReason}
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-2">
          {paper.topics.map((topic) => (
            <TopicBadge key={topic}>{topic}</TopicBadge>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <DataFreshnessIndicator label={fixtureSnapshotLabel} />
          <button
            className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-text-muted opacity-65"
            disabled
            title="Personal library is not implemented in Phase 01"
            type="button"
          >
            <Bookmark aria-hidden="true" size={16} />
            Save unavailable
          </button>
        </div>
      </article>
    </PageContainer>
  )
}
