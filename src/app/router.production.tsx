import { createBrowserRouter } from 'react-router-dom'

import {
  ProductionHomePage,
  ProductionPaperDetailPage,
  ProductionPapersPage,
} from '../pages/ProductionContentPages'
import { createAppRoutes } from './router'

export const appRoutes = createAppRoutes({
  home: <ProductionHomePage />,
  papers: <ProductionPapersPage />,
  paperDetail: <ProductionPaperDetailPage />,
})

export const router = createBrowserRouter(appRoutes)
