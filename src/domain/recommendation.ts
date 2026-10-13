import type { Paper } from './paper'
import type { ResearchProfile } from './research-profile'

export interface RecommendationWeights {
  readonly focused: {
    readonly relevance: number
    readonly recency: number
    readonly community: number
  }
  readonly explore: {
    readonly adjacency: number
    readonly novelty: number
    readonly diversity: number
    readonly recency: number
    readonly community: number
  }
  readonly mmrLambda: number
}

export const defaultRecommendationWeights: RecommendationWeights = {
  focused: { relevance: 0.58, recency: 0.24, community: 0.18 },
  explore: {
    adjacency: 0.32,
    novelty: 0.22,
    diversity: 0.18,
    recency: 0.18,
    community: 0.1,
  },
  mmrLambda: 0.78,
}

export interface RecommendationOptions {
  readonly limit: number
  readonly now?: Date
  readonly sources?: readonly string[]
  readonly categories?: readonly string[]
  readonly weights?: RecommendationWeights
}

export interface RecommendationMeasurement {
  readonly requested: number
  readonly selected: number
  readonly focused: number
  readonly explore: number
  readonly targetFocusedRatio: number
  readonly quotaRelaxed: boolean
}

export interface RecommendationResult {
  readonly papers: readonly Paper[]
  readonly measurement: RecommendationMeasurement
}

interface Candidate {
  readonly paper: Paper
  readonly lane: 'Focused' | 'Explore'
  readonly score: number
  readonly matched: readonly string[]
}

function normalizedText(paper: Paper) {
  return `${paper.title} ${paper.abstract} ${paper.topics.join(' ')} ${paper.categories.join(' ')}`.toLocaleLowerCase()
}

function topicWeight(profile: ResearchProfile, topic: string) {
  return profile.topicWeights[topic] ?? 1
}

function communityRaw(paper: Paper) {
  const weights = { saves: 3, discussions: 2, citations: 1 }
  return (paper.communitySignals ?? []).reduce(
    (total, signal) => total + signal.value * weights[signal.kind],
    0,
  )
}

function similarity(left: Paper, right: Paper) {
  const a = new Set([...left.topics, ...left.categories])
  const b = new Set([...right.topics, ...right.categories])
  const intersection = [...a].filter((value) => b.has(value)).length
  const union = new Set([...a, ...b]).size
  return union ? intersection / union : 0
}

function rerank(
  candidates: readonly Candidate[],
  limit: number,
  lambda: number,
) {
  const remaining = [...candidates]
  const selected: Candidate[] = []
  while (remaining.length && selected.length < limit) {
    remaining.sort((left, right) => {
      const leftPenalty = Math.max(
        0,
        ...selected.map((item) => similarity(left.paper, item.paper)),
      )
      const rightPenalty = Math.max(
        0,
        ...selected.map((item) => similarity(right.paper, item.paper)),
      )
      const leftMmr = lambda * left.score - (1 - lambda) * leftPenalty
      const rightMmr = lambda * right.score - (1 - lambda) * rightPenalty
      return (
        rightMmr - leftMmr ||
        Date.parse(right.paper.publishedAt) -
          Date.parse(left.paper.publishedAt) ||
        left.paper.id.localeCompare(right.paper.id)
      )
    })
    selected.push(remaining.shift()!)
  }
  return selected
}

function reasonFor(candidate: Candidate) {
  const topics = candidate.matched.slice(0, 2)
  const signalNote = candidate.paper.communitySignals?.length
    ? ''
    : ' No source-backed community signal was available.'
  if (candidate.lane === 'Focused') {
    const reason = topics.length
      ? `Relevant to your focused interests in ${topics.join(' and ')}.`
      : 'Matches one of your explicit research keywords in the source title or abstract.'
    return `${reason}${signalNote}`
  }
  const reason = topics.length
    ? `Explores an adjacent direction through ${topics.join(' and ')}.`
    : 'Adds a recent adjacent topic to diversify this reading set.'
  return `${reason}${signalNote}`
}

