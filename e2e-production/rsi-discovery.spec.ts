import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const paperDataset = JSON.parse(
  readFileSync(
    new URL('../public/data/papers.v1.json', import.meta.url),
    'utf8',
  ),
) as { papers: { id: string; title: string }[] }

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'wide', width: 2560, height: 1440 },
] as const) {
  test(`production RSI discovery is readable at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/papers?mode=for-you')

    await expect(
      page.getByRole('heading', { name: 'Papers', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('7 Focused · 3 Explore')).toBeVisible()
    await expect(
      page.getByText(/Directly studies|Supports|Explores/).first(),
    ).toBeVisible()
    await expect(page.getByText('Fictional fixture')).toHaveCount(0)

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth,
    )

    await page.screenshot({
      fullPage: true,
      path: `artifacts/rsi-discovery/papers-${viewport.name}.png`,
    })
  })
}

test('production detail refresh and source links remain stable', async ({
  page,
}) => {
  const paper = paperDataset.papers[0]!
  await page.goto(`/papers/${paper.id}`)
  await expect(page.getByRole('heading', { name: paper.title })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: paper.title })).toBeVisible()
  await expect(page.getByText('Source-backed record')).toBeVisible()
  const paperLink = page.getByRole('link', { name: /Paper page/ })
  await expect(paperLink).toHaveAttribute('target', '_blank')
  await expect(paperLink).toHaveAttribute('rel', 'noopener noreferrer')
})

test('edited focused topics create weight controls and affect the local profile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/settings')
  await page
    .getByLabel('Focused topics')
    .fill('Recursive Self-Improvement, Custom Lab Topic')
  await expect(page.getByLabel('Custom Lab Topic weight')).toHaveValue('1')
  await page.getByLabel('Recursive Self-Improvement weight').fill('1.9')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Research profile saved locally.')).toBeVisible()
  await page.reload()
  await expect(
    page.getByLabel('Recursive Self-Improvement weight'),
  ).toHaveValue('1.9')
})
