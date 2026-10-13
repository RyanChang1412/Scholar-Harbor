import { createBrowserRouter } from 'react-router-dom'

import { HomePage } from '../pages/HomePage'
import { PaperDetailPage } from '../pages/PaperDetailPage'
import { PapersPage } from '../pages/PapersPage'
import { LibraryPage } from '../pages/LibraryPage'
import { SettingsPage } from '../pages/SettingsPage'
import {
  fixturePaperRepository,
  fixturePaperSnapshotAt,
  fixturePaperSnapshotLabel,
} from '../fixtures/papers'
import { createAppRoutes } from './router'

export const appRoutes = createAppRoutes({
  home: <HomePage />,
  papers: (
    <PapersPage
      datasetDescription="Search and compare validated fictional paper records through a replaceable data-access boundary."
      recordLabel="Fictional fixture"
      repository={fixturePaperRepository}
      signalLabel="Fixture"
      signalNotice="Popularity values are development-only mock signals."
      snapshotAt={fixturePaperSnapshotAt}
      snapshotLabel={fixturePaperSnapshotLabel}
    />
  ),
  paperDetail: (
    <PaperDetailPage
      destinationNotice="Fixture destinations use the reserved non-resolving example.invalid domain."
      recordLabel="Fictional fixture"
      repository={fixturePaperRepository}
      snapshotLabel={fixturePaperSnapshotLabel}
    />
  ),
  library: <LibraryPage repository={fixturePaperRepository} />,
  settings: <SettingsPage />,
})

export const router = createBrowserRouter(appRoutes)
