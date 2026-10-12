import type {
  FixtureNewsItem,
  FixturePaper,
  FixturePulseItem,
} from '../domain/content'

export const fixturePapers = [
  {
    fixture: true,
    id: 'fixture-memory-tides',
    title:
      'Memory Tides: Coordinating Layered KV Cache Policies for Long-Context Language Model Serving',
    authors: ['Mira Solis', 'Theo Rowan', 'Anika Vale'],
    publishedLabel: 'Fixture date · 14 May 2026',
    sourceLabel: 'Fictional systems archive',
    topics: ['KV cache', 'LLM serving', 'Systems'],
    lane: 'Focused',
    recommendationReason:
      'Shown as a focused fixture because it connects cache policy design with serving efficiency.',
    abstract:
      'A fictional study of coordinated memory policies across attention layers, included only to demonstrate the reading hierarchy and variable-length academic metadata.',
  },
  {
    fixture: true,
    id: 'fixture-deliberation-budget',
    title:
      'A Deliberation Budget for Tool-Using Agents Under Uncertain Runtime Constraints',
    authors: ['Lina Hart', 'Soren Cai'],
    publishedLabel: 'Fixture date · 11 May 2026',
    sourceLabel: 'Fictional agent research feed',
    topics: ['Agent systems', 'Reasoning'],
    lane: 'Focused',
    recommendationReason:
      'Shown as a focused fixture for its connection to controllable reasoning and systems constraints.',
    abstract:
      'A fictional paper exploring how an agent might allocate bounded reasoning effort while interacting with tools. No result or claim represents real research.',
  },
  {
    fixture: true,
    id: 'fixture-robotic-field-notes',
    title:
      'Field Notes as World Models: Learning Compact Robotic Priors from Sparse Multimodal Observations',
    authors: ['Noor Bell', 'Emil Kato', 'Priya Aster', 'Jonas Rue'],
    publishedLabel: 'Fixture date · 08 May 2026',
    sourceLabel: 'Fictional robotics digest',
    topics: ['World models', 'Robotics', 'Multimodal'],
    lane: 'Explore',
    recommendationReason:
      'Shown as an exploratory fixture that bridges multimodal models with adjacent robotics research.',
    abstract:
      'A fictional exploration of sparse observation sequences as compact world-model priors, written to test long titles, multiple authors, and exploratory labeling.',
  },
] as const satisfies readonly FixturePaper[]

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
