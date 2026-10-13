import { ArrowRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import {
  formatPaperDate,
  getPrimarySource,
  type Paper,
} from '../../domain/paper'
import { getTrendingScore } from '../../domain/paper-query'
import { TopicBadge } from '../common/TopicBadge'
import { BookmarkButton } from './BookmarkButton'

interface CompactPaperCardProps {
  readonly paper: Paper
  readonly showRecommendation?: boolean
  readonly showTrendSignal?: boolean
  readonly recordLabel?: string | undefined
  readonly signalLabel?: string | undefined
}

export function CompactPaperCard({
  paper,
  showRecommendation = true,
  showTrendSignal = false,
  recordLabel = 'Source-backed record',
  signalLabel = 'Community',
}: CompactPaperCardProps) {
  const location = useLocation()
  const detailState = { from: `${location.pathname}${location.search}` }

  return (
    <article className="group min-w-0 rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {showRecommendation && paper.recommendation && (
          <TopicBadge lane={paper.recommendation.lane}>
            {paper.recommendation.lane}
          </TopicBadge>
        )}
        <span className="text-xs text-text-muted">{recordLabel}</span>
      </div>
      <h3 className="break-words text-pretty text-lg leading-snug font-semibold text-text">
        <Link
          className="rounded-sm group-hover:text-action"
          state={detailState}
          to={`/papers/${paper.id}`}
        >
          {paper.title}
        </Link>
      </h3>
      <p className="mt-3 break-words text-sm leading-6 text-text-muted">
        {paper.authors.join(' · ')}
      </p>
      {showRecommendation && paper.recommendation && (
        <p className="mt-3 text-sm leading-6 text-text-muted">
          {paper.recommendation.reason}
        </p>
      )}
      {showTrendSignal && paper.communitySignals?.[0] && (
        <p className="mt-3 rounded-md bg-surface-soft px-3 py-2 text-xs leading-5 text-text-muted">
          {signalLabel} signal score {getTrendingScore(paper)} · sourced from{' '}
          {paper.communitySignals[0].source}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {paper.topics.map((topic) => (
          <TopicBadge key={topic}>{topic}</TopicBadge>
        ))}
      </div>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
        <div className="min-w-0 text-xs leading-5 text-text-muted">
          <p>Published {formatPaperDate(paper.publishedAt)}</p>
          <p className="break-words">{getPrimarySource(paper)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BookmarkButton compact paper={paper} />
          <Link
            aria-label={`Open paper: ${paper.title}`}
            className="grid size-10 place-items-center rounded-full border border-border text-action hover:border-primary hover:bg-surface-soft"
            state={detailState}
            to={`/papers/${paper.id}`}
          >
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </article>
  )
}
