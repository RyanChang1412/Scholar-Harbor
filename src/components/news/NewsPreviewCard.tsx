import { ExternalLink } from 'lucide-react'

import type { FixtureNewsItem } from '../../domain/content'
import { formatContentDate, type NewsItem } from '../../domain/news'

interface NewsPreviewCardProps {
  readonly item: FixtureNewsItem | NewsItem
  readonly recordLabel?: string | undefined
}

export function NewsPreviewCard({
  item,
  recordLabel = 'Source retrieved record',
}: NewsPreviewCardProps) {
  const fixture = 'fixture' in item
  const summary = fixture ? item.summary : item.description
  const date = fixture
    ? item.publishedLabel
    : formatContentDate(item.publishedAt)
  return (
    <article className="min-w-0 border-b border-border py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
        <span className="font-semibold text-action">{item.category}</span>
        <span aria-hidden="true">·</span>
        <span>{item.source}</span>
      </div>
      <h3 className="mt-2 break-words text-pretty text-base leading-snug font-semibold text-text">
        {fixture ? (
          item.headline
        ) : (
          <a
            className="hover:text-action"
            href={item.originalUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {item.headline}{' '}
            <ExternalLink className="inline" aria-hidden="true" size={14} />
          </a>
        )}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">{summary}</p>
      <p className="mt-3 text-xs text-text-muted">
        {date} · {recordLabel}
      </p>
    </article>
  )
}
