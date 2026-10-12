import type { Paper } from '../../domain/paper'
import { paperCollectionSchema } from '../../domain/paper'

export interface PaperRepository {
  list(): Promise<readonly Paper[]>
  getById(id: string): Promise<Paper | null>
}

export class ValidatedPaperRepository implements PaperRepository {
  readonly #loadRecords: () => Promise<unknown>
  #cache: readonly Paper[] | undefined

  constructor(loadRecords: () => Promise<unknown>) {
    this.#loadRecords = loadRecords
  }

  async list() {
    this.#cache ??= paperCollectionSchema.parse(await this.#loadRecords())
    return this.#cache
  }

  async getById(id: string) {
    const papers = await this.list()
    return papers.find((paper) => paper.id === id) ?? null
  }
}
