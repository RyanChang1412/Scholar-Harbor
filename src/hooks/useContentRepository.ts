import { useEffect, useState } from 'react'

import type { ContentRepository } from '../data/content/PublicContentRepository'
import type { NewsDataset } from '../domain/news'
import type { RankingsDataset } from '../domain/ranking'

function useDataset<T>(
  repository: ContentRepository,
  kind: 'news' | 'rankings',
) {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: string | null
  }>({ data: null, loading: true, error: null })

  useEffect(() => {
    let current = true
    const request = (
      kind === 'news' ? repository.news() : repository.rankings()
    ) as Promise<T>
    request
      .then(
        (data) => current && setState({ data, loading: false, error: null }),
      )
      .catch(
        (error: unknown) =>
          current &&
          setState({
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Content loading failed.',
          }),
      )
    return () => {
      current = false
    }
  }, [kind, repository])
  return state
}

export function useNews(repository: ContentRepository) {
  return useDataset<NewsDataset>(repository, 'news')
}

export function useRankings(repository: ContentRepository) {
  return useDataset<RankingsDataset>(repository, 'rankings')
}
