import {
  ArrowLeft,
  Check,
  Clipboard,
  Code2,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/common/ContentStates'
import { DataFreshnessIndicator } from '../components/common/DataFreshnessIndicator'
import { TopicBadge } from '../components/common/TopicBadge'
import { PageContainer } from '../components/layout/PageContainer'
import { BookmarkButton } from '../components/papers/BookmarkButton'
import {
  formatPaperDate,
  getPaperLink,
  getPrimarySource,
  type Paper,
  type PaperExternalLink,
} from '../domain/paper'
import { usePaper } from '../hooks/usePaperRepository'
import { usePersonalPaperState } from '../hooks/usePersonalPaperState'
import { createBibTeX } from '../lib/citation'
import type { ReadingStatus } from '../domain/personal-paper-state'
import { usePersonalData } from '../hooks/usePersonalData'

interface DetailLocationState {
  readonly from?: unknown
}

type CopyStatus = 'idle' | 'copied' | 'error'

interface PaperDetailPageProps {
  readonly repository: import('../data/papers/PaperRepository').PaperRepository
  readonly snapshotLabel?: string
  readonly recordLabel?: string
  readonly destinationNotice?: string | undefined
}

export function PaperDetailPage({
  repository,
  snapshotLabel,
  recordLabel = 'Source-backed record',
  destinationNotice,
}: PaperDetailPageProps) {
  const { profile, repository: personalRepository } = usePersonalData()
  const { paperId } = useParams()
  const location = useLocation()
  const {
    paper: repositoryPaper,
    loading,
    error,
  } = usePaper(repository, paperId)
  const savedSnapshot = paperId
    ? personalRepository.get(paperId).paperSnapshot
    : undefined
  const paper = repositoryPaper ?? savedSnapshot
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const from = (location.state as DetailLocationState | null)?.from
  const backTo =
    typeof from === 'string' && from.startsWith('/papers') ? from : '/papers'

  if (loading) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <LoadingState
          description="Validating the selected paper record."
          title="Loading paper"
        />
      </PageContainer>
    )
  }

  if (error && !paper) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <ErrorState
          description={error}
          title="Paper record could not be loaded"
        />
      </PageContainer>
    )
  }

  if (!paper) {
    return (
      <PageContainer className="py-12 sm:py-16">
        <EmptyState
          description="This stable paper identity is not present in the validated repository."
          title="Paper not found"
        />
        <Link
          className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-md text-sm font-semibold text-action hover:text-text"
          to={backTo}
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to papers
        </Link>
      </PageContainer>
    )
  }

  async function copyCitation() {
    if (!paper) return
    try {
      await navigator.clipboard.writeText(createBibTeX(paper))
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 1600)
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <PageContainer className="py-10 sm:py-16">
      <Link
        className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-action hover:text-text"
        to={backTo}
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to paper results
      </Link>

      <article className="mx-auto mt-8 grid min-w-0 max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,760px)_minmax(15rem,1fr)] lg:items-start lg:gap-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {paper.recommendation && (
              <TopicBadge lane={paper.recommendation.lane}>
                {paper.recommendation.lane}
              </TopicBadge>
            )}
            <TopicBadge>
              {repositoryPaper ? recordLabel : 'Saved local snapshot'}
            </TopicBadge>
          </div>

          <h1 className="mt-5 break-words text-pretty font-editorial text-[clamp(2rem,6vw,3.35rem)] leading-[1.06] font-semibold tracking-[-0.035em] text-text">
            {paper.title}
          </h1>
          <p className="mt-6 break-words leading-7 text-text-muted">
            {paper.authors.join(' · ')}
          </p>

          <section className="mt-10" aria-labelledby="abstract-title">
            <p className="text-xs font-semibold tracking-[0.13em] text-action uppercase">
              Original source text
            </p>
            <h2
              className="mt-2 font-editorial text-2xl font-semibold text-text"
              id="abstract-title"
            >
              Abstract
            </h2>
            <p className="mt-4 text-pretty text-base leading-8 text-text-muted">
              {paper.abstract}
            </p>
          </section>

          <section
            className="mt-10 rounded-lg border border-border bg-surface-soft p-5"
            aria-labelledby="ai-overview-title"
          >
            <h2
              className="font-editorial text-xl font-semibold text-text"
              id="ai-overview-title"
            >
              AI Overview
            </h2>
            {profile.showAiOverviews &&
            paper.aiEnrichment?.status === 'available' ? (
              <>
                <p className="mt-2 text-xs font-semibold text-action">
                  AI-generated · based on {paper.aiEnrichment.basis}
                </p>
                {typeof paper.aiEnrichment.overview === 'string' ? (
                  <p className="mt-3 leading-7 text-text-muted">
                    {paper.aiEnrichment.overview}
                  </p>
                ) : (
                  <dl className="mt-4 space-y-4 text-sm leading-7 text-text-muted">
                    <div>
                      <dt className="font-semibold text-text">
                        Research Problem
                      </dt>
                      <dd>{paper.aiEnrichment.overview.researchProblem}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-text">Core Approach</dt>
                      <dd>{paper.aiEnrichment.overview.coreApproach}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-text">
                        Research Relevance
                      </dt>
                      <dd>{paper.aiEnrichment.overview.researchRelevance}</dd>
                    </div>
                  </dl>
                )}
                {'provider' in paper.aiEnrichment && (
                  <p className="mt-4 text-xs text-text-muted">
                    {paper.aiEnrichment.provider} · {paper.aiEnrichment.model} ·
                    prompt {paper.aiEnrichment.promptVersion}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 leading-7 text-text-muted">
                {profile.showAiOverviews
                  ? 'No AI overview is available for this record. The original abstract remains available above without generated claims.'
                  : 'AI overviews are hidden by your local display preference.'}
              </p>
            )}
          </section>

          {paper.recommendation && (
            <section
              className="mt-8 border-l-2 border-warm pl-5"
              aria-labelledby="recommendation-title"
            >
              <h2
                className="text-sm font-semibold text-action"
                id="recommendation-title"
              >
                Why this appears
              </h2>
              <p className="mt-2 leading-7 text-text-muted">
                {paper.recommendation.reason}
              </p>
            </section>
          )}
        </div>

        <PaperMetadata
          copyStatus={copyStatus}
          onCopy={() => void copyCitation()}
          paper={paper}
          snapshotLabel={
            snapshotLabel ??
            `${repositoryPaper ? 'Retrieved' : 'Saved snapshot · source retrieved'} ${formatPaperDate(paper.provenance[0]!.retrievedAt)}`
          }
          destinationNotice={destinationNotice}
        />
      </article>
    </PageContainer>
  )
}

