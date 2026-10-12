import { ValidatedPaperRepository } from '../data/papers/PaperRepository'
import { paperCollectionSchema } from '../domain/paper'

export const fixturePaperSnapshotAt = new Date('2026-10-12T00:00:00Z')
const checkedAt = fixturePaperSnapshotAt.toISOString()

function links(slug: string, includePdf = true, includeCode = false) {
  return [
    {
      kind: 'paper',
      url: `https://example.invalid/papers/${slug}`,
      verification: {
        status: 'fixture',
        checkedAt,
        source: 'Fixture link manifest',
      },
    },
    ...(includePdf
      ? [
          {
            kind: 'pdf',
            url: `https://example.invalid/papers/${slug}.pdf`,
            verification: {
              status: 'fixture',
              checkedAt,
              source: 'Fixture link manifest',
            },
          },
        ]
      : []),
    ...(includeCode
      ? [
          {
            kind: 'code',
            url: `https://example.invalid/code/${slug}`,
            verification: {
              status: 'fixture',
              checkedAt,
              source: 'Fixture link manifest',
            },
          },
        ]
      : []),
  ]
}

function provenance(source: string, sourceRecordId: string) {
  return [{ source, sourceRecordId, retrievedAt: checkedAt }]
}

function signals(saves: number, discussions: number, citations = 0) {
  return [
    {
      kind: 'saves',
      value: saves,
      source: 'Fixture Commons save counter',
      observedAt: checkedAt,
      fixture: true,
    },
    {
      kind: 'discussions',
      value: discussions,
      source: 'Fixture Commons discussion counter',
      observedAt: checkedAt,
      fixture: true,
    },
    {
      kind: 'citations',
      value: citations,
      source: 'Fixture citation index',
      observedAt: checkedAt,
      fixture: true,
    },
  ]
}

