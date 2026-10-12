import type { Paper } from './paper'

export type PaperMode = 'for-you' | 'latest' | 'trending'
export type TimeRange = 'all' | '7d' | '30d' | '1y'
export type PaperSort = 'recommended' | 'newest' | 'oldest' | 'title'

export interface PaperQuery {
  readonly mode: PaperMode
  readonly search: string
  readonly topics: readonly string[]
  readonly source: string
  readonly timeRange: TimeRange
  readonly sort: PaperSort
  readonly page: number
  readonly pageSize: number
}

export interface PaperQueryResult {
  readonly items: readonly Paper[]
  readonly total: number
  readonly page: number
  readonly totalPages: number
}

export function getTrendingScore(paper: Paper) {
  return (paper.communitySignals ?? []).reduce((score, signal) => {
    const weight =
      signal.kind === 'saves' ? 3 : signal.kind === 'discussions' ? 2 : 1
    return score + signal.value * weight
  }, 0)
}

export function getSource(paper: Paper) {
  return paper.provenance[0]?.source ?? 'Unknown source'
}

function matchesSearch(paper: Paper, rawSearch: string) {
  const search = rawSearch.trim().toLocaleLowerCase()
  if (!search) return true

  return [
    paper.title,
    paper.abstract,
    ...paper.authors,
    ...paper.topics,
    ...paper.categories,
  ].some((value) => value.toLocaleLowerCase().includes(search))
}

export function queryPapers(
  papers: readonly Paper[],
  query: PaperQuery,
  now = new Date(),
): PaperQueryResult {
  const rangeInDays = { '7d': 7, '30d': 30, '1y': 365 } as const
  const cutoff =
    query.timeRange === 'all'
      ? undefined
      : now.getTime() - rangeInDays[query.timeRange] * 86_400_000

  const filtered = papers.filter((paper) => {
    if (query.mode === 'for-you' && !paper.recommendation) return false
    if (query.mode === 'trending' && !paper.communitySignals?.length)
      return false
    if (!matchesSearch(paper, query.search)) return false
    if (
      query.topics.length > 0 &&
      !query.topics.every((topic) => paper.topics.includes(topic))
    ) {
      return false
    }
    if (query.source && getSource(paper) !== query.source) return false
    return cutoff === undefined || Date.parse(paper.publishedAt) >= cutoff
  })

  filtered.sort((left, right) => {
    if (query.mode === 'trending') {
      return (
        getTrendingScore(right) - getTrendingScore(left) ||
        Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
      )
    }
    if (query.mode === 'latest' || query.sort === 'newest') {
      return Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
    }
    if (query.sort === 'oldest') {
      return Date.parse(left.publishedAt) - Date.parse(right.publishedAt)
    }
    if (query.sort === 'title') return left.title.localeCompare(right.title)
    return (
      (left.recommendation?.rank ?? Number.MAX_SAFE_INTEGER) -
      (right.recommendation?.rank ?? Number.MAX_SAFE_INTEGER)
    )
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(Math.max(1, query.page), totalPages)
  const start = (page - 1) * query.pageSize

  return {
    items: filtered.slice(start, start + query.pageSize),
    total,
    page,
    totalPages,
  }
}
