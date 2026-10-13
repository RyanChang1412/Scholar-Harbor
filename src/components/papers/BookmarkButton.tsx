import { Bookmark } from 'lucide-react'

import type { Paper } from '../../domain/paper'
import { usePersonalPaperState } from '../../hooks/usePersonalPaperState'
import { cn } from '../../lib/cn'

interface BookmarkButtonProps {
  readonly paper: Paper
  readonly compact?: boolean
}

export function BookmarkButton({
  paper,
  compact = false,
}: BookmarkButtonProps) {
  const { state, toggleSaved } = usePersonalPaperState(paper.id)
  const label = state.saved ? 'Remove from library' : 'Save to library'

  return (
    <button
      aria-label={label}
      aria-pressed={state.saved}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-action hover:border-primary hover:bg-surface-soft',
        state.saved && 'border-primary/50 bg-surface-soft',
        compact && 'size-10 shrink-0 px-0',
      )}
      onClick={() => toggleSaved(paper)}
      type="button"
    >
      <Bookmark
        aria-hidden="true"
        fill={state.saved ? 'currentColor' : 'none'}
        size={16}
      />
      {!compact && (state.saved ? 'Saved' : 'Save')}
    </button>
  )
}
