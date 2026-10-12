import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface PageContainerProps<T extends ElementType = 'div'> {
  readonly as?: T
  readonly children: ReactNode
  readonly className?: string
}

export function PageContainer<T extends ElementType = 'div'>({
  as,
  children,
  className,
  ...props
}: PageContainerProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof PageContainerProps<T>>) {
  const Component = as ?? 'div'

  return (
    <Component
      data-page-container=""
      className={cn(
        'page-container mx-auto w-full max-w-[clamp(72.5rem,86vw,137.5rem)] px-5 sm:px-7 lg:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
