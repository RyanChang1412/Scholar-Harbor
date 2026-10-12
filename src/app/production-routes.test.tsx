import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import publishedDataset from '../../public/data/papers.v1.json'
import { appRoutes } from './router.production'

function renderProductionRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => publishedDataset,
    }),
  )
})

describe('production source-backed content routes', () => {
  it('renders a validated real paper without fixture content', async () => {
    renderProductionRoute('/')

    expect(
      screen.getByRole('heading', {
        name: 'Focused on your research, open to new ideas.',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('link', {
        name: publishedDataset.papers[0]!.title,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Fictional fixture')).not.toBeInTheDocument()
  })

  it('renders a stable source-backed paper detail route', async () => {
    const paper = publishedDataset.papers[0]!
    renderProductionRoute(`/papers/${paper.id}`)

    expect(
      await screen.findByRole('heading', { name: paper.title }),
    ).toBeInTheDocument()
    expect(screen.getByText('Source-backed record')).toBeInTheDocument()
    expect(screen.queryByText('Fictional fixture')).not.toBeInTheDocument()
  })
})
