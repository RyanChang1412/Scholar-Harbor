import { z } from 'zod'

export const researchProfileSchema = z
  .object({
    focusedTopics: z.array(z.string().trim().min(1)).max(20),
    exploratoryTopics: z.array(z.string().trim().min(1)).max(20),
    topicWeights: z.record(z.string(), z.number().min(0).max(2)),
    customKeywords: z.array(z.string().trim().min(1)).max(30),
    excludedKeywords: z.array(z.string().trim().min(1)).max(30),
    preferredTimeRangeDays: z.number().int().min(1).max(3650),
    focusedRatio: z.number().min(0).max(1),
    showAiOverviews: z.boolean(),
  })
  .strict()

export type ResearchProfile = z.infer<typeof researchProfileSchema>

export const publicDefaultProfile: ResearchProfile = {
  focusedTopics: ['LLM systems', 'Efficient inference', 'Agent systems'],
  exploratoryTopics: [
    'Multimodal learning',
    'Robotics',
    'Trustworthy AI',
    'Machine learning',
  ],
  topicWeights: {
    'LLM systems': 1.4,
    'Efficient inference': 1.3,
    'Agent systems': 1.1,
  },
  customKeywords: [],
  excludedKeywords: [],
  preferredTimeRangeDays: 365,
  focusedRatio: 0.7,
  showAiOverviews: true,
}

export function parseTopicList(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}
