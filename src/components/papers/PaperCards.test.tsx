import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { FixturePaper } from '../../domain/content'
import { CompactPaperCard } from './CompactPaperCard'

const longTitlePaper: FixturePaper = {
  fixture: true,
  id: 'long-title-fixture',
  title:
    'A Deliberately Extended Fictional Research Paper Title for Verifying That Dense Academic Metadata Wraps Gracefully Without Escaping Its Reading Surface at Narrow Viewport Widths',
  authors: ['A Fictional Author with a Long Name', 'Another Fictional Author'],
  publishedLabel: 'Fixture date · 01 January 2026',
  sourceLabel: 'Fictional source with a deliberately extended label',
  topics: ['Layout fixture'],
  lane: 'Explore',
  recommendationReason:
    'This fixture exists only to exercise variable-length content.',
  abstract: 'Fictional fixture abstract.',
}

describe('CompactPaperCard', () => {
  it('renders long metadata without truncating the paper title', () => {
    render(
      <MemoryRouter>
        <CompactPaperCard paper={longTitlePaper} />
      </MemoryRouter>,
    )

    const title = screen.getByRole('link', { name: longTitlePaper.title })
    expect(title).toHaveTextContent(longTitlePaper.title)
    expect(title.closest('h3')).toHaveClass('break-words')
    expect(screen.getByText('Fictional fixture')).toBeInTheDocument()
  })
})
