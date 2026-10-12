import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { appRoutes } from './router.production'

function renderProductionRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('production-safe content routes', () => {
  it('renders the public-data empty state without fixture records', () => {
    renderProductionRoute('/')

    expect(
      screen.getByRole('heading', {
        name: 'Focused on your research, open to new ideas.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('No public dataset published')).toBeInTheDocument()
    expect(screen.queryByText('Fictional fixture')).not.toBeInTheDocument()
  })

  it('renders a production-safe paper detail state', () => {
    renderProductionRoute('/papers/fixture-memory-tides')

    expect(
      screen.getByRole('heading', { name: 'Paper content is not available' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Memory Tides/)).not.toBeInTheDocument()
  })
})
