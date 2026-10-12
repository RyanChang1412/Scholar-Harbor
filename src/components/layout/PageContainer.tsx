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
      className={cn(
        'mx-auto w-full max-w-[1160px] px-5 sm:px-7 lg:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
