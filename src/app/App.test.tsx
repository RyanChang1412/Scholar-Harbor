import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

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
})
