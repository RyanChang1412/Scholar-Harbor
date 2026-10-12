import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { FixturePaper } from '../../domain/content'
import { TopicBadge } from '../common/TopicBadge'

interface CompactPaperCardProps {
  readonly paper: FixturePaper
}

export function CompactPaperCard({ paper }: CompactPaperCardProps) {
  return (
    <article className="group min-w-0 rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TopicBadge lane={paper.lane}>{paper.lane}</TopicBadge>
        <span className="text-xs text-text-muted">Fictional fixture</span>
      </div>
      <h3 className="break-words text-pretty text-lg leading-snug font-semibold text-text">
        <Link
          className="rounded-sm group-hover:text-action"
          to={`/papers/${paper.id}`}
        >
          {paper.title}
        </Link>
      </h3>
      <p className="mt-3 break-words text-sm leading-6 text-text-muted">
        {paper.authors.join(' · ')}
      </p>
      <p className="mt-3 text-sm leading-6 text-text-muted">
        {paper.recommendationReason}
      </p>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
        <div className="min-w-0 text-xs leading-5 text-text-muted">
          <p>{paper.publishedLabel}</p>
          <p className="truncate">{paper.sourceLabel}</p>
        </div>
        <Link
          aria-label={`Open fixture paper: ${paper.title}`}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-action hover:border-primary hover:bg-surface-soft"
          to={`/papers/${paper.id}`}
        >
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </div>
    </article>
  )
}
