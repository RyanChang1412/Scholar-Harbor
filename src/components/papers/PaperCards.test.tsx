import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { Paper } from '../../domain/paper'
import { paperFixtures } from '../../fixtures/papers'
import { CompactPaperCard } from './CompactPaperCard'

const longTitlePaper: Paper = {
  ...paperFixtures[0]!,
  id: 'paper-long-title-fixture',
  title:
    'A Deliberately Extended Fictional Research Paper Title for Verifying That Dense Academic Metadata Wraps Gracefully Without Escaping Its Reading Surface at Narrow Viewport Widths',
  authors: [
    'Alexandria Marisol Peregrine with an Unusually Extended Name',
    'Bartholomew Kofi West-Sommer the Fictional Second Author',
  ],
  topics: ['Layout fixture'],
  abstract: 'Fictional fixture abstract.',
  recommendation: {
    lane: 'Explore',
    rank: 1,
    reason: 'This fixture exists only to exercise variable-length content.',
  },
}

describe('CompactPaperCard', () => {
  it('renders long metadata without truncating the paper title or authors', () => {
    render(
      <MemoryRouter>
        <CompactPaperCard
          paper={longTitlePaper}
          recordLabel="Fictional fixture"
        />
      </MemoryRouter>,
    )

    const title = screen.getByRole('link', { name: longTitlePaper.title })
    expect(title).toHaveTextContent(longTitlePaper.title)
    expect(title.closest('h3')).toHaveClass('break-words')
    expect(screen.getByText('Fictional fixture')).toBeInTheDocument()
    expect(screen.getByText(/Alexandria Marisol/)).toBeInTheDocument()
  })
})
