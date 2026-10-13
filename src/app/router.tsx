import { Newspaper, Trophy } from 'lucide-react'
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
}

export function createAppRoutes({
  home,
  papers,
  paperDetail,
  library,
  settings,
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
        {
          path: 'news',
          element: (
            <PlaceholderPage
              deferred="Live feeds, source adapters, category filters, and deduplication belong to a later data phase. No live news is published yet."
              description="A future attributed view of selected academic and research-engineering sources."
              eyebrow="Research context"
              icon={Newspaper}
              title="News"
            />
          ),
        },
        {
          path: 'rankings',
          element: (
            <PlaceholderPage
              deferred="No positions, model scores, or benchmark claims are shown until authoritative structured sources have been reviewed."
              description="A future home for source-backed summaries and clearly labeled official links."
              eyebrow="Authoritative references"
              icon={Trophy}
              title="Rankings"
            />
          ),
        },
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
