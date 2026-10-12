import { describe, expect, it } from 'vitest'

import { fixturePaperSnapshotAt, paperFixtures } from '../fixtures/papers'
import { getTrendingScore, queryPapers, type PaperQuery } from './paper-query'

const baseQuery: PaperQuery = {
  mode: 'latest',
  search: '',
  topics: [],
  source: '',
  timeRange: 'all',
  sort: 'newest',
  page: 1,
  pageSize: 20,
}

describe('paper queries', () => {
  it('uses an explicit 70/30 Focused and Explore fixture composition', () => {
    const { items } = queryPapers(
      paperFixtures,
      { ...baseQuery, mode: 'for-you', sort: 'recommended' },
      fixturePaperSnapshotAt,
    )
    expect(
      items.filter((paper) => paper.recommendation?.lane === 'Focused'),
    ).toHaveLength(7)
    expect(
      items.filter((paper) => paper.recommendation?.lane === 'Explore'),
    ).toHaveLength(3)
  })

  it('orders Latest by the actual publication timestamp descending', () => {
    const { items } = queryPapers(
      paperFixtures,
      baseQuery,
      fixturePaperSnapshotAt,
    )
    const timestamps = items.map((paper) => Date.parse(paper.publishedAt))
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a))
  })

  it('orders Trending by its source-labeled fixture signals', () => {
    const { items } = queryPapers(
      paperFixtures,
      { ...baseQuery, mode: 'trending' },
      fixturePaperSnapshotAt,
    )
    const scores = items.map(getTrendingScore)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    expect(items.every((paper) => paper.communitySignals?.length)).toBe(true)
  })

  it('searches normalized fields and applies topic intersections', () => {
    const search = queryPapers(
      paperFixtures,
      { ...baseQuery, search: 'knowledge graph' },
      fixturePaperSnapshotAt,
    )
    expect(search.items.map((paper) => paper.id)).toEqual([
      'paper-semantic-tides',
    ])

    const topics = queryPapers(
      paperFixtures,
      { ...baseQuery, topics: ['Agent systems', 'Human factors'] },
      fixturePaperSnapshotAt,
    )
    expect(topics.items.map((paper) => paper.id)).toEqual([
      'paper-long-horizon-dialogue',
    ])
  })

  it('applies source and time filters without guessing missing values', () => {
    const source = queryPapers(
      paperFixtures,
      { ...baseQuery, source: 'Fixture Systems Archive' },
      fixturePaperSnapshotAt,
    )
    expect(source.items).toHaveLength(2)

    const recent = queryPapers(
      paperFixtures,
      { ...baseQuery, timeRange: '7d' },
      fixturePaperSnapshotAt,
    )
    expect(
      recent.items.every(
        (paper) =>
          Date.parse(paper.publishedAt) >=
          fixturePaperSnapshotAt.getTime() - 7 * 86_400_000,
      ),
    ).toBe(true)
  })

  it('returns an explicit empty page for a non-matching query', () => {
    const result = queryPapers(
      paperFixtures,
      { ...baseQuery, search: 'term-that-is-not-present' },
      fixturePaperSnapshotAt,
    )
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })
})
