import { Library, Newspaper, Settings, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'

import { AppShell } from '../components/layout/AppShell'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { RouteErrorPage } from './RouteErrorPage'

interface ContentRouteElements {
  readonly home: ReactNode
  readonly papers: ReactNode
  readonly paperDetail: ReactNode
}

export function createAppRoutes({
  home,
  papers,
  paperDetail,
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
        {
          path: 'library',
          element: (
            <PlaceholderPage
              deferred="Browser-local saved papers, reading status, tags, and import/export will be implemented in the personalization phase."
              description="A private browser-local reading space, separate from public academic data."
              eyebrow="Personal reading"
              icon={Library}
              title="Library"
            />
          ),
        },
        {
          path: 'settings',
          element: (
            <PlaceholderPage
              deferred="Editable interests, keywords, exclusions, topic weights, recommendation preferences, and local schema migration are deferred."
              description="A future place to tune research interests and reading preferences."
              eyebrow="Local preferences"
              icon={Settings}
              title="Settings"
            />
          ),
        },
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
