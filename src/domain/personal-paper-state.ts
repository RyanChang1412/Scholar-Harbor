import { z } from 'zod'

import { researchProfileSchema } from './research-profile'

export const readingStatusSchema = z.enum([
  'unread',
  'want-to-read',
  'reading',
  'finished',
])
export type ReadingStatus = z.infer<typeof readingStatusSchema>

export const personalPaperStateSchema = z
  .object({
    paperId: z.string().min(1),
    saved: z.boolean(),
    status: readingStatusSchema,
    tags: z.array(z.string().trim().min(1)).max(20),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()

export const personalStateEnvelopeSchema = z
  .object({
    version: z.literal(2),
    papers: z.record(z.string(), personalPaperStateSchema),
    profile: researchProfileSchema,
  })
  .strict()

export type PersonalPaperState = z.infer<typeof personalPaperStateSchema>
export type PersonalStateEnvelope = z.infer<typeof personalStateEnvelopeSchema>

export function createDefaultPaperState(paperId: string): PersonalPaperState {
  return {
    paperId,
    saved: false,
    status: 'unread',
    tags: [],
    updatedAt: '1970-01-01T00:00:00Z',
  }
}
