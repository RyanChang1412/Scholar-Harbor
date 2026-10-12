import { AlertCircle, FileQuestion, LoaderCircle } from 'lucide-react'

interface StateProps {
  readonly title: string
  readonly description: string
}

function StateFrame({
  icon,
  title,
  description,
}: StateProps & { readonly icon: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
      <div className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-surface-soft text-action">
        {icon}
      </div>
      <h2 className="font-editorial text-xl font-semibold text-text">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">
        {description}
      </p>
    </section>
  )
}

export function EmptyState({ title, description }: StateProps) {
  return (
    <StateFrame
      description={description}
      icon={<FileQuestion aria-hidden="true" size={19} />}
      title={title}
    />
  )
}

export function LoadingState({
  title = 'Preparing this view',
  description = 'The requested content is being prepared.',
}: Partial<StateProps>) {
  return (
    <StateFrame
      description={description}
      icon={
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none"
          size={19}
        />
      }
      title={title}
    />
  )
}

export function ErrorState({ title, description }: StateProps) {
  return (
    <StateFrame
      description={description}
      icon={<AlertCircle aria-hidden="true" size={19} />}
      title={title}
    />
  )
}
