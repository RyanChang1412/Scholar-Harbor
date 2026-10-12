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
