export type DiscoveryLane = 'Focused' | 'Explore'

export interface FixturePaper {
  readonly fixture: true
  readonly id: string
  readonly title: string
  readonly authors: readonly string[]
  readonly publishedLabel: string
  readonly sourceLabel: string
  readonly topics: readonly string[]
  readonly lane: DiscoveryLane
  readonly recommendationReason: string
  readonly abstract: string
}

export interface FixtureNewsItem {
  readonly fixture: true
  readonly id: string
  readonly source: string
  readonly publishedLabel: string
  readonly category: string
  readonly headline: string
  readonly summary: string
}

export interface FixturePulseItem {
  readonly fixture: true
  readonly id: string
  readonly label: string
  readonly detail: string
  readonly direction: 'steady' | 'emerging'
}
