import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { SectionHeader } from '../components/common/SectionHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { CompactPaperCard } from '../components/papers/CompactPaperCard'
import { fixturePapers, fixtureSnapshotLabel } from '../fixtures/home'

export function PapersPage() {
  return (
    <PageContainer className="py-12 sm:py-16">
      <SectionHeader
        as="h1"
        description="A Phase 01 route prototype. Search, filters, pagination, live sources, and recommendation logic are deferred."
        eyebrow="Paper discovery"
        title="Papers"
      />
      <div className="mt-6">
        <DataFreshnessIndicator label={fixtureSnapshotLabel} />
      </div>
      <div className="mt-8 grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {fixturePapers.map((paper) => (
          <CompactPaperCard key={paper.id} paper={paper} />
        ))}
      </div>
    </PageContainer>
  )
}
