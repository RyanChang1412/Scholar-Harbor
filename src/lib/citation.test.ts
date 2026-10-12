import { describe, expect, it } from 'vitest'

import { paperFixtures } from '../fixtures/papers'
import { createBibTeX } from './citation'

describe('createBibTeX', () => {
  it('uses reliable normalized metadata and includes DOI only when present', () => {
    const withDoi = createBibTeX(paperFixtures[0]!)
    expect(withDoi).toContain('archivePrefix = {arXiv}')
    expect(withDoi).toContain('doi = {10.9999/fixture.memory-tides}')

    const withoutDoi = createBibTeX(paperFixtures[1]!)
    expect(withoutDoi).not.toContain('doi =')
  })
})