export function recommendPapers(
  papers: readonly Paper[],
  profile: ResearchProfile,
  options: RecommendationOptions,
): RecommendationResult {
  const now = options.now ?? new Date()
  const weights = options.weights ?? defaultRecommendationWeights
  const cutoff = now.getTime() - profile.preferredTimeRangeDays * 86_400_000
  const excluded = profile.excludedKeywords.map((value) =>
    value.toLocaleLowerCase(),
  )
  const focusedSet = new Set(profile.focusedTopics)
  const exploreSet = new Set(profile.exploratoryTopics)
  const eligible = papers.filter((paper) => {
    const text = normalizedText(paper)
    if (excluded.some((keyword) => text.includes(keyword))) return false
    if (Date.parse(paper.publishedAt) < cutoff) return false
    if (
      options.sources?.length &&
      !options.sources.includes(paper.provenance[0]?.source ?? '')
    )
      return false
    if (
      options.categories?.length &&
      !paper.categories.some((category) =>
        options.categories?.includes(category),
      )
    )
      return false
    return true
  })
  const maxCommunity = Math.max(1, ...eligible.map(communityRaw))
  const rangeMs = Math.max(1, profile.preferredTimeRangeDays * 86_400_000)

  const candidates: Candidate[] = eligible.map((paper) => {
    const text = normalizedText(paper)
    const focusedMatches = paper.topics.filter((topic) => focusedSet.has(topic))
    const exploreMatches = paper.topics.filter((topic) => exploreSet.has(topic))
    const keywordMatches = profile.customKeywords.filter((keyword) =>
      text.includes(keyword.toLocaleLowerCase()),
    )
    const lane =
      focusedMatches.length || keywordMatches.length ? 'Focused' : 'Explore'
    const age = Math.max(0, now.getTime() - Date.parse(paper.publishedAt))
    const recency = Math.max(0, 1 - age / rangeMs)
    const community = Math.log1p(communityRaw(paper)) / Math.log1p(maxCommunity)
    const focusedWeight = focusedMatches.reduce(
      (total, topic) => total + topicWeight(profile, topic),
      0,
    )
    const relevance = Math.min(
      1,
      focusedWeight / Math.max(1, focusedMatches.length) / 2 +
        Math.min(0.4, keywordMatches.length * 0.2),
    )
    const adjacency = Math.min(1, exploreMatches.length / 2)
    const novelty = Math.max(0, 1 - focusedMatches.length / 2)
    const topicBreadth = Math.min(1, new Set(paper.topics).size / 4)
    const score =
      lane === 'Focused'
        ? relevance * weights.focused.relevance +
          recency * weights.focused.recency +
          community * weights.focused.community
        : adjacency * weights.explore.adjacency +
          novelty * weights.explore.novelty +
          topicBreadth * weights.explore.diversity +
          recency * weights.explore.recency +
          community * weights.explore.community
    return {
      paper,
      lane,
      score,
      matched:
        lane === 'Focused'
          ? [...focusedMatches, ...keywordMatches]
          : exploreMatches,
    }
  })

  const requested = Math.min(options.limit, candidates.length)
  const focusedQuota = Math.round(requested * profile.focusedRatio)
  const exploreQuota = requested - focusedQuota
  const focused = rerank(
    candidates.filter((item) => item.lane === 'Focused'),
    focusedQuota,
    weights.mmrLambda,
  )
  const explore = rerank(
    candidates.filter((item) => item.lane === 'Explore'),
    exploreQuota,
    weights.mmrLambda,
  )
  const used = new Set([...focused, ...explore].map((item) => item.paper.id))
  const shortage = requested - focused.length - explore.length
  const remainder = rerank(
    candidates.filter((item) => !used.has(item.paper.id)),
    shortage,
    weights.mmrLambda,
  )
  focused.push(...remainder.filter((item) => item.lane === 'Focused'))
  explore.push(...remainder.filter((item) => item.lane === 'Explore'))

  const ordered: Candidate[] = []
  let focusedIndex = 0
  let exploreIndex = 0
  while (ordered.length < focused.length + explore.length) {
    const expectedFocused = Math.round(
      (ordered.length + 1) * profile.focusedRatio,
    )
    if (focusedIndex < focused.length && focusedIndex < expectedFocused) {
      ordered.push(focused[focusedIndex++]!)
    } else if (exploreIndex < explore.length) {
      ordered.push(explore[exploreIndex++]!)
    } else if (focusedIndex < focused.length) {
      ordered.push(focused[focusedIndex++]!)
    }
  }

  return {
    papers: ordered.map((candidate, index) => ({
      ...candidate.paper,
      recommendation: {
        lane: candidate.lane,
        reason: reasonFor(candidate),
        rank: index + 1,
      },
    })),
    measurement: {
      requested: options.limit,
      selected: ordered.length,
      focused: focused.length,
      explore: explore.length,
      targetFocusedRatio: profile.focusedRatio,
      quotaRelaxed:
        focused.length !== focusedQuota || explore.length !== exploreQuota,
    },
  }
}
