import { createBrowserRouter } from 'react-router-dom'

import { publicPaperRepository } from '../data/papers/PublicPaperRepository'
import { PaperDetailPage } from '../pages/PaperDetailPage'
import { PapersPage } from '../pages/PapersPage'
import { LibraryPage } from '../pages/LibraryPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ProductionHomePage } from '../pages/ProductionContentPages'
import { createAppRoutes } from './router'

export const appRoutes = createAppRoutes({
  home: <ProductionHomePage />,
  papers: (
    <PapersPage defaultMode="latest" repository={publicPaperRepository} />
  ),
  paperDetail: <PaperDetailPage repository={publicPaperRepository} />,
  library: <LibraryPage repository={publicPaperRepository} />,
  settings: <SettingsPage />,
})

export const router = createBrowserRouter(appRoutes)
