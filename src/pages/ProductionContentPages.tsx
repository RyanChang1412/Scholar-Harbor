import { ShieldCheck } from 'lucide-react'

import { EmptyState } from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { SectionHeader } from '../components/common/SectionHeader'
import { PageContainer } from '../components/layout/PageContainer'

export function ProductionHomePage() {
  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-3xl">
        <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-action uppercase">
          Your academic observatory
        </p>
        <h1 className="text-balance font-editorial text-[clamp(2.6rem,7vw,5.35rem)] leading-[0.98] font-medium tracking-[-0.045em] text-text">
          Focused on your research, open to new ideas.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
          The application foundation is ready. Public academic data will appear
          only after a reviewed ingestion source and validation pipeline are
          connected.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <DataFreshnessIndicator label="No public dataset published" />
        <span className="inline-flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck aria-hidden="true" size={15} />
          No simulated research records in this build
        </span>
      </div>

      <section className="mt-14" aria-labelledby="production-content-title">
        <SectionHeader
          description="The next data phase will add normalized, validated, source-attributed public records."
          eyebrow="Publication status"
          title="Research content is not published yet"
          titleId="production-content-title"
        />
        <div className="mt-7">
          <EmptyState
            description="This production-safe foundation intentionally contains no development fixtures, personal reading state, or unreviewed academic claims."
            title="Waiting for a validated public dataset"
          />
        </div>
      </section>
    </PageContainer>
  )
}

export function ProductionPapersPage() {
  return (
    <PageContainer className="py-12 sm:py-16">
      <SectionHeader
        as="h1"
        description="Search, filtering, recommendations, and public records will be enabled after the ingestion boundary is implemented."
        eyebrow="Paper discovery"
        title="Papers"
      />
      <div className="mt-8">
        <EmptyState
          description="No simulated paper records are included in the production build."
          title="No public paper dataset has been published"
        />
      </div>
    </PageContainer>
  )
}

export function ProductionPaperDetailPage() {
  return (
    <PageContainer className="py-12 sm:py-16">
      <EmptyState
        description="Paper detail pages become available after a validated public dataset supplies a stable paper identity."
        title="Paper content is not available"
      />
    </PageContainer>
  )
}
