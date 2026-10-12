import type { FixtureNewsItem } from '../../domain/content'

interface NewsPreviewCardProps {
  readonly item: FixtureNewsItem
}

export function NewsPreviewCard({ item }: NewsPreviewCardProps) {
  return (
    <article className="min-w-0 border-b border-border py-5 first:pt-0 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
        <span className="font-semibold text-action">{item.category}</span>
        <span aria-hidden="true">·</span>
        <span>{item.source}</span>
      </div>
      <h3 className="mt-2 break-words text-pretty text-base leading-snug font-semibold text-text">
        {item.headline}
      </h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">{item.summary}</p>
      <p className="mt-3 text-xs text-text-muted">
        {item.publishedLabel} · Fictional fixture
      </p>
    </article>
  )
}
