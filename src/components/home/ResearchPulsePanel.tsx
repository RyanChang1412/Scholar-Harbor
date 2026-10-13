import { ArrowUpRight, Minus } from 'lucide-react'

interface ResearchPulsePanelProps {
  readonly items: readonly {
    readonly id: string
    readonly label: string
    readonly detail: string
    readonly direction: 'steady' | 'emerging'
  }[]
  readonly description?: string
  readonly eyebrow?: string
  readonly footnote?: string
}

export function ResearchPulsePanel({
  items,
  description = 'A quiet preview of contextual signals. These observations come only from the fictional Phase 01 fixtures.',
  eyebrow = 'Fixture overview',
  footnote = 'No trend, ranking, or popularity claim is made by this prototype.',
}: ResearchPulsePanelProps) {
  return (
    <section
      aria-labelledby="research-pulse-title"
      className="rounded-xl bg-surface-soft p-6"
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-action uppercase">
        {eyebrow}
      </p>
      <h2
        className="mt-2 font-editorial text-2xl font-semibold text-text"
        id="research-pulse-title"
      >
        Research Pulse
      </h2>
      <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>

      <ul className="mt-6 divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li className="flex gap-3 py-4" key={item.id}>
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface text-action">
              {item.direction === 'emerging' ? (
                <ArrowUpRight aria-hidden="true" size={15} />
              ) : (
                <Minus aria-hidden="true" size={15} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-5 text-text-muted">{footnote}</p>
    </section>
  )
}
