import { useEffect, useState } from 'react'

import type { PaperRepository } from '../data/papers/PaperRepository'
import type { Paper } from '../domain/paper'

interface ListState {
  readonly papers: readonly Paper[]
  readonly loading: boolean
  readonly error: string | null
}

export function usePaperList(repository: PaperRepository): ListState {
  const [state, setState] = useState<ListState>({
    papers: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let current = true
    repository
      .list()
      .then((papers) => {
        if (current) setState({ papers, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (current) {
          setState({
            papers: [],
            loading: false,
            error:
              error instanceof Error ? error.message : 'Paper loading failed.',
          })
        }
      })
    return () => {
      current = false
    }
  }, [repository])

  return state
}

export function usePaper(
  repository: PaperRepository,
  paperId: string | undefined,
) {
  const [state, setState] = useState<{
    paper: Paper | null
    error: string | null
    requestId: string | undefined
  }>({ paper: null, error: null, requestId: undefined })

  useEffect(() => {
    let current = true
    if (!paperId) return

    repository
      .getById(paperId)
      .then((paper) => {
        if (current) setState({ paper, error: null, requestId: paperId })
      })
      .catch((error: unknown) => {
        if (current) {
          setState({
            paper: null,
            error:
              error instanceof Error ? error.message : 'Paper loading failed.',
            requestId: paperId,
          })
        }
      })
    return () => {
      current = false
    }
  }, [paperId, repository])

  if (!paperId) return { paper: null, loading: false, error: null }
  if (state.requestId !== paperId) {
    return { paper: null, loading: true, error: null }
  }
  return { paper: state.paper, loading: false, error: state.error }
}