export const rawPaperFixtures: unknown = [
  {
    id: 'paper-memory-tides',
    arxivId: '2610.01234v2',
    doi: '10.9999/fixture.memory-tides',
    title:
      'Memory Tides: Coordinating Layered KV Cache Policies for Long-Context Language Model Serving',
    authors: ['Mira Solis', 'Theo Rowan', 'Anika Vale'],
    abstract:
      'This fictional fixture examines coordinated memory policies across attention layers. It exists only to demonstrate the reading experience and makes no scientific claim.',
    publishedAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-10-10T16:30:00Z',
    provenance: provenance('Fixture Systems Archive', 'FSA-2610-014'),
    categories: ['Computer Science', 'Distributed Systems'],
    topics: ['KV cache', 'LLM serving', 'Systems'],
    externalLinks: links('memory-tides', true, true),
    communitySignals: signals(41, 13, 5),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Focused',
      reason:
        'Fixture match: it connects cache policy design with language-model serving efficiency.',
      rank: 1,
    },
  },
  {
    id: 'paper-deliberation-budget',
    arxivId: '2610.04567',
    title:
      'A Deliberation Budget for Tool-Using Agents Under Uncertain Runtime Constraints',
    authors: ['Lina Hart', 'Soren Cai'],
    abstract:
      'This fictional fixture explores bounded reasoning allocation for tool-using agents. Its prose is interface test content and does not describe real results.',
    publishedAt: '2026-10-11T12:00:00Z',
    updatedAt: '2026-10-11T12:00:00Z',
    provenance: provenance('Fixture Agent Research Feed', 'FARF-779'),
    categories: ['Computer Science', 'Artificial Intelligence'],
    topics: ['Agent systems', 'Reasoning'],
    externalLinks: links('deliberation-budget'),
    communitySignals: signals(20, 28, 1),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Focused',
      reason:
        'Fixture match: it relates controllable reasoning to systems constraints.',
      rank: 2,
    },
  },
  {
    id: 'paper-robotic-field-notes',
    arxivId: '2609.12345v1',
    title:
      'Field Notes as World Models: Learning Compact Robotic Priors from Sparse Multimodal Observations',
    authors: ['Noor Bell', 'Emil Kato', 'Priya Aster', 'Jonas Rue'],
    abstract:
      'This fictional fixture uses sparse observations to demonstrate a cross-topic reading card, a longer author list, and an unavailable AI overview.',
    publishedAt: '2026-09-23T08:15:00Z',
    updatedAt: '2026-09-28T11:00:00Z',
    provenance: provenance('Fixture Robotics Digest', 'FRD-2044'),
    categories: ['Computer Science', 'Robotics'],
    topics: ['World models', 'Robotics', 'Multimodal'],
    externalLinks: links('robotic-field-notes', false, true),
    communitySignals: signals(55, 9, 11),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Explore',
      reason:
        'Fixture exploration: it bridges multimodal models with adjacent robotics work.',
      rank: 3,
    },
  },
  {
    id: 'paper-calibrated-retrieval',
    arxivId: '2610.07891',
    doi: '10.9999/fixture.calibrated-retrieval',
    title:
      'Calibrated Retrieval Gates for Evidence-Aware Scientific Assistants',
    authors: ['Aya Merin', 'Gabriel Flint', 'Wei Arden'],
    abstract:
      'A fictional fixture about retrieval gates, included to exercise topic filtering and citation export without asserting a real evaluation result.',
    publishedAt: '2026-10-06T15:00:00Z',
    updatedAt: '2026-10-07T09:20:00Z',
    provenance: provenance('Fixture Language Systems Index', 'FLSI-88'),
    categories: ['Computer Science', 'Information Retrieval'],
    topics: ['Retrieval', 'Evaluation', 'Agent systems'],
    externalLinks: links('calibrated-retrieval', true, true),
    communitySignals: signals(37, 17, 3),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Focused',
      reason:
        'Fixture match: it combines retrieval quality and evidence tracing.',
      rank: 4,
    },
  },
  {
    id: 'paper-quiet-benchmarks',
    arxivId: '2608.00219v3',
    title:
      'Quiet Benchmarks: Measuring Interactive Models Without Rewarding Interface Noise',
    authors: ['Ravi Linden', 'Mara Quill'],
    abstract:
      'A fictional benchmark-design record used to verify date ranges, source filters, and missing optional code metadata.',
    publishedAt: '2026-08-19T17:45:00Z',
    updatedAt: '2026-09-02T07:00:00Z',
    provenance: provenance('Fixture Evaluation Ledger', 'FEL-320'),
    categories: ['Computer Science', 'Human-Computer Interaction'],
    topics: ['Evaluation', 'Human factors'],
    externalLinks: links('quiet-benchmarks'),
    communitySignals: signals(18, 6, 16),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Focused',
      reason:
        'Fixture match: it supports careful evaluation of interactive systems.',
      rank: 5,
    },
  },
  {
    id: 'paper-sparse-orchards',
    arxivId: '2512.11990',
    title:
      'Sparse Orchards: Structured Pruning Schedules for Small On-Device Vision Models',
    authors: ['Celeste Omondi', 'Hugo Neri', 'Min Seo'],
    abstract:
      'A fictional older fixture used to exercise one-year filtering, chronological ordering, and adjacent model-efficiency discovery.',
    publishedAt: '2025-12-04T06:00:00Z',
    updatedAt: '2025-12-04T06:00:00Z',
    provenance: provenance('Fixture Edge Computing Review', 'FECR-47'),
    categories: ['Computer Science', 'Computer Vision'],
    topics: ['Model compression', 'Computer vision'],
    externalLinks: links('sparse-orchards', true, true),
    communitySignals: signals(62, 4, 23),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Explore',
      reason:
        'Fixture exploration: it connects systems efficiency with on-device vision.',
      rank: 6,
    },
  },
  {
    id: 'paper-semantic-tides',
    arxivId: '2604.30421',
    title: 'Semantic Tides in Versioned Scientific Knowledge Graphs',
    authors: ['Nadine Okafor', 'Ivo Chen'],
    abstract:
      'A fictional knowledge-graph fixture for demonstrating source attribution, dense browsing, and a paper record without a PDF or code link.',
    publishedAt: '2026-04-20T14:10:00Z',
    updatedAt: '2026-04-25T10:00:00Z',
    provenance: provenance('Fixture Data Practice Archive', 'FDPA-501'),
    categories: ['Computer Science', 'Digital Libraries'],
    topics: ['Knowledge graphs', 'Provenance'],
    externalLinks: links('semantic-tides', false, false),
    communitySignals: signals(14, 19, 8),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Focused',
      reason:
        'Fixture match: it emphasizes versioning and provenance in research data.',
      rank: 7,
    },
  },
  {
    id: 'paper-inference-courtyards',
    arxivId: '2609.08080',
    title: 'Inference Courtyards: Fair Queuing for Mixed-Latency Model Serving',
    authors: ['Samira Holt', 'Kenji Moss', 'Pavel Noor'],
    abstract:
      'A fictional serving-systems record used to exercise pagination and source filtering without claiming a real scheduling result.',
    publishedAt: '2026-09-14T10:30:00Z',
    updatedAt: '2026-09-16T08:00:00Z',
    provenance: provenance('Fixture Systems Archive', 'FSA-2609-201'),
    categories: ['Computer Science', 'Distributed Systems'],
    topics: ['LLM serving', 'Scheduling', 'Systems'],
    externalLinks: links('inference-courtyards', true, true),
    communitySignals: signals(34, 12, 4),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Focused',
      reason:
        'Fixture match: it connects scheduling policy with model-serving latency.',
      rank: 8,
    },
  },
  {
    id: 'paper-oceanic-latents',
    arxivId: '2607.15001v2',
    title: 'Oceanic Latents for Seasonal Earth Observation Sequences',
    authors: ['Tala Ivers', 'Owen Zhu', 'Marisol Adeyemi'],
    abstract:
      'A fictional earth-observation fixture included as a clearly adjacent exploratory topic with no generated scientific claims.',
    publishedAt: '2026-07-28T13:00:00Z',
    updatedAt: '2026-08-03T11:40:00Z',
    provenance: provenance('Fixture Science Models Bulletin', 'FSMB-71'),
    categories: ['Computer Science', 'Machine Learning'],
    topics: ['AI for science', 'Multimodal', 'World models'],
    externalLinks: links('oceanic-latents'),
    communitySignals: signals(25, 14, 9),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Explore',
      reason:
        'Fixture exploration: it introduces an adjacent AI-for-science application.',
      rank: 9,
    },
  },
  {
    id: 'paper-long-horizon-dialogue',
    arxivId: '2610.10101v1',
    title:
      'Long-Horizon Dialogue State Reconstruction Across Intermittent Sessions, Constrained Devices, and Delayed Tool Responses: A Deliberately Extended Fictional Title for Layout Validation',
    authors: [
      'Alexandria Marisol Peregrine',
      'Bartholomew Kofi West-Sommer',
      'Chen-Ling Ada Fernández',
      'Divya Noor al-Karim',
      'Elena Petrov-Matsumoto',
      'Farid Okoye-Santos',
    ],
    abstract:
      'This deliberately long fictional record tests wrapping and responsive reading widths. It contains no real research claim and no AI-generated summary.',
    publishedAt: '2026-10-09T23:55:00Z',
    updatedAt: '2026-10-09T23:55:00Z',
    provenance: provenance('Fixture Interaction Archive', 'FIA-999'),
    categories: ['Computer Science', 'Human-Computer Interaction'],
    topics: ['Agent systems', 'Human factors', 'Long context'],
    externalLinks: links('long-horizon-dialogue'),
    communitySignals: signals(9, 8, 0),
    aiEnrichment: { status: 'unavailable' },
    recommendation: {
      lane: 'Focused',
      reason:
        'Fixture match: it tests long-context interaction and unusually long metadata.',
      rank: 10,
    },
  },
]

export const paperFixtures = paperCollectionSchema.parse(rawPaperFixtures)
export const fixturePaperRepository = new ValidatedPaperRepository(
  async () => rawPaperFixtures,
)
export const fixturePaperSnapshotLabel =
  'Fixture paper snapshot · validated 12 Oct 2026 · not live data'
