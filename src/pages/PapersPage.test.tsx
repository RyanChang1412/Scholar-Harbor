import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ValidatedPaperRepository } from '../data/papers/PaperRepository'
import { paperFixtures } from '../fixtures/papers'
import { renderApp } from '../test/renderApp'
import { LibraryPage } from './LibraryPage'
import { PapersPage } from './PapersPage'
import { personalStateStorageKey } from '../data/personal/PersonalPaperStateRepository'

describe('paper discovery and detail navigation', () => {
  it('renders a validated, paginated paper list', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/papers?mode=latest')

    expect(
      await screen.findByRole('heading', { name: '10 paper results' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Paper result pages' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(router.state.location.search).toContain('page=2')
    expect(
      await screen.findByRole('link', {
        name: 'Semantic Tides in Versioned Scientific Knowledge Graphs',
      }),
    ).toBeInTheDocument()
  })

  it('searches and displays an empty result state through URL params', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/papers?mode=latest')

    await screen.findByRole('heading', { name: '10 paper results' })
    await user.type(screen.getByRole('searchbox'), 'knowledge graph')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(
      await screen.findByRole('link', {
        name: 'Semantic Tides in Versioned Scientific Knowledge Graphs',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.search).toContain('q=knowledge+graph')

    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'no matching paper phrase')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(
      await screen.findByRole('heading', {
        name: 'No papers match these filters',
      }),
    ).toBeInTheDocument()
  })

  it('reflects topic filters in the URL and result set', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/papers?mode=latest')
    await screen.findByRole('heading', { name: '10 paper results' })

    await user.click(screen.getByRole('checkbox', { name: 'Knowledge graphs' }))
    expect(router.state.location.search).toContain('topic=Knowledge+graphs')
    expect(
      await screen.findByRole('heading', { name: '1 paper results' }),
    ).toBeInTheDocument()
  })

  it('renders a repository validation failure as an error state', async () => {
    const repository = new ValidatedPaperRepository(async () => [
      { id: 'invalid' },
    ])
    render(
      <MemoryRouter>
        <PapersPage repository={repository} />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Paper records could not be loaded',
      }),
    ).toBeInTheDocument()
  })

  it('bookmarks a paper in browser-local state', async () => {
    const user = userEvent.setup()
    renderApp('/papers')

    const saveButtons = await screen.findAllByRole('button', {
      name: 'Save to library',
    })
    await user.click(saveButtons[0]!)
    expect(
      screen.getAllByRole('button', { name: 'Remove from library' })[0],
    ).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem(personalStateStorageKey)).toContain(
      '"saved":true',
    )
    expect(window.localStorage.getItem(personalStateStorageKey)).toContain(
      '"paperSnapshot"',
    )
  })

  it('keeps a saved paper visible after it leaves the rolling dataset', async () => {
    const currentRepository = new ValidatedPaperRepository(async () =>
      paperFixtures.slice(0, 1),
    )
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PapersPage repository={currentRepository} defaultMode="latest" />
      </MemoryRouter>,
    )
    await user.click(
      await screen.findByRole('button', { name: 'Save to library' }),
    )

    const emptyRepository = new ValidatedPaperRepository(async () => [])
    render(
      <MemoryRouter>
        <LibraryPage repository={emptyRepository} />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('link', { name: paperFixtures[0]!.title }),
    ).toBeInTheDocument()
  })

  it('preserves filters when moving to a detail and back to results', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/papers?mode=latest&q=budget')
    const paperLink = await screen.findByRole('link', {
      name: 'A Deliberation Budget for Tool-Using Agents Under Uncertain Runtime Constraints',
    })
    await user.click(paperLink)
    expect(
      await screen.findByRole('heading', { name: /A Deliberation Budget/ }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('link', { name: 'Back to paper results' }),
    )
    await waitFor(() =>
      expect(router.state.location.search).toBe('?mode=latest&q=budget'),
    )
    expect(screen.getByRole('searchbox')).toHaveValue('budget')
  })

  it('handles missing links and local reading state on the detail page', async () => {
    const user = userEvent.setup()
    renderApp('/papers/paper-semantic-tides')
    expect(
      await screen.findByRole('heading', { name: /Semantic Tides/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('PDF link unavailable')).toBeInTheDocument()
    expect(screen.getByText('Code link unavailable')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Reading status'), 'reading')
    expect(window.localStorage.getItem(personalStateStorageKey)).toContain(
      '"status":"reading"',
    )
  })

  it('copies reliable citation metadata as BibTeX', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    renderApp('/papers/paper-memory-tides')
    await screen.findByRole('heading', { name: /Memory Tides/ })
    expect(
      screen.getByRole('link', { name: /10\.9999\/fixture\.memory-tides/ }),
    ).toHaveAttribute('href', 'https://doi.org/10.9999%2Ffixture.memory-tides')

    await user.click(screen.getByRole('button', { name: 'Copy BibTeX' }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('@article{'))
    expect(
      await screen.findByRole('button', { name: 'BibTeX copied' }),
    ).toBeInTheDocument()
  })
})
