import { paperDatasetSchema, type PaperDataset } from '../../domain/paper'
import type { PaperRepository } from './PaperRepository'

export class PublicPaperRepository implements PaperRepository {
  readonly #url: string
  #dataset: PaperDataset | undefined

  constructor(url = '/data/papers.v1.json') {
    this.#url = url
  }

  async #load() {
    if (this.#dataset) return this.#dataset
    const response = await fetch(this.#url, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`Public paper dataset returned HTTP ${response.status}.`)
    }
    this.#dataset = paperDatasetSchema.parse(await response.json())
    return this.#dataset
  }

  async list() {
    return (await this.#load()).papers
  }

  async getById(id: string) {
    return (await this.list()).find((paper) => paper.id === id) ?? null
  }

  async metadata() {
    const dataset = await this.#load()
    return {
      schemaVersion: dataset.schemaVersion,
      generatedAt: dataset.generatedAt,
      lastSuccessfulUpdateAt: dataset.lastSuccessfulUpdateAt,
      sources: dataset.sources,
      statistics: dataset.statistics,
    }
  }
}

export const publicPaperRepository = new PublicPaperRepository()
