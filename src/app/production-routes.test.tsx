import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import publishedDataset from '../../public/data/papers.v1.json'
import publishedNews from '../../public/data/news.v1.json'
import publishedRankings from '../../public/data/rankings.v1.json'
import { appRoutes } from './router.production'

function renderProductionRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: string) => {
      const payload = input.includes('news')
        ? publishedNews
        : input.includes('rankings')
          ? publishedRankings
          : publishedDataset
      return Promise.resolve({ ok: true, json: async () => payload })
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
      await screen.findByRole('heading', { name: 'Papers for You' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        document.querySelector('a[href^="/papers/paper-"]'),
      ).not.toBeNull(),
    )
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

  it('renders attributed news and clearly labeled ranking references', async () => {
    const newsView = renderProductionRoute('/news')
    expect(
      await screen.findByText(publishedNews.news[0]!.headline),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Source retrieved record/).length,
    ).toBeGreaterThan(0)
    newsView.unmount()

    renderProductionRoute('/rankings')
    expect(
      await screen.findByText('Hugging Face Papers snapshot'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Official external link')).toHaveLength(2)
  })
})
