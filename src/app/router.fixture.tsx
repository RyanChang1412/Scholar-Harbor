import { createBrowserRouter } from 'react-router-dom'

import { HomePage } from '../pages/HomePage'
import { PaperDetailPage } from '../pages/PaperDetailPage'
import { PapersPage } from '../pages/PapersPage'
import { createAppRoutes } from './router'

export const appRoutes = createAppRoutes({
  home: <HomePage />,
  papers: <PapersPage />,
  paperDetail: <PaperDetailPage />,
})

export const router = createBrowserRouter(appRoutes)
