import { describe, expect, it } from 'vitest'

import { rawPaperFixtures } from '../fixtures/papers'
import { paperCollectionSchema, paperSchema } from './paper'

describe('paper schema', () => {
  it('validates every normalized fixture record at runtime', () => {
    const papers = paperCollectionSchema.parse(rawPaperFixtures)
    expect(papers).toHaveLength(10)
    expect(papers[0]).not.toHaveProperty('saved')
    expect(papers[0]?.provenance[0]?.retrievedAt).toMatch(/Z$/)
  })

  it('rejects malformed identifiers, insecure links, and reversed timestamps', () => {
    const valid = paperCollectionSchema.parse(rawPaperFixtures)[0]!
    const result = paperSchema.safeParse({
      ...valid,
      arxivId: 'not-an-arxiv-id',
      publishedAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-11T00:00:00Z',
      externalLinks: [
        {
          kind: 'paper',
          url: 'http://example.invalid/paper',
          verification: valid.externalLinks[0]!.verification,
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
