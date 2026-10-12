import type { LucideIcon } from 'lucide-react'

import { EmptyState } from '../components/common/ContentStates'
import { SectionHeader } from '../components/common/SectionHeader'
import { PageContainer } from '../components/layout/PageContainer'

interface PlaceholderPageProps {
  readonly title: string
  readonly eyebrow: string
  readonly description: string
  readonly deferred: string
  readonly icon: LucideIcon
}

export function PlaceholderPage({
  title,
  eyebrow,
  description,
  deferred,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <PageContainer className="py-12 sm:py-16">
      <SectionHeader
        as="h1"
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <div className="mt-8">
        <EmptyState
          description={deferred}
          title={`${title} is intentionally not implemented in Phase 01`}
        />
      </div>
      <div className="mt-6 flex items-center gap-3 text-sm text-text-muted">
        <span className="grid size-9 place-items-center rounded-full bg-surface-soft text-action">
          <Icon aria-hidden="true" size={17} />
        </span>
        <p>
          The route and responsive page structure are ready for a later focused
          phase.
        </p>
      </div>
    </PageContainer>
  )
}
