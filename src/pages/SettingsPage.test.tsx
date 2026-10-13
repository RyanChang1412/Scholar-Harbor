import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from '../test/renderApp'

describe('Settings research profile', () => {
  beforeEach(() => localStorage.clear())

  it('adds a weight control as soon as a focused topic is edited', async () => {
    const user = userEvent.setup()
    renderApp('/settings')

    const focused = screen.getByRole('textbox', { name: 'Focused topics' })
    await user.clear(focused)
    await user.type(focused, 'Recursive Self-Improvement, Custom Lab Topic')

    expect(
      screen.getByRole('spinbutton', { name: 'Custom Lab Topic weight' }),
    ).toHaveValue(1)
    await user.clear(
      screen.getByRole('spinbutton', {
        name: 'Recursive Self-Improvement weight',
      }),
    )
    await user.type(
      screen.getByRole('spinbutton', {
        name: 'Recursive Self-Improvement weight',
      }),
      '1.9',
    )
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(screen.getByText('Research profile saved locally.')).toBeVisible()
    expect(
      JSON.parse(localStorage.getItem('scholar-harbor.personal.v3') ?? '{}')
        .profile.topicWeights['Recursive Self-Improvement'],
    ).toBe(1.9)
  })
})
