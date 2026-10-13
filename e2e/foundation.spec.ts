import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'wide', width: 1440, height: 1000 },
  { name: 'qhd', width: 2560, height: 1440 },
  { name: 'qhd-tall', width: 2560, height: 1600 },
] as const

for (const viewport of viewports) {
  test(`homepage is readable at ${viewport.width}×${viewport.height}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        name: 'Focused on your research, open to new ideas.',
      }),
    ).toBeVisible()
    await expect(
      page.getByText('Fixture snapshot · not live academic data'),
    ).toBeVisible()

    const pageDimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }))
    expect(pageDimensions.documentWidth).toBeLessThanOrEqual(
      pageDimensions.viewportWidth,
    )

    const paperTitle = page
      .getByRole('link', {
        name: /Memory Tides: Coordinating Layered KV Cache Policies/,
      })
      .first()
    await expect(paperTitle).toBeVisible()
    const titleBox = await paperTitle.boundingBox()
    expect(titleBox).not.toBeNull()
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(viewport.width)

    if (viewport.width >= 2560) {
      const wideContainer = page.locator('[data-page-container]').nth(1)
      const containerBox = await wideContainer.boundingBox()
      expect(containerBox).not.toBeNull()
      expect(containerBox!.width).toBeGreaterThanOrEqual(2150)

      const compactGridColumns = await page
        .locator('[data-home-compact-grid]')
        .evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(' ').length,
        )
      expect(compactGridColumns).toBe(2)
    }

    if (
      viewport.name === 'mobile' ||
      viewport.name === 'wide' ||
      viewport.name === 'qhd'
    ) {
      const screenshotName =
        viewport.name === 'mobile'
          ? 'home-375.png'
          : viewport.name === 'wide'
            ? 'home-1440.png'
            : 'home-2560x1440.png'
      await page.screenshot({
        fullPage: true,
        path: `artifacts/phase-02/${screenshotName}`,
      })
    }
  })
}

test('all required routes render in the browser', async ({ page }) => {
  const routes = [
    ['/', 'Focused on your research, open to new ideas.'],
    ['/papers', 'Papers'],
    ['/papers/paper-memory-tides', /Memory Tides:/],
    ['/news', 'News'],
    ['/rankings', 'Rankings'],
    ['/library', 'Library'],
    ['/settings', 'Settings'],
  ] as const

  for (const [path, heading] of routes) {
    await page.goto(path)
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible()
  }
})

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'wide', width: 2560, height: 1440 },
] as const) {
  test(`paper discovery is readable at ${viewport.width}×${viewport.height}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/papers?mode=latest')
    await expect(
      page.getByRole('heading', { name: '10 paper results' }),
    ).toBeVisible()
    await expect(
      page
        .getByRole('link', {
          name: /A Deliberation Budget for Tool-Using Agents/,
        })
        .first(),
    ).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth,
    )
    await page.screenshot({
      fullPage: true,
      path: `artifacts/phase-02/papers-${viewport.width}.png`,
    })
  })
}

test('paper modes use their declared ordering', async ({ page }) => {
  await page.goto('/papers?mode=latest')
  await expect(
    page
      .getByRole('link', {
        name: /A Deliberation Budget for Tool-Using Agents/,
      })
      .first(),
  ).toBeVisible()

  await page.getByRole('link', { name: /Trending Ordered/ }).click()
  await expect(page.getByText(/Fixture signal score 217/)).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Sparse Orchards:/ }).first(),
  ).toBeVisible()
})

test('filters survive detail navigation and browser history', async ({
  page,
}) => {
  await page.goto('/papers?mode=latest&q=budget')
  const resultLink = page.getByRole('link', {
    name: 'A Deliberation Budget for Tool-Using Agents Under Uncertain Runtime Constraints',
    exact: true,
  })
  await expect(resultLink).toBeVisible()
  await resultLink.click()
  await expect(
    page.getByRole('heading', { name: /A Deliberation Budget/ }),
  ).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/mode=latest&q=budget/)
  await expect(page.getByRole('searchbox')).toHaveValue('budget')
  await page.goForward()
  await expect(
    page.getByRole('heading', { name: /A Deliberation Budget/ }),
  ).toBeVisible()
})

test('paper detail handles long content and safe external links', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/papers/paper-long-horizon-dialogue')
  await expect(
    page.getByRole('heading', { name: /Long-Horizon Dialogue/ }),
  ).toBeVisible()
  const paperLink = page.getByRole('link', { name: /Paper page fixture/ })
  await expect(paperLink).toHaveAttribute('target', '_blank')
  await expect(paperLink).toHaveAttribute('rel', 'noopener noreferrer')
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
  await page.screenshot({
    fullPage: true,
    path: 'artifacts/phase-02/detail-1440.png',
  })
})

test('bookmark state persists locally across refresh', async ({ page }) => {
  await page.goto('/papers/paper-memory-tides')
  const saveButton = page.getByRole('button', { name: 'Save to library' })
  await expect(saveButton).toBeVisible()
  await saveButton.click()
  await expect(
    page.getByRole('button', { name: 'Remove from library' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Remove from library' }),
  ).toBeVisible()

  await page.goto('/library')
  await expect(
    page.getByRole('link', { name: /Memory Tides:/ }).first(),
  ).toBeVisible()
  await page.getByLabel('Reading status').selectOption('want-to-read')
  await page.getByLabel('Personal tags').fill('systems, revisit')
  await page.getByLabel('Personal tags').blur()
  await page.reload()
  await expect(page.getByLabel('Reading status')).toHaveValue('want-to-read')
  await expect(page.getByLabel('Personal tags')).toHaveValue('systems, revisit')
})

test('profile settings drive local balanced discovery without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/settings')
  await page.getByLabel('Focused topics').fill('Agent systems, LLM serving')
  await page.getByLabel('Exploratory topics').fill('Robotics, Multimodal')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Research profile saved locally.')).toBeVisible()
  await page.screenshot({
    fullPage: true,
    path: 'artifacts/phase-04/fixture-settings-375.png',
  })

  await page.setViewportSize({ width: 2560, height: 1440 })
  await page.goto('/papers?mode=for-you')
  await expect(page.getByText(/Focused ·/)).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
  await page.screenshot({
    fullPage: true,
    path: 'artifacts/phase-04/fixture-papers-2560.png',
  })
})

test('keyboard focus and mobile navigation are usable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Focused on your research, open to new ideas.',
    }),
  ).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()

  const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
  await menuButton.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('button', { name: 'Close navigation menu' }),
  ).toBeVisible()

  const mobileNavigation = page.locator('#mobile-navigation')
  await mobileNavigation.getByRole('link', { name: 'Library' }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Library', exact: true }),
  ).toBeVisible()
})
