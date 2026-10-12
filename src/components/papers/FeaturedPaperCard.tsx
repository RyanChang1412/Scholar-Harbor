import { ArrowUpRight, Clock3 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import {
  formatPaperDate,
  getPrimarySource,
  type Paper,
} from '../../domain/paper'
import { TopicBadge } from '../common/TopicBadge'
import { BookmarkButton } from './BookmarkButton'

interface FeaturedPaperCardProps {
  readonly paper: Paper
  readonly recordLabel?: string | undefined
}

export function FeaturedPaperCard({
  paper,
  recordLabel = 'Source-backed record',
}: FeaturedPaperCardProps) {
  const location = useLocation()
  const detailState = { from: `${location.pathname}${location.search}` }
  const abstractPreview = getAbstractPreview(paper.abstract)

  return (
    <article className="min-w-0 rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {paper.recommendation && (
          <TopicBadge lane={paper.recommendation.lane}>
            {paper.recommendation.lane}
          </TopicBadge>
        )}
        <TopicBadge>{recordLabel}</TopicBadge>
      </div>

      <h3 className="max-w-4xl break-words text-pretty font-editorial text-[clamp(1.65rem,4vw,2.35rem)] leading-[1.12] font-semibold tracking-[-0.025em] text-text">
        <Link
          className="rounded-sm hover:text-action"
          state={detailState}
          to={`/papers/${paper.id}`}
        >
          {paper.title}
        </Link>
      </h3>

      <p className="mt-4 break-words text-sm leading-relaxed text-text-muted">
        {paper.authors.join(' · ')}
      </p>
      <p className="mt-5 max-w-4xl text-pretty leading-7 text-text-muted">
        {abstractPreview}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {paper.topics.map((topic) => (
          <TopicBadge key={topic}>{topic}</TopicBadge>
        ))}
      </div>

      {paper.recommendation && (
        <div className="mt-6 rounded-lg bg-surface-soft px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-action uppercase">
            Why this appears
          </p>
          <p className="mt-1 text-sm leading-6 text-text-muted">
            {paper.recommendation.reason}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={14} />
            Published {formatPaperDate(paper.publishedAt)}
          </span>
          <span>{getPrimarySource(paper)}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookmarkButton paperId={paper.id} />
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-semibold text-surface hover:bg-text"
            state={detailState}
            to={`/papers/${paper.id}`}
          >
            Read paper
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </article>
  )
}

function getAbstractPreview(abstract: string) {
  if (abstract.length <= 440) return abstract
  const candidate = abstract.slice(0, 440)
  const boundary = candidate.lastIndexOf(' ')
  return `${candidate.slice(0, Math.max(boundary, 360))}…`
}
