import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageContainer } from './PageContainer'
import { SiteNavigation } from './SiteNavigation'

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="border-b border-border bg-canvas/95 backdrop-blur-sm">
      <PageContainer className="flex min-h-16 items-center justify-between gap-4">
        <Link
          aria-label="Scholar Harbor home"
          className="group flex min-w-0 items-center gap-3 rounded-sm"
          to="/"
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-primary bg-surface font-editorial text-lg font-semibold text-action"
          >
            S
          </span>
          <span className="truncate font-editorial text-xl font-semibold tracking-[-0.01em] text-text group-hover:text-action">
            Scholar Harbor
          </span>
        </Link>

        <SiteNavigation className="hidden md:block" />

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={
            isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
          }
          className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-text hover:border-primary hover:text-action md:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          {isMenuOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </button>
      </PageContainer>

      {isMenuOpen ? (
        <div
          className="border-t border-border bg-surface md:hidden"
          id="mobile-navigation"
        >
          <PageContainer className="py-3">
            <SiteNavigation mobile onNavigate={() => setIsMenuOpen(false)} />
          </PageContainer>
        </div>
      ) : null}
    </header>
  )
}
