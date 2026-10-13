import { z } from 'zod'

const officialLinkCard = z
  .object({
    id: z.string().min(1),
    kind: z.literal('official-link'),
    title: z.string().min(1),
    description: z.string().min(1),
    source: z.string().min(1),
    url: z.url().startsWith('https://'),
  })
  .strict()

const cachedSummaryCard = z
  .object({
    id: z.string().min(1),
    kind: z.literal('cached-summary'),
    title: z.string().min(1),
    description: z.string().min(1),
    source: z.string().min(1),
    url: z.url().startsWith('https://'),
    retrievedAt: z.iso.datetime({ offset: true }),
    items: z.array(
      z
        .object({
          paperId: z.string().regex(/^paper-[a-z0-9-]+$/),
          title: z.string().min(1),
          signalLabel: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict()

export const rankingCardSchema = z.discriminatedUnion('kind', [
  cachedSummaryCard,
  officialLinkCard,
])

export const rankingsDatasetSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: z.iso.datetime({ offset: true }),
    cards: z.array(rankingCardSchema).min(3),
  })
  .strict()

export type RankingCard = z.infer<typeof rankingCardSchema>
export type RankingsDataset = z.infer<typeof rankingsDatasetSchema>
