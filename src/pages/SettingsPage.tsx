import { Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { SectionHeader } from '../components/common/SectionHeader'
import { PageContainer } from '../components/layout/PageContainer'
import {
  parseTopicList,
  researchProfileSchema,
} from '../domain/research-profile'
import { usePersonalData } from '../hooks/usePersonalData'

type Notice =
  { readonly kind: 'success' | 'error'; readonly message: string } | undefined

export function SettingsPage() {
  const { profile, repository } = usePersonalData()
  const [notice, setNotice] = useState<Notice>()
  const [resetArmed, setResetArmed] = useState(false)
  const [focusedShare, setFocusedShare] = useState(
    Math.round(profile.focusedRatio * 100),
  )
  const [focusedTopicsText, setFocusedTopicsText] = useState(
    profile.focusedTopics.join(', '),
  )
  const [topicWeights, setTopicWeights] = useState(profile.topicWeights)
  const fileInput = useRef<HTMLInputElement>(null)
  const focusedTopicsDraft = parseTopicList(focusedTopicsText)

  function loadProfileIntoEditor(next: typeof profile) {
    setFocusedTopicsText(next.focusedTopics.join(', '))
    setTopicWeights(next.topicWeights)
    setFocusedShare(Math.round(next.focusedRatio * 100))
  }

  function saveProfile(form: HTMLFormElement) {
    const data = new FormData(form)
    const focusedTopics = parseTopicList(focusedTopicsText)
    const savedTopicWeights = Object.fromEntries(
      focusedTopics.map((topic) => [topic, topicWeights[topic] ?? 1]),
    )
    const result = researchProfileSchema.safeParse({
      focusedTopics,
      exploratoryTopics: parseTopicList(
        String(data.get('exploratoryTopics') ?? ''),
      ),
      topicWeights: savedTopicWeights,
      customKeywords: parseTopicList(String(data.get('customKeywords') ?? '')),
      excludedKeywords: parseTopicList(
        String(data.get('excludedKeywords') ?? ''),
      ),
      preferredTimeRangeDays: Number(data.get('preferredTimeRangeDays')),
      focusedRatio: Number(data.get('focusedRatio')) / 100,
      showAiOverviews: data.get('showAiOverviews') === 'on',
    })
    if (!result.success) {
      setNotice({
        kind: 'error',
        message: 'Review the profile values and try again.',
      })
      return
    }
    repository.setProfile(result.data)
    setNotice({ kind: 'success', message: 'Research profile saved locally.' })
  }

  function exportData() {
    const blob = new Blob([repository.exportJson()], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'scholar-harbor-local-data.v3.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice({ kind: 'success', message: 'Local data export created.' })
  }

  async function importData(file: File | undefined) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setNotice({
        kind: 'error',
        message: 'Import rejected: the local data file exceeds 5 MB.',
      })
      if (fileInput.current) fileInput.current.value = ''
      return
    }
    try {
      const imported = repository.importJson(await file.text())
      loadProfileIntoEditor(imported.profile)
      setNotice({ kind: 'success', message: 'Validated local data imported.' })
    } catch {
      setNotice({
        kind: 'error',
        message:
          'Import rejected: expected a valid Scholar Harbor v3 JSON export.',
      })
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <PageContainer className="py-12 sm:py-16">
      <SectionHeader
        as="h1"
        description="Tune local discovery without sending your profile or reading history to a server."
        eyebrow="Private preferences"
        title="Settings"
      />
      <form
        className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]"
        onSubmit={(event) => {
          event.preventDefault()
          saveProfile(event.currentTarget)
        }}
      >
        <section
          className="rounded-xl border border-border bg-surface p-6 shadow-card"
          aria-labelledby="profile-title"
        >
          <h2
            id="profile-title"
            className="font-editorial text-2xl font-semibold text-text"
          >
            Research profile
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Use comma-separated topics and keywords. Recommendation reasons only
            reference detected source text and topics.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-text">
              Focused topics
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border border-border bg-surface p-3 font-normal leading-6"
                name="focusedTopics"
                value={focusedTopicsText}
                onChange={(event) => setFocusedTopicsText(event.target.value)}
              />
            </label>
            <TextSetting
              name="exploratoryTopics"
              label="Exploratory topics"
              defaultValue={profile.exploratoryTopics.join(', ')}
            />
            <TextSetting
              name="customKeywords"
              label="Custom keywords"
              defaultValue={profile.customKeywords.join(', ')}
            />
            <TextSetting
              name="excludedKeywords"
              label="Excluded keywords"
              defaultValue={profile.excludedKeywords.join(', ')}
            />
            <label className="text-sm font-semibold text-text">
              Preferred time range
              <select
                name="preferredTimeRangeDays"
                defaultValue={profile.preferredTimeRangeDays}
                className="mt-2 min-h-11 w-full rounded-md border border-border bg-surface px-3 font-normal"
              >
                <option value="30">Past 30 days</option>
                <option value="90">Past 90 days</option>
                <option value="365">Past year</option>
                <option value="1095">Past 3 years</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-text">
              Focused share: <output>{focusedShare}%</output>
              <input
                name="focusedRatio"
                type="range"
                min="0"
                max="100"
                step="10"
                value={focusedShare}
                onChange={(event) =>
                  setFocusedShare(Number(event.target.value))
                }
                className="mt-4 w-full accent-primary"
              />
            </label>
          </div>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-text">
              Focused topic weights
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {focusedTopicsDraft.map((topic) => (
                <label
                  key={topic}
                  className="flex items-center justify-between gap-3 text-sm text-text-muted"
                >
                  {topic}
                  <input
                    aria-label={`${topic} weight`}
                    className="w-20 rounded-md border border-border bg-surface px-2 py-1"
                    name={`weight:${topic}`}
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={topicWeights[topic] ?? 1}
                    onChange={(event) =>
                      setTopicWeights((current) => ({
                        ...current,
                        [topic]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-6 flex items-center gap-3 text-sm text-text-muted">
            <input
              name="showAiOverviews"
              type="checkbox"
              defaultChecked={profile.showAiOverviews}
              className="size-4 accent-primary"
            />
            Show available, clearly labeled AI overviews
          </label>
          <button
            className="mt-7 min-h-11 rounded-md bg-action px-5 text-sm font-semibold text-surface hover:bg-text"
            type="submit"
          >
            Save profile
          </button>
        </section>

        <aside className="self-start rounded-xl border border-border bg-surface p-6 shadow-card">
          <h2 className="font-editorial text-xl font-semibold text-text">
            Local data
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Exports include your research profile, saved states, reading
            progress, tags, and source-backed metadata snapshots for saved
            papers. They contain no API keys or private documents.
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={exportData}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-action hover:bg-surface-soft"
            >
              <Download size={16} aria-hidden="true" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-action hover:bg-surface-soft"
            >
              <Upload size={16} aria-hidden="true" />
              Import JSON
            </button>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void importData(event.target.files?.[0])}
            />
            {resetArmed ? (
              <div
                className="rounded-md border border-warm bg-canvas p-3"
                role="alert"
              >
                <p className="text-sm leading-6 text-text">
                  Delete this browser&apos;s profile, bookmarks, reading
                  progress, tags, and saved snapshots?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="min-h-10 rounded-md border border-border text-sm font-semibold text-action hover:bg-surface-soft"
                    onClick={() => setResetArmed(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="min-h-10 rounded-md bg-action text-sm font-semibold text-surface hover:bg-text"
                    onClick={() => {
                      repository.reset()
                      loadProfileIntoEditor(repository.getProfile())
                      setResetArmed(false)
                      setNotice({
                        kind: 'success',
                        message: 'Local data reset to public defaults.',
                      })
                    }}
                    type="button"
                  >
                    Confirm reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResetArmed(true)}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-action hover:bg-surface-soft"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Reset local data
              </button>
            )}
          </div>
          {notice && (
            <p
              role="status"
              className={`mt-4 text-sm ${notice.kind === 'error' ? 'font-semibold text-text' : 'text-action'}`}
            >
              {notice.message}
            </p>
          )}
        </aside>
      </form>
    </PageContainer>
  )
}

function TextSetting({
  name,
  label,
  defaultValue,
}: {
  readonly name: string
  readonly label: string
  readonly defaultValue: string
}) {
  return (
    <label className="text-sm font-semibold text-text">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full rounded-md border border-border bg-surface p-3 font-normal leading-6"
        name={name}
        defaultValue={defaultValue}
      />
    </label>
  )
}
