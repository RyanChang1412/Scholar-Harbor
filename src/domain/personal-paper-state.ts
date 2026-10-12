import { z } from 'zod'

export const readingStatusSchema = z.enum(['unread', 'reading', 'read'])
export type ReadingStatus = z.infer<typeof readingStatusSchema>

export const personalPaperStateSchema = z
  .object({
    paperId: z.string().min(1),
    saved: z.boolean(),
    status: readingStatusSchema,
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()

export const personalStateEnvelopeSchema = z
  .object({
    version: z.literal(1),
    papers: z.record(z.string(), personalPaperStateSchema),
  })
  .strict()

export type PersonalPaperState = z.infer<typeof personalPaperStateSchema>
export type PersonalStateEnvelope = z.infer<typeof personalStateEnvelopeSchema>

export function createDefaultPaperState(paperId: string): PersonalPaperState {
  return {
    paperId,
    saved: false,
    status: 'unread',
    updatedAt: '1970-01-01T00:00:00Z',
  }
}
