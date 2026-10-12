import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from '../components/common/ContentStates'
import { PageContainer } from '../components/layout/PageContainer'

interface AppErrorBoundaryProps {
  readonly children: ReactNode
}

interface AppErrorBoundaryState {
  readonly hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public state: AppErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Scholar Harbor render error', error, info)
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <PageContainer className="py-12 sm:py-16">
          <ErrorState
            description="The application shell encountered an unexpected rendering error. Reload the page to try again."
            title="Scholar Harbor could not render this view"
          />
        </PageContainer>
      )
    }

    return this.props.children
  }
}
