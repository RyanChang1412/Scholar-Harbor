import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { ErrorState } from '../components/common/ContentStates'
import { PageContainer } from '../components/layout/PageContainer'

export function RouteErrorPage() {
  const error = useRouteError()
  const description = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'The requested route could not be rendered.'

  return (
    <PageContainer className="py-12 sm:py-16">
      <ErrorState description={description} title="Route unavailable" />
      <div className="mt-5 text-center">
        <Link
          className="text-sm font-semibold text-action hover:text-text"
          to="/"
        >
          Return home
        </Link>
      </div>
    </PageContainer>
  )
}
