import { newsDatasetSchema, type NewsDataset } from '../../domain/news'
import {
  rankingsDatasetSchema,
  type RankingsDataset,
} from '../../domain/ranking'

async function loadJson(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok)
    throw new Error(`Public dataset returned HTTP ${response.status}.`)
  return response.json()
}

export interface ContentRepository {
  news(): Promise<NewsDataset>
  rankings(): Promise<RankingsDataset>
}

export class PublicContentRepository implements ContentRepository {
  #news: NewsDataset | undefined
  #rankings: RankingsDataset | undefined

  async news() {
    this.#news ??= newsDatasetSchema.parse(await loadJson('/data/news.v1.json'))
    return this.#news
  }

  async rankings() {
    this.#rankings ??= rankingsDatasetSchema.parse(
      await loadJson('/data/rankings.v1.json'),
    )
    return this.#rankings
  }
}

export const publicContentRepository = new PublicContentRepository()
