import type { DiscoveryLane } from '../../domain/paper'
import { cn } from '../../lib/cn'

interface TopicBadgeProps {
  readonly children: string
  readonly lane?: DiscoveryLane
}

export function TopicBadge({ children, lane }: TopicBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-muted',
        lane === 'Focused' && 'border-primary/40 bg-surface-soft text-action',
        lane === 'Explore' && 'border-explore/45 bg-explore/10 text-text',
      )}
    >
      {children}
    </span>
  )
}
