import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getPersonalPaperStateRepository } from '../data/personal/PersonalPaperStateRepository'
import { renderApp } from '../test/renderApp'

describe('Scholar Harbor application shell', () => {
  it('renders the editorial homepage with an explicit fixture notice', () => {
    renderApp()

    expect(
      screen.getByRole('heading', {
        name: 'Focused on your research, open to new ideas.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Fixture snapshot · not live academic data'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Papers for You' }),
    ).toBeInTheDocument()
  })

  it('supports keyboard navigation to a top-level route', async () => {
    const user = userEvent.setup()
    renderApp()

    const papersLinks = screen.getAllByRole('link', { name: 'Papers' })
    await user.click(papersLinks[0]!)

    expect(
      await screen.findByRole('heading', { name: 'Papers' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Paper discovery modes' }),
    ).toBeInTheDocument()
  })

  it('requires confirmation before resetting private local data', async () => {
    const user = userEvent.setup()
    const repository = getPersonalPaperStateRepository()
    repository.setSaved('paper-memory-tides', true)
    renderApp('/settings')

    await user.click(screen.getByRole('button', { name: 'Reset local data' }))
    expect(repository.get('paper-memory-tides').saved).toBe(true)
    expect(
      screen.getByText(/Delete this browser's profile/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm reset' }))
    expect(repository.get('paper-memory-tides').saved).toBe(false)
    expect(
      screen.getByText('Local data reset to public defaults.'),
    ).toBeVisible()
  })
})
