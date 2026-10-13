import { describe, expect, it } from 'vitest'

import {
  legacyPersonalStateStorageKey,
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

  it('round-trips validated exports and rejects invalid imports', () => {
    const repository = new LocalPersonalPaperStateRepository(
      window.localStorage,
      () => '2026-10-12T12:00:00Z',
    )
    repository.setSaved('paper-memory-tides', true)
    repository.setTags('paper-memory-tides', ['systems', 'revisit'])
    const exported = repository.exportJson()
    repository.reset()
    expect(repository.get('paper-memory-tides').saved).toBe(false)
    repository.importJson(exported)
    expect(repository.get('paper-memory-tides')).toMatchObject({
      saved: true,
      tags: ['systems', 'revisit'],
    })
    expect(() => repository.importJson('{"version":2,"papers":{}}')).toThrow(
      /valid Scholar Harbor v2 data/,
    )
  })

  it('migrates the Phase 02 v1 reading state safely', () => {
    window.localStorage.setItem(
      legacyPersonalStateStorageKey,
      JSON.stringify({
        version: 1,
        papers: {
          'paper-memory-tides': {
            paperId: 'paper-memory-tides',
            saved: true,
            status: 'read',
            updatedAt: '2026-10-12T12:00:00Z',
          },
        },
      }),
    )
    const repository = new LocalPersonalPaperStateRepository(
      window.localStorage,
    )
    expect(repository.get('paper-memory-tides')).toMatchObject({
      saved: true,
      status: 'finished',
      tags: [],
    })
    expect(JSON.parse(repository.exportJson()).version).toBe(2)
  })
})
