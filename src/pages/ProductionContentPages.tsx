import { ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { SectionHeader } from '../components/common/SectionHeader'
import { ResearchPulsePanel } from '../components/home/ResearchPulsePanel'
import { PageContainer } from '../components/layout/PageContainer'
import { NewsPreviewCard } from '../components/news/NewsPreviewCard'
import { CompactPaperCard } from '../components/papers/CompactPaperCard'
import { FeaturedPaperCard } from '../components/papers/FeaturedPaperCard'
import { publicPaperRepository } from '../data/papers/PublicPaperRepository'
import { publicContentRepository } from '../data/content/PublicContentRepository'
import { formatPaperDate } from '../domain/paper'
import { usePaperList } from '../hooks/usePaperRepository'
import { usePersonalData } from '../hooks/usePersonalData'
import { recommendPapers } from '../domain/recommendation'
import { useNews, useRankings } from '../hooks/useContentRepository'

export function ProductionHomePage() {
  const { papers, loading, error } = usePaperList(publicPaperRepository)
  const { profile } = usePersonalData()
  const newsState = useNews(publicContentRepository)
  const rankingState = useRankings(publicContentRepository)
  const recommendations = recommendPapers(papers, profile, {
    limit: Math.min(10, papers.length),
  })
  const [featured, ...secondary] = recommendations.papers
  const latestRetrieval = papers
    .flatMap((paper) => paper.provenance)
    .map((entry) => entry.retrievedAt)
    .sort()
    .at(-1)
  const pulse = Object.entries(
    papers
      .flatMap((paper) => paper.topics)
      .reduce<Record<string, number>>((counts, topic) => {
        counts[topic] = (counts[topic] ?? 0) + 1
        return counts
      }, {}),
  )
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, 4)
    .map(([topic, count]) => ({
      id: topic,
      label: topic,
      detail: `${count} records in the current bounded paper snapshot`,
      direction: 'steady' as const,
    }))

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
          description={`${recommendations.measurement.focused} Focused and ${recommendations.measurement.explore} Explore selections, ranked locally from source-backed records.`}
          eyebrow="Primary reading"
          title="Papers for You"
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

      <section
        className="home-context-grid mt-16 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]"
        aria-label="Research context"
      >
        <ResearchPulsePanel
          description="Topic frequency in the current published paper snapshot. Counts describe this dataset only."
          eyebrow="Dataset overview"
          footnote="No time-series direction or broader field trend is inferred."
          items={pulse}
        />
        <div className="min-w-0 rounded-xl border border-border bg-surface p-6 sm:p-8">
          <SectionHeader
            action={
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-action hover:text-text"
                to="/news"
              >
                All news
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            }
            description="Recent items from selected official feeds, shown chronologically with direct source links."
            eyebrow="Research context"
            title="News highlights"
          />
          <div className="mt-6">
            {newsState.loading && (
              <LoadingState
                title="Loading news"
                description="Validating the latest published feed snapshot."
              />
            )}
            {newsState.error && (
              <ErrorState
                title="News unavailable"
                description={newsState.error}
              />
            )}
            {newsState.data?.news.slice(0, 3).map((item) => (
              <NewsPreviewCard item={item} key={item.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 rounded-xl border border-border bg-surface px-6 py-8 sm:px-8">
        <SectionHeader
          action={
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-action hover:text-text"
              to="/rankings"
            >
              Ranking references
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          }
          description="Cached source signals and official destinations are labeled separately."
          eyebrow="Useful references"
          title="Rankings and live indexes"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {rankingState.loading && (
            <LoadingState
              title="Loading references"
              description="Validating the published index."
            />
          )}
          {rankingState.error && (
            <ErrorState
              title="References unavailable"
              description={rankingState.error}
            />
          )}
          {rankingState.data?.cards.map((card) => (
            <a
              className="rounded-lg border border-border bg-canvas p-5 hover:border-primary"
              href={card.url}
              key={card.id}
              rel="noopener noreferrer"
              target="_blank"
            >
              <p className="text-xs font-semibold tracking-[0.1em] text-action uppercase">
                {card.kind === 'cached-summary'
                  ? 'Cached snapshot'
                  : 'Official live page'}
              </p>
              <h3 className="mt-2 font-editorial text-xl font-semibold text-text">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {card.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-action">
                Open source
                <ExternalLink aria-hidden="true" size={15} />
              </span>
            </a>
          ))}
        </div>
      </section>
    </PageContainer>
  )
}
