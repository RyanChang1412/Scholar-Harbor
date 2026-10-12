import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { fixturePapers } from '../fixtures/home'
import { renderApp } from '../test/renderApp'

const routeCases = [
  ['/', 'Focused on your research, open to new ideas.'],
  ['/papers', 'Papers'],
  [`/papers/${fixturePapers[0].id}`, fixturePapers[0].title],
  ['/news', 'News'],
  ['/rankings', 'Rankings'],
  ['/library', 'Library'],
  ['/settings', 'Settings'],
] as const

describe('application routes', () => {
  it.each(routeCases)('renders %s', (path, heading) => {
    renderApp(path)

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('renders a clear missing fixture state for unknown paper IDs', () => {
    renderApp('/papers/not-a-fixture')

    expect(
      screen.getByRole('heading', { name: 'Paper fixture not found' }),
    ).toBeInTheDocument()
  })
})
