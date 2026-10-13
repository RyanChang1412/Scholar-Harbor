import { Outlet } from 'react-router-dom'

import { PageContainer } from './PageContainer'
import { SiteHeader } from './SiteHeader'

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="fixed left-4 top-3 z-50 -translate-y-24 rounded-md bg-action px-4 py-2 text-sm font-semibold text-surface transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main className="min-w-0 flex-1" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="mt-20 border-t border-border py-8">
        <PageContainer className="flex flex-col gap-2 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Scholar Harbor · Production research observatory</p>
          <p>
            Production uses validated data; development uses labeled fixtures.
          </p>
        </PageContainer>
      </footer>
    </div>
  )
}
