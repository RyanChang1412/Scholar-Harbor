import { describe, expect, it } from 'vitest'

import newsDataset from '../../public/data/news.v1.json'
import rankingsDataset from '../../public/data/rankings.v1.json'
import { newsDatasetSchema } from './news'
import { rankingsDatasetSchema } from './ranking'

describe('published context datasets', () => {
  it('validates news provenance and unique URLs', () => {
    const parsed = newsDatasetSchema.parse(newsDataset)
    expect(new Set(parsed.news.map((item) => item.originalUrl)).size).toBe(
      parsed.news.length,
    )
    expect(parsed.news.every((item) => item.sourceId && item.retrievedAt)).toBe(
      true,
    )
  })

  it('distinguishes cached summaries from official links', () => {
    const parsed = rankingsDatasetSchema.parse(rankingsDataset)
    expect(parsed.cards.some((card) => card.kind === 'cached-summary')).toBe(
      true,
    )
    expect(
      parsed.cards.filter((card) => card.kind === 'official-link'),
    ).toHaveLength(2)
  })
})
