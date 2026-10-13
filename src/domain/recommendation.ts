import type { Paper } from './paper'
import type { ResearchProfile } from './research-profile'
import {
  matchPaperTopics,
  resolveProfileTopic,
  type PaperTopicMatch,
} from './research-taxonomy'

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

interface MatchReason {
  readonly label: string
  readonly kind: 'exact' | 'related' | 'keyword' | 'legacy-topic'
  readonly match?: PaperTopicMatch
}

interface Candidate {
  readonly paper: Paper
  readonly lane: 'Focused' | 'Explore'
  readonly score: number
  readonly matched: readonly MatchReason[]
}

function normalizedText(paper: Paper) {
  return `${paper.title} ${paper.abstract} ${paper.topics.join(' ')} ${paper.categories.join(' ')}`.toLocaleLowerCase()
}

function topicWeight(profile: ResearchProfile, topic: string) {
  const topicId = resolveProfileTopic(topic).id
  return (
    Object.entries(profile.topicWeights).find(
      ([candidate]) => resolveProfileTopic(candidate).id === topicId,
    )?.[1] ?? 1
  )
}

function communityRaw(paper: Paper) {
  const weights = { saves: 3, discussions: 2, citations: 1 }
  return (paper.communitySignals ?? []).reduce(
    (total, signal) => total + signal.value * weights[signal.kind],
    0,
  )
}

function similarity(left: Paper, right: Paper) {
  const leftMatches = matchPaperTopics(left)
  const rightMatches = matchPaperTopics(right)
  const a = new Set([
    ...left.topics,
    ...left.categories,
    ...leftMatches.flatMap((match) => [match.topicId, match.group]),
  ])
  const b = new Set([
    ...right.topics,
    ...right.categories,
    ...rightMatches.flatMap((match) => [match.topicId, match.group]),
  ])
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
      const penalty = (candidate: Candidate) =>
        Math.max(
          0,
          ...selected.map((item) => similarity(candidate.paper, item.paper)),
        )
      const leftMmr = lambda * left.score - (1 - lambda) * penalty(left)
      const rightMmr = lambda * right.score - (1 - lambda) * penalty(right)
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
  const reasons = candidate.matched.slice(0, 2)
  const evidenced = reasons.find((reason) => reason.match)
  const signalNote = candidate.paper.communitySignals?.length
    ? ''
    : ' No source-backed community signal was available.'
  if (candidate.lane === 'Focused') {
    const reason = evidenced?.match
      ? `${evidenced.match.relevance === 'direct-rsi' ? 'Directly studies' : 'Supports'} ${evidenced.label}; the source ${evidenced.match.evidence[0]?.field ?? 'metadata'} contains “${evidenced.match.evidence[0]?.term ?? evidenced.label}”.`
      : reasons.length
        ? `Matches your explicit profile topic ${reasons.map((item) => item.label).join(' and ')} in normalized source metadata.`
        : 'Matches one of your explicit research keywords in the source title or abstract.'
    return `${reason}${signalNote}`
  }
  const reason = evidenced?.match
    ? `Explores ${evidenced.label} as ${evidenced.match.relevance.replaceAll('-', ' ')}; the source ${evidenced.match.evidence[0]?.field ?? 'metadata'} contains “${evidenced.match.evidence[0]?.term ?? evidenced.label}”.`
    : reasons.length
      ? `Explores an adjacent direction through ${reasons.map((item) => item.label).join(' and ')}.`
      : 'Adds a recent adjacent topic to diversify this reading set.'
  return `${reason}${signalNote}`
}

function semanticReasons(
  matches: readonly PaperTopicMatch[],
  profileTopics: ReturnType<typeof resolveProfileTopic>[],
) {
  const exact: MatchReason[] = matches.flatMap((match) => {
    const profileTopic = profileTopics.find(
      (topic) => topic.known && topic.id === match.topicId,
    )
    return profileTopic
      ? [{ label: profileTopic.label, kind: 'exact', match }]
      : []
  })
  const related: MatchReason[] = matches.flatMap((match) => {
    if (exact.some((item) => item.match?.topicId === match.topicId)) return []
    const matchedTopic = resolveProfileTopic(match.topicId)
    const profileTopic = profileTopics.find(
      (topic) =>
        topic.known &&
        (topic.topic.relatedTopicIds?.includes(match.topicId) ||
          (matchedTopic.known &&
            matchedTopic.topic.relatedTopicIds?.includes(topic.id))),
    )
    return profileTopic ? [{ label: match.label, kind: 'related', match }] : []
  })
  return [...exact, ...related]
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
  const focusedTopics = profile.focusedTopics.map(resolveProfileTopic)
  const exploreTopics = profile.exploratoryTopics.map(resolveProfileTopic)
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

  const candidates: Candidate[] = eligible.flatMap((paper) => {
    const text = normalizedText(paper)
    const matches = matchPaperTopics(paper)
    const paperTopicLabels = new Set(
      paper.topics.map((topic) => topic.toLocaleLowerCase()),
    )
    const legacyReasons = (
      profileTopics: typeof focusedTopics,
    ): MatchReason[] =>
      profileTopics.flatMap((topic) =>
        !topic.known && paperTopicLabels.has(topic.label.toLocaleLowerCase())
          ? [{ label: topic.label, kind: 'legacy-topic' }]
          : [],
      )
    const keywordMatches: MatchReason[] = profile.customKeywords.flatMap(
      (keyword) =>
        text.includes(keyword.toLocaleLowerCase())
          ? [{ label: keyword, kind: 'keyword' }]
          : [],
    )
    const focusedMatches = [
      ...semanticReasons(matches, focusedTopics),
      ...legacyReasons(focusedTopics),
      ...keywordMatches,
    ]
    const exploreMatches = [
      ...semanticReasons(matches, exploreTopics),
      ...legacyReasons(exploreTopics),
    ]
    const lane = focusedMatches.length
      ? 'Focused'
      : exploreMatches.length
        ? 'Explore'
        : null
    if (!lane) return []
    const age = Math.max(0, now.getTime() - Date.parse(paper.publishedAt))
    const recency = Math.max(0, 1 - age / rangeMs)
    const community = Math.log1p(communityRaw(paper)) / Math.log1p(maxCommunity)
    const focusedWeight = focusedMatches.reduce(
      (total, item) =>
        total +
        topicWeight(profile, item.label) *
          (item.kind === 'exact' || item.kind === 'legacy-topic'
            ? 1
            : item.kind === 'keyword'
              ? 0.5
              : 0.55),
      0,
    )
    const relevance = Math.min(
      1,
      focusedWeight / Math.max(1, focusedMatches.length) / 2 +
        Math.min(0.4, keywordMatches.length * 0.2),
    )
    const adjacency = Math.min(1, exploreMatches.length / 2)
    const novelty = Math.max(0, 1 - focusedMatches.length / 2)
    const topicBreadth = Math.min(
      1,
      new Set([...paper.topics, ...matches.map((match) => match.group)]).size /
        5,
    )
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
    return [
      {
        paper,
        lane,
        score,
        matched: lane === 'Focused' ? focusedMatches : exploreMatches,
      },
    ]
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
        ordered.length < options.limit ||
        focused.length !== focusedQuota ||
        explore.length !== exploreQuota,
    },
  }
}
