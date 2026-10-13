import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const buildDirectory = fileURLToPath(new URL('../dist/', import.meta.url))
const readableExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.txt',
])

const forbiddenFixtureMarkers = [
  'fixture-memory-tides',
  'paper-memory-tides',
  'Mira Solis',
  'Fictional systems archive',
  'Fixture Systems Archive',
  'Fixture Agent Research Feed',
  'Memory Tides: Coordinating Layered',
  'Fixture snapshot',
  'Fixture paper snapshot',
  'Fictional fixture',
]

const forbiddenSensitivePatterns = [
  { label: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/u },
  { label: 'Google API key', pattern: /AIza[0-9A-Za-z_-]{30,}/u },
  { label: 'GitHub token', pattern: /gh[pousr]_[0-9A-Za-z]{30,}/u },
  { label: 'private key', pattern: /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/u },
  {
    label: 'OpenAI-style key',
    pattern: /\bsk-[0-9A-Za-z_-]{20,}\b/u,
  },
  {
    label: 'email address or personal identifier',
    pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/u,
  },
]

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)))
    } else if (readableExtensions.has(extname(entry.name))) {
      files.push(path)
    }
  }

  return files
}

const files = await collectFiles(buildDirectory)

if (!files.some((file) => file.endsWith('index.html'))) {
  throw new Error(
    'Production build verification failed: dist/index.html is missing.',
  )
}

for (const file of files) {
  const contents = await readFile(file, 'utf8')

  for (const marker of forbiddenFixtureMarkers) {
    if (contents.includes(marker)) {
      throw new Error(
        `Production build verification failed: development fixture marker "${marker}" found in ${file}.`,
      )
    }
  }

  for (const { label, pattern } of forbiddenSensitivePatterns) {
    if (pattern.test(contents)) {
      throw new Error(
        `Production build verification failed: possible ${label} found in ${file}.`,
      )
    }
  }
}

console.log(
  `Production build verification passed (${files.length} text assets scanned).`,
)
