import { NavLink } from 'react-router-dom'

import { cn } from '../../lib/cn'

const navigationItems = [
  { label: 'Home', to: '/' },
  { label: 'Papers', to: '/papers' },
  { label: 'News', to: '/news' },
  { label: 'Rankings', to: '/rankings' },
  { label: 'Library', to: '/library' },
  { label: 'Settings', to: '/settings' },
] as const

interface SiteNavigationProps {
  readonly className?: string
  readonly mobile?: boolean
  readonly onNavigate?: () => void
}

export function SiteNavigation({
  className,
  mobile = false,
  onNavigate,
}: SiteNavigationProps) {
  return (
    <nav aria-label="Primary navigation" className={className}>
      <ul
        className={cn(
          'flex items-center gap-1',
          mobile && 'flex-col items-stretch',
        )}
      >
        {navigationItems.map((item) => (
          <li key={item.to}>
            <NavLink
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-soft hover:text-text',
                  'focus-visible:outline-offset-1',
                  mobile && 'px-4 py-3 text-base',
                  isActive && 'bg-surface-soft text-action',
                )
              }
              end={item.to === '/'}
              onClick={onNavigate}
              to={item.to}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
