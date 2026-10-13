import { useEffect, useState } from 'react'

import { getPersonalPaperStateRepository } from '../data/personal/PersonalPaperStateRepository'

export function usePersonalData() {
  const repository = getPersonalPaperStateRepository()
  const [revision, setRevision] = useState(0)

  useEffect(
    () => repository.subscribe(() => setRevision((value) => value + 1)),
    [repository],
  )

  return {
    repository,
    profile: repository.getProfile(),
    paperStates: repository.list(),
    revision,
  }
}
