import { describe, expect, it } from 'vitest'

import {
  LocalPersonalPaperStateRepository,
  personalStateStorageKey,
} from './PersonalPaperStateRepository'

describe('LocalPersonalPaperStateRepository', () => {
  it('persists bookmarks and reading status separately from paper data', () => {
    const repository = new LocalPersonalPaperStateRepository(
      window.localStorage,
      () => '2026-10-12T12:00:00Z',
    )
    repository.setSaved('paper-memory-tides', true)
    repository.setStatus('paper-memory-tides', 'reading')

    const restored = new LocalPersonalPaperStateRepository(window.localStorage)
    expect(restored.get('paper-memory-tides')).toMatchObject({
      saved: true,
      status: 'reading',
    })
  })

  it('recovers safely from corrupt browser storage', () => {
    window.localStorage.setItem(personalStateStorageKey, '{broken')
    const repository = new LocalPersonalPaperStateRepository(
      window.localStorage,
    )
    expect(repository.get('paper-memory-tides')).toMatchObject({
      saved: false,
      status: 'unread',
    })
  })

  it('keeps session state when persistent writes are unavailable', () => {
    const unavailableStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => undefined,
    }
    const repository = new LocalPersonalPaperStateRepository(
      unavailableStorage,
      () => '2026-10-12T12:00:00Z',
    )
    repository.setSaved('paper-memory-tides', true)
    expect(repository.get('paper-memory-tides').saved).toBe(true)
  })
})
