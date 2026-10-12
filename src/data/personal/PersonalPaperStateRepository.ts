import {
  createDefaultPaperState,
  personalStateEnvelopeSchema,
  type PersonalPaperState,
  type PersonalStateEnvelope,
  type ReadingStatus,
} from '../../domain/personal-paper-state'

export const personalStateStorageKey = 'scholar-harbor.personal-papers.v1'

export interface PersonalPaperStateRepository {
  get(paperId: string): PersonalPaperState
  setSaved(paperId: string, saved: boolean): PersonalPaperState
  setStatus(paperId: string, status: ReadingStatus): PersonalPaperState
  subscribe(listener: () => void): () => void
}

export class LocalPersonalPaperStateRepository implements PersonalPaperStateRepository {
  readonly #storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  readonly #now: () => string
  readonly #listeners = new Set<() => void>()
  #fallbackEnvelope: PersonalStateEnvelope | undefined

  constructor(
    storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
    now = () => new Date().toISOString(),
  ) {
    this.#storage = storage
    this.#now = now
  }

  get(paperId: string) {
    return this.#load().papers[paperId] ?? createDefaultPaperState(paperId)
  }

  setSaved(paperId: string, saved: boolean) {
    return this.#update(paperId, { saved })
  }

  setStatus(paperId: string, status: ReadingStatus) {
    return this.#update(paperId, { status })
  }

  subscribe(listener: () => void) {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  #load(): PersonalStateEnvelope {
    try {
      const stored = this.#storage.getItem(personalStateStorageKey)
      if (!stored) {
        return this.#fallbackEnvelope ?? { version: 1, papers: {} }
      }
      const result = personalStateEnvelopeSchema.safeParse(JSON.parse(stored))
      if (result.success) return result.data
      this.#storage.removeItem(personalStateStorageKey)
    } catch {
      // Storage can be unavailable or malformed; the interface remains usable.
    }
    return { version: 1, papers: {} }
  }

  #update(
    paperId: string,
    update: Partial<Pick<PersonalPaperState, 'saved' | 'status'>>,
  ) {
    const envelope = this.#load()
    const next = {
      ...(envelope.papers[paperId] ?? createDefaultPaperState(paperId)),
      ...update,
      updatedAt: this.#now(),
    }
    const updatedEnvelope: PersonalStateEnvelope = {
      version: 1,
      papers: { ...envelope.papers, [paperId]: next },
    }
    try {
      this.#storage.setItem(
        personalStateStorageKey,
        JSON.stringify(updatedEnvelope),
      )
      this.#fallbackEnvelope = undefined
    } catch {
      this.#fallbackEnvelope = updatedEnvelope
    }
    this.#listeners.forEach((listener) => listener())
    return next
  }
}

let browserRepository: LocalPersonalPaperStateRepository | undefined

export function getPersonalPaperStateRepository() {
  browserRepository ??= new LocalPersonalPaperStateRepository(
    window.localStorage,
  )
  return browserRepository
}
