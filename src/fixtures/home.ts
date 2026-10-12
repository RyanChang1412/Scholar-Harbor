import type { FixtureNewsItem, FixturePulseItem } from '../domain/content'

export const fixtureNews = [
  {
    fixture: true,
    id: 'fixture-open-evaluation-forum',
    source: 'Fictional Research Commons',
    publishedLabel: 'Fixture date · 16 May 2026',
    category: 'Research practice',
    headline:
      'Open evaluation forum proposes clearer reporting for inference cost',
    summary:
      'A fictional news item used to demonstrate concise attribution and calm editorial treatment.',
  },
  {
    fixture: true,
    id: 'fixture-systems-workshop',
    source: 'Fictional Systems Bulletin',
    publishedLabel: 'Fixture date · 13 May 2026',
    category: 'Community',
    headline: 'Small systems workshop shares a reproducibility checklist',
    summary:
      'This fixture contains no live event information and links to no external claim.',
  },
] as const satisfies readonly FixtureNewsItem[]

export const fixturePulse = [
  {
    fixture: true,
    id: 'fixture-pulse-memory',
    label: 'Memory-aware inference',
    detail: 'Appearing across this fictional weekly sample',
    direction: 'steady',
  },
  {
    fixture: true,
    id: 'fixture-pulse-agents',
    label: 'Bounded agent reasoning',
    detail: 'An emerging theme in the prototype fixtures',
    direction: 'emerging',
  },
  {
    fixture: true,
    id: 'fixture-pulse-provenance',
    label: 'Evaluation provenance',
    detail: 'Included to preview evidence-aware context',
    direction: 'steady',
  },
] as const satisfies readonly FixturePulseItem[]

export const fixtureSnapshotLabel = 'Fixture snapshot · not live academic data'
