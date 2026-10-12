import { z } from 'zod'

export const discoveryLaneSchema = z.enum(['Focused', 'Explore'])
export type DiscoveryLane = z.infer<typeof discoveryLaneSchema>

const isoDateTimeSchema = z.iso.datetime({ offset: true })

export const paperSchema = z
  .object({
    id: z.string().regex(/^paper-[a-z0-9-]+$/),
    arxivId: z.string().regex(/^\d{4}\.\d{4,5}(v\d+)?$/),
    doi: z
      .string()
      .regex(/^10\.\d{4,9}\/.+$/i)
      .optional(),
    title: z.string().trim().min(1),
    authors: z.array(z.string().trim().min(1)).min(1),
    abstract: z.string().trim().min(1),
    publishedAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    provenance: z
      .array(
        z
          .object({
            source: z.string().trim().min(1),
            sourceRecordId: z.string().trim().min(1),
            retrievedAt: isoDateTimeSchema,
          })
          .strict(),
      )
      .min(1),
    categories: z.array(z.string().trim().min(1)).min(1),
    topics: z.array(z.string().trim().min(1)).min(1),
    externalLinks: z.array(
      z
        .object({
          kind: z.enum(['paper', 'pdf', 'code']),
          url: z.url().refine((url) => url.startsWith('https://'), {
            message: 'External links must use HTTPS.',
          }),
          verification: z
            .object({
              status: z.enum(['verified', 'fixture']),
              checkedAt: isoDateTimeSchema,
              source: z.string().trim().min(1),
            })
            .strict(),
        })
        .strict(),
    ),
    communitySignals: z
      .array(
        z
          .object({
            kind: z.enum(['saves', 'discussions', 'citations']),
            value: z.number().nonnegative(),
            source: z.string().trim().min(1),
            observedAt: isoDateTimeSchema,
            fixture: z.boolean(),
          })
          .strict(),
      )
      .optional(),
    aiEnrichment: z
      .discriminatedUnion('status', [
        z.object({ status: z.literal('unavailable') }).strict(),
        z
          .object({
            status: z.literal('available'),
            overview: z.string().trim().min(1),
            basis: z.enum(['title-abstract', 'full-text']),
            generatedAt: isoDateTimeSchema,
            promptVersion: z.string().trim().min(1),
            sourceFingerprint: z.string().trim().min(1),
          })
          .strict(),
      ])
      .optional(),
    recommendation: z
      .object({
        lane: discoveryLaneSchema,
        reason: z.string().trim().min(1),
        rank: z.number().int().positive(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine(
    (paper) => Date.parse(paper.updatedAt) >= Date.parse(paper.publishedAt),
    {
      message: 'updatedAt must be on or after publishedAt.',
      path: ['updatedAt'],
    },
  )

export const paperCollectionSchema = z.array(paperSchema)
export type Paper = z.infer<typeof paperSchema>
export type PaperExternalLink = Paper['externalLinks'][number]

export function getPaperLink(paper: Paper, kind: PaperExternalLink['kind']) {
  return paper.externalLinks.find((link) => link.kind === kind)
}

export function getPrimarySource(paper: Paper) {
  return paper.provenance[0]?.source ?? 'Unknown source'
}

export function formatPaperDate(isoDate: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(isoDate))
}
