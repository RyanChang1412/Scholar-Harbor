import { ArrowRight, Compass, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { SectionHeader } from '../components/common/SectionHeader'
import { ResearchPulsePanel } from '../components/home/ResearchPulsePanel'
import { PageContainer } from '../components/layout/PageContainer'
import { NewsPreviewCard } from '../components/news/NewsPreviewCard'
import { CompactPaperCard } from '../components/papers/CompactPaperCard'
import { FeaturedPaperCard } from '../components/papers/FeaturedPaperCard'
import {
  fixtureNews,
  fixturePulse,
  fixtureSnapshotLabel,
} from '../fixtures/home'
import { paperFixtures } from '../fixtures/papers'

export function HomePage() {
  const featuredPaper = paperFixtures[0]!
  const compactPapers = paperFixtures.slice(1, 3)

  return (
    <>
      <PageContainer className="pb-12 pt-12 sm:pt-16 lg:pb-16 lg:pt-20">
        <div className="home-hero-grid grid gap-9 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="home-hero-copy min-w-0 max-w-3xl">
            <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-action uppercase">
              Your academic observatory
            </p>
            <h1 className="text-balance font-editorial text-[clamp(2.6rem,7vw,5.35rem)] leading-[0.98] font-medium tracking-[-0.045em] text-text">
              Focused on your research, open to new ideas.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
              A calm place to follow the papers that matter, notice useful
              adjacent work, and keep research context within reach.
            </p>
          </div>

          <aside
            className="border-l-2 border-warm pl-5"
            aria-label="Prototype notice"
          >
            <p className="text-sm font-semibold text-text">
              Phase 02 paper experience prototype
            </p>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Every title, author, date, and signal on this page is fictional
              fixture content.
            </p>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <DataFreshnessIndicator label={fixtureSnapshotLabel} />
          <span className="inline-flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck aria-hidden="true" size={15} />
            No live academic claims
          </span>
        </div>
      </PageContainer>

      <PageContainer className="space-y-16 lg:space-y-20">
        <section aria-labelledby="papers-for-you-title">
          <SectionHeader
            action={
              <Link
                className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-action hover:text-text"
                to="/papers"
              >
                Browse paper fixtures
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            }
            description="A typography-first preview of focused and exploratory discovery. Recommendation labels describe only the fixture scenario."
            eyebrow="Primary reading"
            title="Papers for You"
            titleId="papers-for-you-title"
          />

          <div className="home-paper-grid mt-7 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.85fr)] lg:items-start">
            <FeaturedPaperCard
              paper={featuredPaper}
              recordLabel="Fictional fixture"
            />
            <div
              className="home-compact-grid grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-1"
              data-home-compact-grid=""
            >
              {compactPapers.map((paper) => (
                <CompactPaperCard
                  key={paper.id}
                  paper={paper}
                  recordLabel="Fictional fixture"
                />
              ))}
            </div>
          </div>
        </section>

        <section
          aria-label="Research context"
          className="home-context-grid grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]"
        >
          <ResearchPulsePanel items={fixturePulse} />

          <div className="min-w-0 rounded-xl border border-border bg-surface p-6 sm:p-8">
            <SectionHeader
              action={
                <Link
                  className="inline-flex items-center gap-2 text-sm font-semibold text-action hover:text-text"
                  to="/news"
                >
                  News preview
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              }
              description="Compact context with explicit source treatment. Live feeds are intentionally deferred."
              eyebrow="Secondary context"
              title="Academic news"
            />
            <div className="mt-6">
              {fixtureNews.map((item) => (
                <NewsPreviewCard item={item} key={item.id} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <span className="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-action uppercase">
                <Compass aria-hidden="true" size={15} />
                Balanced discovery
              </span>
              <h2 className="font-editorial text-2xl font-semibold text-text sm:text-3xl">
                Deep focus, with room for useful surprise.
              </h2>
              <p className="mt-3 text-pretty leading-7 text-text-muted">
                Labeled fixtures exercise visible reasons while the same local,
                deterministic recommendation engine responds to your private
                research profile.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-primary px-4 py-2 text-sm font-semibold text-action hover:bg-surface-soft"
              to="/settings"
            >
              Edit research profile
            </Link>
          </div>
        </section>
      </PageContainer>
    </>
  )
}
