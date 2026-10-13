import { z } from 'zod'

const isoDateTime = z.iso.datetime({ offset: true })

export const newsItemSchema = z
  .object({
    id: z.string().regex(/^news-[a-f0-9]{20}$/),
    headline: z.string().trim().min(1),
    source: z.string().trim().min(1),
    sourceId: z.string().trim().min(1),
    originalUrl: z.url().startsWith('https://'),
    publishedAt: isoDateTime,
    retrievedAt: isoDateTime,
    description: z.string().trim().min(1),
    category: z.string().trim().min(1),
    topics: z.array(z.string().trim().min(1)),
  })
  .strict()

export const newsDatasetSchema = z
  .object({
    schemaVersion: z.literal(1),
    generatedAt: isoDateTime,
    lastSuccessfulUpdateAt: isoDateTime,
    sources: z.array(
      z
        .object({
          id: z.string().min(1),
          status: z.enum(['ok', 'unavailable']),
          lastSuccessfulUpdateAt: isoDateTime.optional(),
          recordCount: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    news: z.array(newsItemSchema).min(1),
  })
  .strict()

export type NewsItem = z.infer<typeof newsItemSchema>
export type NewsDataset = z.infer<typeof newsDatasetSchema>

export function formatContentDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}
