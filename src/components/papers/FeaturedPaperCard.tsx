import { ArrowUpRight, Bookmark, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { FixturePaper } from '../../domain/content'
import { TopicBadge } from '../common/TopicBadge'

interface FeaturedPaperCardProps {
  readonly paper: FixturePaper
}

export function FeaturedPaperCard({ paper }: FeaturedPaperCardProps) {
  return (
    <article className="min-w-0 rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <TopicBadge lane={paper.lane}>{paper.lane}</TopicBadge>
        <TopicBadge>Fictional fixture</TopicBadge>
      </div>

      <h3 className="max-w-3xl text-pretty font-editorial text-[clamp(1.65rem,4vw,2.35rem)] leading-[1.12] font-semibold tracking-[-0.025em] text-text">
        <Link
          className="rounded-sm hover:text-action"
          to={`/papers/${paper.id}`}
        >
          {paper.title}
        </Link>
      </h3>

      <p className="mt-4 break-words text-sm leading-relaxed text-text-muted">
        {paper.authors.join(' · ')}
      </p>

      <p className="mt-5 max-w-3xl text-pretty leading-7 text-text-muted">
        {paper.abstract}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {paper.topics.map((topic) => (
          <TopicBadge key={topic}>{topic}</TopicBadge>
        ))}
      </div>

      <div className="mt-6 rounded-lg bg-surface-soft px-4 py-3">
        <p className="text-xs font-semibold tracking-[0.1em] text-action uppercase">
          Why this appears
        </p>
        <p className="mt-1 text-sm leading-6 text-text-muted">
          {paper.recommendationReason}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={14} />
            {paper.publishedLabel}
          </span>
          <span>{paper.sourceLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-text-muted opacity-65"
            disabled
            title="Fixture control; saving is not implemented"
            type="button"
          >
            <Bookmark aria-hidden="true" size={16} />
            Save unavailable
          </button>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-semibold text-surface hover:bg-text"
            to={`/papers/${paper.id}`}
          >
            Read fixture
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </article>
  )
}
