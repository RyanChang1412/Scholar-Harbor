import { CircleDot } from 'lucide-react'

interface DataFreshnessIndicatorProps {
  readonly label: string
}

export function DataFreshnessIndicator({ label }: DataFreshnessIndicatorProps) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-warm/55 bg-surface px-3 py-1.5 text-xs font-medium text-text-muted">
      <CircleDot aria-hidden="true" className="text-warm" size={14} />
      <span>{label}</span>
    </p>
  )
}
