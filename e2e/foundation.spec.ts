import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'wide', width: 1440, height: 1000 },
] as const

for (const viewport of viewports) {
  test(`homepage is readable at ${viewport.width}px`, async ({ page }) => {
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

    if (viewport.name === 'mobile' || viewport.name === 'wide') {
      await page.screenshot({
        fullPage: true,
        path: `artifacts/phase-01/home-${viewport.width}.png`,
      })
    }
  })
}

test('all required routes render in the browser', async ({ page }) => {
  const routes = [
    ['/', 'Focused on your research, open to new ideas.'],
    ['/papers', 'Papers'],
    ['/papers/fixture-memory-tides', /Memory Tides:/],
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

test('keyboard focus and mobile navigation are usable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

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
