import { useEffect, useState } from 'react'

import { getPersonalPaperStateRepository } from '../data/personal/PersonalPaperStateRepository'
import type { ReadingStatus } from '../domain/personal-paper-state'
import type { Paper } from '../domain/paper'

export function usePersonalPaperState(paperId: string) {
  const repository = getPersonalPaperStateRepository()
  const [state, setState] = useState(() => repository.get(paperId))

  useEffect(
    () => repository.subscribe(() => setState(repository.get(paperId))),
    [paperId, repository],
  )

  const current = state.paperId === paperId ? state : repository.get(paperId)

  return {
    state: current,
    toggleSaved: (paper?: Paper) =>
      repository.setSaved(paper ?? paperId, !current.saved),
    setStatus: (status: ReadingStatus) => repository.setStatus(paperId, status),
    setTags: (tags: readonly string[]) => repository.setTags(paperId, tags),
  }
}
