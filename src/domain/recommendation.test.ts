import { describe, expect, it } from 'vitest'

import { paperFixtures } from '../fixtures/papers'
import { recommendPapers } from './recommendation'
import { publicDefaultProfile, type ResearchProfile } from './research-profile'

const now = new Date('2026-10-12T00:00:00Z')

function candidateSet() {
  return paperFixtures.map((paper, index) => {
    const candidate = { ...paper }
    delete candidate.recommendation
    return {
      ...candidate,
      topics: [
        index < 7 ? 'Focused topic' : 'Explore topic',
        `Distinct ${index}`,
      ],
    }
  })
}

const profile: ResearchProfile = {
  ...publicDefaultProfile,
  focusedTopics: ['Focused topic'],
  exploratoryTopics: ['Explore topic'],
  topicWeights: { 'Focused topic': 1.5 },
}

describe('balanced discovery', () => {
  it('selects an exact 70/30 split with sufficient candidates and no duplicates', () => {
    const result = recommendPapers(candidateSet(), profile, { limit: 10, now })
    expect(result.measurement).toMatchObject({
      selected: 10,
      focused: 7,
      explore: 3,
      quotaRelaxed: false,
    })
    expect(new Set(result.papers.map((paper) => paper.id)).size).toBe(10)
  })

  it('relaxes an unavailable lane instead of duplicating or forcing quota', () => {
    const onlyFocused = candidateSet().slice(0, 5)
    const result = recommendPapers(onlyFocused, profile, { limit: 5, now })
    expect(result.measurement).toMatchObject({
      selected: 5,
      focused: 5,
      explore: 0,
      quotaRelaxed: true,
    })
  })

  it('is deterministic and applies exclusions before ranking', () => {
    const excludedProfile = { ...profile, excludedKeywords: ['Memory Tides'] }
    const first = recommendPapers(candidateSet(), excludedProfile, {
      limit: 8,
      now,
    })
    const second = recommendPapers(candidateSet(), excludedProfile, {
      limit: 8,
      now,
    })
    expect(first.papers.map((paper) => paper.id)).toEqual(
      second.papers.map((paper) => paper.id),
    )
    expect(
      first.papers.some((paper) => paper.title.includes('Memory Tides')),
    ).toBe(false)
  })

  it('changes ranking for a different private profile and handles absent signals', () => {
    const papers = candidateSet().map((paper, index) => {
      if (index !== 0) return paper
      const withoutSignals = { ...paper }
      delete withoutSignals.communitySignals
      return withoutSignals
    })
    const alternate = {
      ...profile,
      focusedTopics: ['Explore topic'],
      exploratoryTopics: ['Focused topic'],
      topicWeights: { 'Explore topic': 2 },
    }
    const first = recommendPapers(papers, profile, { limit: 6, now })
    const second = recommendPapers(papers, alternate, { limit: 6, now })
    const complete = recommendPapers(papers, profile, { limit: 10, now })
    expect(first.papers.map((paper) => paper.id)).not.toEqual(
      second.papers.map((paper) => paper.id),
    )
    expect(first.papers).toHaveLength(6)
    expect(
      complete.papers.find((paper) => paper.id === papers[0]!.id)
        ?.recommendation?.reason,
    ).toContain('No source-backed community signal was available.')
  })

  it('uses deterministic MMR-style topic diversity within a lane', () => {
    const base = candidateSet()
      .slice(0, 3)
      .map((paper) => {
        const candidate = { ...paper }
        delete candidate.communitySignals
        return { ...candidate, publishedAt: '2026-10-10T00:00:00Z' }
      })
    const candidates = [
      { ...base[0]!, topics: ['Explore topic', 'Shared'] },
      { ...base[1]!, topics: ['Explore topic', 'Shared'] },
      { ...base[2]!, topics: ['Explore topic', 'Distinct'] },
    ]
    const exploreOnly = { ...profile, focusedRatio: 0 }
    const result = recommendPapers(candidates, exploreOnly, { limit: 2, now })
    expect(result.papers.map((paper) => paper.topics[1])).toContain('Distinct')
  })
})
