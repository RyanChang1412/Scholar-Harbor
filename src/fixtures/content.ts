import type { ContentRepository } from '../data/content/PublicContentRepository'
import type { NewsDataset } from '../domain/news'
import type { RankingsDataset } from '../domain/ranking'

const news: NewsDataset = {
  schemaVersion: 1,
  generatedAt: '2026-05-16T10:00:00Z',
  lastSuccessfulUpdateAt: '2026-05-16T10:00:00Z',
  sources: [
    {
      id: 'fixture-source',
      status: 'ok',
      lastSuccessfulUpdateAt: '2026-05-16T10:00:00Z',
      recordCount: 2,
    },
  ],
  news: [
    {
      id: 'news-00000000000000000001',
      headline:
        'Open evaluation forum proposes clearer reporting for inference cost',
      source: 'Fictional Research Commons',
      sourceId: 'fixture-source',
      originalUrl: 'https://example.invalid/news/evaluation',
      publishedAt: '2026-05-16T09:00:00Z',
      retrievedAt: '2026-05-16T10:00:00Z',
      description:
        'A fictional item for exercising filtering, chronology, and attribution.',
      category: 'Research practice',
      topics: [],
    },
    {
      id: 'news-00000000000000000002',
      headline: 'Small systems workshop shares a reproducibility checklist',
      source: 'Fictional Systems Bulletin',
      sourceId: 'fixture-source',
      originalUrl: 'https://example.invalid/news/systems',
      publishedAt: '2026-05-13T09:00:00Z',
      retrievedAt: '2026-05-16T10:00:00Z',
      description: 'A fictional item with no live event claim.',
      category: 'Community',
      topics: [],
    },
  ],
}

const rankings: RankingsDataset = {
  schemaVersion: 1,
  generatedAt: '2026-05-16T10:00:00Z',
  cards: [
    {
      id: 'fixture-summary',
      kind: 'cached-summary',
      title: 'Fixture paper signals',
      description: 'Development-only ranking layout fixture.',
      source: 'Fixture source',
      url: 'https://example.invalid/rankings',
      retrievedAt: '2026-05-16T10:00:00Z',
      items: [],
    },
    {
      id: 'github-trending',
      kind: 'official-link',
      title: 'GitHub Trending',
      description: 'Official destination.',
      source: 'GitHub',
      url: 'https://github.com/trending',
    },
    {
      id: 'lmarena',
      kind: 'official-link',
      title: 'LMArena Leaderboard',
      description: 'Official destination.',
      source: 'LMArena',
      url: 'https://lmarena.ai/leaderboard',
    },
  ],
}

export const fixtureContentRepository: ContentRepository = {
  news: async () => news,
  rankings: async () => rankings,
}
