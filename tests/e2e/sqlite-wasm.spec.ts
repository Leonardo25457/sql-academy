import { expect, test, type Page } from './fixtures'

const runtimeStatus = (page: Page) => page.getByTestId('runtime-status')

async function executeSql(page: Page, sql: string): Promise<void> {
  await page.getByTestId('sql-input').fill(sql)
  await page.getByTestId('execute').click()
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'ready')
}

test('SQLite WASM spike lifecycle', async ({ page }) => {
  await page.goto('/spikes/sqlite-wasm')

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  )
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  })

  await expect(page.getByTestId('metadata-engine')).toHaveText('SQLite WASM')
  await expect(page.getByTestId('metadata-package')).toHaveText('3.53.0-build1')
  await expect(page.getByTestId('metadata-sqlite')).toHaveText('3.53.0')
  await expect(page.getByTestId('metadata-api')).toHaveText('oo1')
  await expect(page.getByTestId('metadata-worker')).toHaveText('Dedicated Module Worker')
  await expect(page.getByTestId('metadata-database')).toHaveText(':memory:')
  await expect(page.getByTestId('metadata-dataset')).toHaveText('10 filas')

  const wasmUrl = (await page.getByTestId('metadata-wasm-url').textContent())?.trim()
  expect(wasmUrl).toBeTruthy()
  const wasmResponse = await page.request.get(new URL(wasmUrl!, page.url()).href)
  expect(wasmResponse.ok()).toBe(true)
  expect(wasmResponse.headers()['content-type']).toMatch(/^application\/wasm(?:;|$)/)

  await executeSql(page, 'SELECT * FROM games;')
  await expect(page.getByTestId('result-row-count')).toHaveText('10')
  await expect(page.getByTestId('result-row')).toHaveCount(10)

  await executeSql(
    page,
    `SELECT title, rating
FROM games
WHERE rating >= 9;`,
  )
  await expect(page.getByTestId('result-row-count')).toHaveText('8')
  await expect(page.getByTestId('result-row')).toHaveCount(8)

  await executeSql(
    page,
    `SELECT genre, COUNT(*)
FROM games
GROUP BY genre;`,
  )
  await expect(page.getByTestId('result-row-count')).toHaveText('9')
  await expect(
    page.getByTestId('result-row').filter({ hasText: 'Platformer' }),
  ).toContainText('2')

  await page.getByTestId('sql-input').fill('SELECT missing_column FROM games;')
  await page.getByTestId('execute').click()
  await expect(page.getByTestId('runtime-error')).toContainText('missing_column')
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'ready')

  await executeSql(
    page,
    `INSERT INTO games (id, title, genre, release_year, rating)
VALUES (11, 'Temporary Game', 'Test', 2026, 7.5);`,
  )
  await expect(page.getByTestId('result-change-count')).toHaveText('1')

  await executeSql(page, 'SELECT COUNT(*) FROM games;')
  await expect(page.getByTestId('result-row')).toHaveText('11')

  await page.getByTestId('reset').click()
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'ready')
  await executeSql(page, 'SELECT COUNT(*) FROM games;')
  await expect(page.getByTestId('result-row')).toHaveText('10')

  const heartbeatBefore = Number(await page.getByTestId('heartbeat').textContent())
  await page.getByTestId('stress').click()
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'executing')
  await expect.poll(
    async () => Number(await page.getByTestId('heartbeat').textContent()),
    { timeout: 3_000 },
  ).toBeGreaterThan(heartbeatBefore)

  await page.getByTestId('cancel').click()
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'cancelled')
  await expect(page.getByTestId('runtime-error')).toContainText('cancelada')

  await page.getByTestId('initialize').click()
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  })
  await executeSql(page, 'SELECT COUNT(*) FROM games;')
  await expect(page.getByTestId('result-row')).toHaveText('10')

  await page.getByTestId('close').click()
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'closed')
  await expect(page.getByTestId('metadata-engine')).toHaveCount(0)

  await page.getByTestId('initialize').click()
  await expect(runtimeStatus(page)).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  })

  const pageErrors: Error[] = []
  const unhandledRejections: string[] = []
  page.on('pageerror', error => pageErrors.push(error))
  await page.exposeFunction('recordUnhandledRejection', (message: string) => {
    unhandledRejections.push(message)
  })
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      recordUnhandledRejection: (message: string) => Promise<void>
    }

    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason)
      void testWindow.recordUnhandledRejection(message)
    })
  })

  await page.evaluate(async () => {
    const closeButton = document.querySelector<HTMLButtonElement>('[data-testid="close"]')
    const homeLink = document.querySelector<HTMLAnchorElement>('.site-brand')
    const statusOutput = document.querySelector<HTMLOutputElement>('[data-testid="runtime-status"]')

    if (!closeButton || !homeLink || !statusOutput) {
      throw new Error('Close controls or runtime status not found.')
    }

    closeButton.click()
    await Promise.resolve()

    if (statusOutput.dataset.status !== 'closing') {
      throw new Error('Runtime did not enter closing state before navigation.')
    }

    homeLink.click()
  })

  await expect(page).toHaveURL(/\/$/)
  await page.waitForTimeout(500)
  expect(pageErrors.map(error => error.message)).toEqual([])
  expect(unhandledRejections).toEqual([])
})
