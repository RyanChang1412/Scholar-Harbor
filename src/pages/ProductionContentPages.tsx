import { ShieldCheck } from 'lucide-react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { SectionHeader } from '../components/common/SectionHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { CompactPaperCard } from '../components/papers/CompactPaperCard'
import { FeaturedPaperCard } from '../components/papers/FeaturedPaperCard'
import { publicPaperRepository } from '../data/papers/PublicPaperRepository'
import { formatPaperDate } from '../domain/paper'
import { usePaperList } from '../hooks/usePaperRepository'

export function ProductionHomePage() {
  const { papers, loading, error } = usePaperList(publicPaperRepository)
  const [featured, ...secondary] = papers
  const latestRetrieval = papers
    .flatMap((paper) => paper.provenance)
    .map((entry) => entry.retrievedAt)
    .sort()
    .at(-1)

  return (
    <PageContainer className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl">
        <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-action uppercase">
          Your academic observatory
        </p>
        <h1 className="text-balance font-editorial text-[clamp(2.6rem,7vw,5.35rem)] leading-[0.98] font-medium tracking-[-0.045em] text-text">
          Focused on your research, open to new ideas.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
          Recent academic records from reviewed public sources, normalized and
          validated before publication.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <DataFreshnessIndicator
          label={
            latestRetrieval
              ? `Dataset retrieved ${formatPaperDate(latestRetrieval)}`
              : 'Loading published dataset'
          }
        />
        <span className="inline-flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck aria-hidden="true" size={15} />
          Source attribution retained for every record
        </span>
      </div>

      <section className="mt-14" aria-labelledby="production-content-title">
        <SectionHeader
          description="Latest source-backed records. Personal recommendations remain deferred to Phase 04."
          eyebrow="Primary reading"
          title="Recent papers"
          titleId="production-content-title"
        />
        <div className="mt-7">
          {loading && (
            <LoadingState
              description="Fetching and validating the published dataset."
              title="Loading recent papers"
            />
          )}
          {error && (
            <ErrorState
              description={`${error} The last published file remains untouched by failed ingestion runs.`}
              title="Published papers could not be loaded"
            />
          )}
          {!loading && !error && !featured && (
            <EmptyState
              description="No validated records are currently available."
              title="No public papers published"
            />
          )}
          {featured && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.85fr)]">
              <FeaturedPaperCard paper={featured} />
              <div className="grid gap-5">
                {secondary.slice(0, 2).map((paper) => (
                  <CompactPaperCard
                    key={paper.id}
                    paper={paper}
                    showRecommendation={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  )
}
