import { Newspaper } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'

import { AppShell } from '../components/layout/AppShell'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { RouteErrorPage } from './RouteErrorPage'

interface ContentRouteElements {
  readonly home: ReactNode
  readonly papers: ReactNode
  readonly paperDetail: ReactNode
  readonly library: ReactNode
  readonly settings: ReactNode
  readonly news: ReactNode
  readonly rankings: ReactNode
}

export function createAppRoutes({
  home,
  papers,
  paperDetail,
  library,
  settings,
  news,
  rankings,
}: ContentRouteElements): RouteObject[] {
  return [
    {
      path: '/',
      element: <AppShell />,
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: home },
        { path: 'papers', element: papers },
        { path: 'papers/:paperId', element: paperDetail },
        { path: 'news', element: news },
        { path: 'rankings', element: rankings },
        { path: 'library', element: library },
        { path: 'settings', element: settings },
        {
          path: '*',
          element: (
            <PlaceholderPage
              deferred="Use the primary navigation to return to an available Phase 01 route."
              description="This location is outside the current Scholar Harbor route map."
              eyebrow="Not found"
              icon={Newspaper}
              title="Page not found"
            />
          ),
        },
      ],
    },
  ]
}
