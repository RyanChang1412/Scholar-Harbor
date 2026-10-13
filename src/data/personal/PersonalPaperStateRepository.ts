import { z } from 'zod'

import {
  createDefaultPaperState,
  personalPaperStateSchema,
  personalStateEnvelopeSchema,
  type PersonalPaperState,
  type PersonalStateEnvelope,
  type ReadingStatus,
} from '../../domain/personal-paper-state'
import type { Paper } from '../../domain/paper'
import {
  publicDefaultProfile,
  researchProfileSchema,
  type ResearchProfile,
} from '../../domain/research-profile'

export const personalStateStorageKey = 'scholar-harbor.personal.v3'
export const legacyV2PersonalStateStorageKey = 'scholar-harbor.personal.v2'
export const legacyPersonalStateStorageKey = 'scholar-harbor.personal-papers.v1'

const legacyV2EnvelopeSchema = z
  .object({
    version: z.literal(2),
    papers: z.record(
      z.string(),
      z
        .object({
          paperId: z.string().min(1),
          saved: z.boolean(),
          status: z.enum(['unread', 'want-to-read', 'reading', 'finished']),
          tags: z.array(z.string().trim().min(1)).max(20),
          updatedAt: z.iso.datetime({ offset: true }),
        })
        .strict(),
    ),
    profile: researchProfileSchema,
  })
  .strict()

const legacyEnvelopeSchema = z
  .object({
    version: z.literal(1),
    papers: z.record(
      z.string(),
      z.object({
        paperId: z.string(),
        saved: z.boolean(),
        status: z.enum(['unread', 'reading', 'read']),
        updatedAt: z.string(),
      }),
    ),
  })
  .strict()

function emptyEnvelope(): PersonalStateEnvelope {
  return {
    version: 3,
    papers: {},
    profile: structuredClone(publicDefaultProfile),
  }
}

export interface PersonalPaperStateRepository {
  get(paperId: string): PersonalPaperState
  list(): readonly PersonalPaperState[]
  getProfile(): ResearchProfile
  setSaved(paper: Paper | string, saved: boolean): PersonalPaperState
  setStatus(paperId: string, status: ReadingStatus): PersonalPaperState
  setTags(paperId: string, tags: readonly string[]): PersonalPaperState
  setProfile(profile: ResearchProfile): ResearchProfile
  exportJson(): string
  importJson(value: string): PersonalStateEnvelope
  reset(): void
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

  list() {
    return Object.values(this.#load().papers)
  }

  getProfile() {
    return this.#load().profile
  }

  setSaved(paper: Paper | string, saved: boolean) {
    const paperId = typeof paper === 'string' ? paper : paper.id
    if (typeof paper === 'string') return this.#updatePaper(paperId, { saved })

    const paperSnapshot = { ...paper }
    delete paperSnapshot.recommendation
    return this.#updatePaper(paperId, { saved, paperSnapshot })
  }

  setStatus(paperId: string, status: ReadingStatus) {
    return this.#updatePaper(paperId, { status })
  }

  setTags(paperId: string, tags: readonly string[]) {
    const normalized = [
      ...new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
    ]
    return this.#updatePaper(paperId, { tags: normalized.slice(0, 20) })
  }

  setProfile(profile: ResearchProfile) {
    const next = personalStateEnvelopeSchema.parse({
      ...this.#load(),
      profile,
    })
    this.#persist(next)
    return next.profile
  }

  exportJson() {
    return JSON.stringify(this.#load(), null, 2)
  }

  importJson(value: string) {
    const result = personalStateEnvelopeSchema.safeParse(JSON.parse(value))
    if (!result.success) {
      throw new Error('The selected file is not valid Scholar Harbor v3 data.')
    }
    this.#persist(result.data)
    return result.data
  }

  reset() {
    this.#storage.removeItem(personalStateStorageKey)
    this.#storage.removeItem(legacyV2PersonalStateStorageKey)
    this.#storage.removeItem(legacyPersonalStateStorageKey)
    this.#fallbackEnvelope = undefined
    this.#notify()
  }

  subscribe(listener: () => void) {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  #load(): PersonalStateEnvelope {
    if (this.#fallbackEnvelope) return this.#fallbackEnvelope
    try {
      const stored = this.#storage.getItem(personalStateStorageKey)
      if (stored) {
        const result = personalStateEnvelopeSchema.safeParse(JSON.parse(stored))
        if (result.success) return result.data
        this.#storage.removeItem(personalStateStorageKey)
      }
      const legacyV2 = this.#storage.getItem(legacyV2PersonalStateStorageKey)
      if (legacyV2) {
        const result = legacyV2EnvelopeSchema.safeParse(JSON.parse(legacyV2))
        if (result.success) {
          const migrated = personalStateEnvelopeSchema.parse({
            ...result.data,
            version: 3,
          })
          this.#persist(migrated)
          this.#storage.removeItem(legacyV2PersonalStateStorageKey)
          return migrated
        }
      }
      const legacy = this.#storage.getItem(legacyPersonalStateStorageKey)
      if (legacy) {
        const result = legacyEnvelopeSchema.safeParse(JSON.parse(legacy))
        if (result.success) {
          const migrated = personalStateEnvelopeSchema.parse({
            version: 3,
            profile: publicDefaultProfile,
            papers: Object.fromEntries(
              Object.entries(result.data.papers).map(([id, state]) => [
                id,
                {
                  ...state,
                  status: state.status === 'read' ? 'finished' : state.status,
                  tags: [],
                },
              ]),
            ),
          })
          this.#persist(migrated)
          this.#storage.removeItem(legacyPersonalStateStorageKey)
          return migrated
        }
      }
    } catch {
      // Browser storage can be unavailable. Keep the feature usable in memory.
    }
    return emptyEnvelope()
  }

  #updatePaper(
    paperId: string,
    update: Partial<
      Pick<PersonalPaperState, 'paperSnapshot' | 'saved' | 'status' | 'tags'>
    >,
  ) {
    const envelope = this.#load()
    const next = personalPaperStateSchema.parse({
      ...(envelope.papers[paperId] ?? createDefaultPaperState(paperId)),
      ...update,
      updatedAt: this.#now(),
    })
    this.#persist({
      ...envelope,
      papers: { ...envelope.papers, [paperId]: next },
    })
    return next
  }

  #persist(envelope: PersonalStateEnvelope) {
    try {
      this.#storage.setItem(personalStateStorageKey, JSON.stringify(envelope))
      this.#fallbackEnvelope = undefined
    } catch {
      this.#fallbackEnvelope = envelope
    }
    this.#notify()
  }

  #notify() {
    this.#listeners.forEach((listener) => listener())
  }
}

let browserRepository: LocalPersonalPaperStateRepository | undefined

export function getPersonalPaperStateRepository() {
  browserRepository ??= new LocalPersonalPaperStateRepository(
    window.localStorage,
  )
  return browserRepository
}