function PaperMetadata({
  paper,
  copyStatus,
  onCopy,
  snapshotLabel,
  destinationNotice,
}: {
  readonly paper: Paper
  readonly copyStatus: CopyStatus
  readonly onCopy: () => void
  readonly snapshotLabel: string
  readonly destinationNotice?: string | undefined
}) {
  const { state, setStatus } = usePersonalPaperState(paper.id)
  const paperLink = getPaperLink(paper, 'paper')
  const pdfLink = getPaperLink(paper, 'pdf')
  const codeLink = getPaperLink(paper, 'code')

  return (
    <aside className="min-w-0 rounded-xl border border-border bg-surface p-5 shadow-card lg:sticky lg:top-24">
      <h2 className="font-editorial text-xl font-semibold text-text">
        Paper details
      </h2>
      <dl className="mt-5 space-y-4 text-sm">
        <Metadata
          label="Published"
          value={formatPaperDate(paper.publishedAt)}
        />
        <Metadata label="Updated" value={formatPaperDate(paper.updatedAt)} />
        <Metadata label="arXiv ID" value={paper.arxivId} />
        {paper.doi && (
          <Metadata
            label="DOI"
            value={
              <a
                className="inline-flex items-center gap-1 rounded-sm font-medium text-action hover:text-text"
                href={`https://doi.org/${encodeURIComponent(paper.doi)}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                {paper.doi}
                <ExternalLink aria-hidden="true" size={13} />
              </a>
            }
          />
        )}
        <Metadata label="Source" value={getPrimarySource(paper)} />
        <Metadata
          label="Source record"
          value={paper.provenance[0]!.sourceRecordId}
        />
        <Metadata
          label="Retrieved"
          value={formatPaperDate(paper.provenance[0]!.retrievedAt)}
        />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {[...paper.categories, ...paper.topics].map((label) => (
          <TopicBadge key={label}>{label}</TopicBadge>
        ))}
      </div>

      <div className="mt-6 space-y-2 border-t border-border pt-5">
        {paperLink && (
          <ExternalPaperLink
            icon={ExternalLink}
            label="Paper page"
            link={paperLink}
          />
        )}
        {pdfLink ? (
          <ExternalPaperLink icon={FileText} label="PDF" link={pdfLink} />
        ) : (
          <p className="text-xs text-text-muted">PDF link unavailable</p>
        )}
        {codeLink ? (
          <ExternalPaperLink icon={Code2} label="Code" link={codeLink} />
        ) : (
          <p className="text-xs text-text-muted">Code link unavailable</p>
        )}
        {destinationNotice && (
          <p className="pt-1 text-xs leading-5 text-text-muted">
            {destinationNotice}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <BookmarkButton paper={paper} />
        <label className="block text-xs font-semibold text-text">
          Reading status
          <select
            className="mt-2 min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
            onChange={(event) => setStatus(event.target.value as ReadingStatus)}
            value={state.status}
          >
            <option value="unread">Unread</option>
            <option value="want-to-read">Want to Read</option>
            <option value="reading">Reading</option>
            <option value="finished">Finished</option>
          </select>
        </label>
        <button
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-action hover:border-primary hover:bg-surface-soft"
          onClick={onCopy}
          type="button"
        >
          {copyStatus === 'copied' ? (
            <Check aria-hidden="true" size={16} />
          ) : (
            <Clipboard aria-hidden="true" size={16} />
          )}
          {copyStatus === 'copied'
            ? 'BibTeX copied'
            : copyStatus === 'error'
              ? 'Copy unavailable'
              : 'Copy BibTeX'}
        </button>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <DataFreshnessIndicator label={snapshotLabel} />
      </div>
    </aside>
  )
}

function Metadata({
  label,
  value,
}: {
  readonly label: string
  readonly value: ReactNode
}) {
  return (
    <div>
      <dt className="font-semibold text-text">{label}</dt>
      <dd className="mt-1 break-words text-text-muted">{value}</dd>
    </div>
  )
}

function ExternalPaperLink({
  icon: Icon,
  label,
  link,
}: {
  readonly icon: typeof ExternalLink
  readonly label: string
  readonly link: PaperExternalLink
}) {
  return (
    <a
      className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border px-3 text-sm font-semibold text-action hover:border-primary hover:bg-surface-soft"
      href={link.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="inline-flex items-center gap-2">
        <Icon aria-hidden="true" size={16} />
        {label}
      </span>
      <span className="text-[0.65rem] tracking-wide text-text-muted uppercase">
        {link.verification.status}
      </span>
    </a>
  )
}
