import { z } from 'zod'

import taxonomyJson from '../../config/research-taxonomy.v1.json'
import type { Paper } from './paper'

const topicSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: z.enum([
    'core-rsi',
    'enabling-systems',
    'application-ai4s',
    'application-embodied',
    'open-exploration',
  ]),
  relevance: z.enum([
    'direct-rsi',
    'enabling-systems',
    'application-research',
    'adjacent-exploration',
  ]),
  aliases: z.array(z.string().min(1)).min(1),
  relatedTopicIds: z.array(z.string().min(1)).optional(),
  ambiguousAliases: z.array(z.string().min(1)).optional(),
  contextTerms: z.array(z.string().min(1)).optional(),
  excludeTerms: z.array(z.string().min(1)).optional(),
})

const taxonomySchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(1),
  topics: z.array(topicSchema).min(1),
})

export const researchTaxonomy = taxonomySchema.parse(taxonomyJson)
export type TaxonomyTopic = (typeof researchTaxonomy.topics)[number]
export type PaperTopicMatch = NonNullable<Paper['topicMatches']>[number]

function normalized(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[‐-―_/]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function contains(text: string, phrase: string) {
  const escaped = normalized(phrase)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\ /g, '[\\s-]+')
  return new RegExp(
    `(^|[^\\p{L}\\p{N}_])${escaped}($|[^\\p{L}\\p{N}_])`,
    'u',
  ).test(text)
}

export function resolveProfileTopic(value: string) {
  const needle = normalized(value)
  const topic = researchTaxonomy.topics.find(
    (candidate) =>
      normalized(candidate.id) === needle ||
      normalized(candidate.label) === needle ||
      candidate.aliases.some((alias) => normalized(alias) === needle) ||
      candidate.ambiguousAliases?.some((alias) => normalized(alias) === needle),
  )
  return topic
    ? { id: topic.id, label: topic.label, known: true as const, topic }
    : { id: needle, label: value.trim(), known: false as const }
}

export function matchPaperTopics(paper: Paper): readonly PaperTopicMatch[] {
  if (paper.topicMatches) return paper.topicMatches
  const fields = {
    title: normalized(paper.title),
    abstract: normalized(paper.abstract),
  }
  const combined = `${fields.title} ${fields.abstract}`
  return researchTaxonomy.topics.flatMap((topic) => {
    if (topic.excludeTerms?.some((term) => contains(combined, term))) return []
    const evidence: { field: 'title' | 'abstract'; term: string }[] = []
    for (const alias of topic.aliases) {
      const field = (Object.keys(fields) as (keyof typeof fields)[]).find(
        (candidate) => contains(fields[candidate], alias),
      )
      if (field) evidence.push({ field, term: alias })
    }
    for (const alias of topic.ambiguousAliases ?? []) {
      const field = (Object.keys(fields) as (keyof typeof fields)[]).find(
        (candidate) => contains(fields[candidate], alias),
      )
      if (
        field &&
        topic.contextTerms?.some((term) => contains(combined, term))
      ) {
        evidence.push({ field, term: alias })
      }
    }
    if (!evidence.length) return []
    return [
      {
        topicId: topic.id,
        label: topic.label,
        group: topic.group,
        relevance: topic.relevance,
        confidence:
          evidence.some((item) => item.field === 'title') || evidence.length > 1
            ? ('high' as const)
            : ('medium' as const),
        evidence: evidence.slice(0, 4),
      },
    ]
  })
}
