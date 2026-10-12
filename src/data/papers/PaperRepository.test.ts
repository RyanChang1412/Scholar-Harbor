import { describe, expect, it } from 'vitest'

import { rawPaperFixtures } from '../../fixtures/papers'
import { ValidatedPaperRepository } from './PaperRepository'

describe('ValidatedPaperRepository', () => {
  it('loads records and resolves stable internal IDs', async () => {
    const repository = new ValidatedPaperRepository(
      async () => rawPaperFixtures,
    )
    const papers = await repository.list()
    expect(await repository.getById(papers[0]!.id)).toEqual(papers[0])
    expect(await repository.getById('paper-unknown')).toBeNull()
  })

  it('rejects a collection that fails runtime validation', async () => {
    const repository = new ValidatedPaperRepository(async () => [
      { id: 'broken' },
    ])
    await expect(repository.list()).rejects.toThrow()
  })
})
