import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { paperFixtures } from '../fixtures/papers'
import { renderApp } from '../test/renderApp'

const routeCases = [
  ['/', 'Focused on your research, open to new ideas.'],
  ['/papers', 'Papers'],
  [`/papers/${paperFixtures[0]!.id}`, paperFixtures[0]!.title],
  ['/news', 'News'],
  ['/rankings', 'Rankings'],
  ['/library', 'Library'],
  ['/settings', 'Settings'],
] as const

describe('application routes', () => {
  it.each(routeCases)('renders %s', async (path, heading) => {
    renderApp(path)

    expect(
      await screen.findByRole('heading', { name: heading }),
    ).toBeInTheDocument()
  })

  it('renders a clear missing fixture state for unknown paper IDs', async () => {
    renderApp('/papers/not-a-fixture')

    expect(
      await screen.findByRole('heading', { name: 'Paper not found' }),
    ).toBeInTheDocument()
  })
})
