import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('exposes an accessible mobile navigation toggle', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    )

    const toggle = screen.getByRole('button', { name: 'Open navigation menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(
      screen.getByRole('button', { name: 'Close navigation menu' }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getAllByRole('navigation', { name: 'Primary navigation' }),
    ).toHaveLength(2)
  })
})
