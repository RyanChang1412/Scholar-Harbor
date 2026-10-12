import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { AppErrorBoundary } from './app/AppErrorBoundary'
import './styles/global.css'

const { router } = import.meta.env.DEV
  ? await import('./app/router.fixture')
  : await import('./app/router.production')

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Missing #root application mount point')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <RouterProvider router={router} />
    </AppErrorBoundary>
  </StrictMode>,
)
