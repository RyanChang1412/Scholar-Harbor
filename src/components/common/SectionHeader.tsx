import type { ReactNode } from 'react'

interface SectionHeaderProps {
  readonly as?: 'h1' | 'h2'
  readonly eyebrow?: string
  readonly title: string
  readonly description?: string
  readonly action?: ReactNode
  readonly titleId?: string
}

export function SectionHeader({
  as = 'h2',
  eyebrow,
  title,
  description,
  action,
  titleId,
}: SectionHeaderProps) {
  const Heading = as

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-action uppercase">
            {eyebrow}
          </p>
        ) : null}
        <Heading
          className="font-editorial text-3xl leading-tight font-semibold tracking-[-0.02em] text-text"
          id={titleId}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 text-pretty text-text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
