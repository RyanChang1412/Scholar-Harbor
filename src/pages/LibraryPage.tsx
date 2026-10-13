import { BookMarked } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/common/ContentStates'
import { SectionHeader } from '../components/common/SectionHeader'
import { PageContainer } from '../components/layout/PageContainer'
import { CompactPaperCard } from '../components/papers/CompactPaperCard'
import type { PaperRepository } from '../data/papers/PaperRepository'
import type { ReadingStatus } from '../domain/personal-paper-state'
import type { Paper } from '../domain/paper'
import { usePaperList } from '../hooks/usePaperRepository'
import { usePersonalData } from '../hooks/usePersonalData'
import { usePersonalPaperState } from '../hooks/usePersonalPaperState'

export function LibraryPage({
  repository,
}: {
  readonly repository: PaperRepository
}) {
  const { papers, loading, error } = usePaperList(repository)
  const { paperStates, repository: personalRepository } = usePersonalData()
  const papersById = useMemo(
    () => new Map(papers.map((paper) => [paper.id, paper])),
    [papers],
  )
  const savedStates = paperStates.filter((state) => state.saved)
  const savedPapers = savedStates
    .map((state) => papersById.get(state.paperId) ?? state.paperSnapshot)
    .filter((paper): paper is Paper => paper !== undefined)
  const unavailableStates = savedStates.filter(
    (state) => !papersById.has(state.paperId) && !state.paperSnapshot,
  )

  useEffect(() => {
    if (loading || error) return
    for (const state of paperStates) {
      const currentPaper = papersById.get(state.paperId)
      if (state.saved && !state.paperSnapshot && currentPaper) {
        personalRepository.setSaved(currentPaper, true)
      }
    }
  }, [error, loading, paperStates, papersById, personalRepository])

  return (
    <PageContainer className="py-12 sm:py-16">
      <SectionHeader
        as="h1"
        description="Saved papers, reading progress, and personal tags stay in this browser."
        eyebrow="Private local reading"
        title="Library"
      />
      <p className="mt-5 inline-flex items-center gap-2 rounded-md bg-surface-soft px-3 py-2 text-xs text-text-muted">
        <BookMarked aria-hidden="true" size={15} />
        This page never publishes reading activity into the academic dataset.
      </p>
      <div className="mt-8" aria-live="polite">
        {loading && (
          <LoadingState
            title="Loading saved papers"
            description="Matching local state to validated public records."
          />
        )}
        {error && (
          <ErrorState title="Library could not be loaded" description={error} />
        )}
        {!loading &&
          !error &&
          savedPapers.length === 0 &&
          unavailableStates.length === 0 && (
            <EmptyState
              title="Your library is empty"
              description="Save a paper from Papers or a paper detail page to keep it here."
            />
          )}
        {!loading &&
          !error &&
          (savedPapers.length > 0 || unavailableStates.length > 0) && (
            <div className="grid gap-5 xl:grid-cols-2">
              {savedPapers.map((paper) => (
                <div key={paper.id} className="min-w-0">
                  <CompactPaperCard paper={paper} showRecommendation={false} />
                  <LibraryControls paperId={paper.id} />
                </div>
              ))}
              {unavailableStates.map((state) => (
                <article
                  className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6"
                  key={state.paperId}
                >
                  <p className="text-xs font-semibold tracking-[0.1em] text-action uppercase">
                    Saved local record
                  </p>
                  <h2 className="mt-3 font-editorial text-xl font-semibold text-text">
                    Paper details unavailable
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-text-muted">
                    This bookmark predates durable local snapshots and the paper
                    is no longer in the current public dataset. Its private
                    state remains stored under {state.paperId}.
                  </p>
                  <div className="mt-5">
                    <LibraryControls paperId={state.paperId} />
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>
    </PageContainer>
  )
}

function LibraryControls({ paperId }: { readonly paperId: string }) {
  const { state, setStatus, setTags } = usePersonalPaperState(paperId)
  return (
    <div className="-mt-2 grid gap-3 rounded-b-lg border border-t-0 border-border bg-surface-soft p-4 sm:grid-cols-2">
      <label className="text-xs font-semibold text-text">
        Reading status
        <select
          className="mt-2 min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
          value={state.status}
          onChange={(event) => setStatus(event.target.value as ReadingStatus)}
        >
          <option value="unread">Unread</option>
          <option value="want-to-read">Want to Read</option>
          <option value="reading">Reading</option>
          <option value="finished">Finished</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-text">
        Personal tags
        <input
          className="mt-2 min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-normal"
          defaultValue={state.tags.join(', ')}
          onBlur={(event) => setTags(event.target.value.split(','))}
          placeholder="systems, revisit"
        />
      </label>
    </div>
  )
}
