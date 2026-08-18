import { expect, test, type Page } from './fixtures'

const viewportWidths = [320, 375, 768, 1024, 1440, 1920]
const vercelPreviewHostname
  = /^sql-learning-[a-z0-9]+-leonardo-pineda-carrions-projects\.vercel\.app$/
const vercelFeedbackErrorMessage
  = "TypeError: undefined is not an object (evaluating 'navigator.storage.persisted')"
const vercelFeedbackFrameURL = 'https://vercel.live/_next-live/feedback/feedback.html'

interface RuntimeErrorDetails {
  message: string
  stack: string
}

function isExpectedVercelPreview(): boolean {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL

  if (!baseURL) {
    return false
  }

  try {
    const targetURL = new URL(baseURL)
    return targetURL.protocol === 'https:' && vercelPreviewHostname.test(targetURL.hostname)
  }
  catch {
    return false
  }
}

// Vercel Preview Feedback injects a cross-origin iframe, and Playwright WebKit has no
// navigator.storage. This proven external error requires the exact target, message, and origin.
function isKnownVercelPreviewFeedbackError(error: RuntimeErrorDetails): boolean {
  return isExpectedVercelPreview()
    && error.message === vercelFeedbackErrorMessage
    && error.stack.includes(vercelFeedbackFrameURL)
}

async function captureRuntimeErrors(page: Page): Promise<RuntimeErrorDetails[]> {
  const pageErrors: RuntimeErrorDetails[] = []

  page.on('pageerror', error => pageErrors.push({
    message: error.message,
    stack: error.stack ?? '',
  }))
  await page.addInitScript(() => {
    const testWindow = window as typeof window & {
      appShellUnhandledRejections: RuntimeErrorDetails[]
    }

    testWindow.appShellUnhandledRejections = []
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      testWindow.appShellUnhandledRejections.push({
        message: reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason),
        stack: reason instanceof Error ? reason.stack ?? '' : '',
      })
    })
  })

  return pageErrors
}

test('App Shell is semantic, accessible and responsive', async ({ page }) => {
  const pageErrors = await captureRuntimeErrors(page)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const header = page.getByRole('banner')
  const main = page.getByRole('main')
  const footer = page.getByRole('contentinfo')
  const brand = page.getByRole('link', { name: 'SQL Academy' })
  const skipLink = page.getByRole('link', { name: 'Saltar al contenido principal' })
  const principleItems = page.getByRole('listitem')

  await expect(header).toBeVisible()
  await expect(main).toBeVisible()
  await expect(main).toHaveAttribute('id', 'main-content')
  await expect(footer).toBeVisible()
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(brand).toHaveAttribute('href', '/')
  await expect(page.locator('a')).toHaveCount(2)
  expect(
    await page.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))),
  ).toEqual(['#main-content', '/'])
  await expect(page.getByRole('list')).toHaveCount(1)
  await expect(principleItems).toHaveCount(3)

  await expect(
    page.locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').first(),
  )
    .toHaveAttribute('href', '#main-content')
  await skipLink.focus()
  await expect(skipLink).toBeFocused()

  const focusStyle = await skipLink.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      transitionDurationsMs: style.transitionDuration.split(',').map((duration) => {
        const value = Number.parseFloat(duration)
        return duration.trim().endsWith('ms') ? value : value * 1000
      }),
    }
  })
  expect(focusStyle.outlineStyle).not.toBe('none')
  expect(focusStyle.outlineWidth).toBeGreaterThan(0)
  expect(Math.max(...focusStyle.transitionDurationsMs)).toBeLessThanOrEqual(0.01)

  await page.keyboard.press('Enter')
  await expect(main).toBeFocused()
  await expect(page).toHaveURL(/\/#main-content$/)

  await page.goto('/')
  await expect(page).toHaveURL(url => url.pathname === '/' && url.hash === '')
  await brand.focus()
  await expect(brand).toBeFocused()
  const brandFocusStyle = await brand.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    }
  })
  expect(brandFocusStyle.outlineStyle).not.toBe('none')
  expect(brandFocusStyle.outlineWidth).toBeGreaterThan(0)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(url => url.pathname === '/' && url.hash === '')

  const brandBox = await brand.boundingBox()
  expect(brandBox).not.toBeNull()
  expect(brandBox!.height).toBeGreaterThanOrEqual(44)

  expect(
    await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
  ).toBe(true)

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 900 })
    await page.evaluate(() => new Promise(requestAnimationFrame))

    const layout = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth
      const elements = [
        document.querySelector('header'),
        document.querySelector('main'),
        document.querySelector('footer'),
        document.querySelector('h1'),
        ...document.querySelectorAll('.ui-card'),
      ].filter((element): element is HTMLElement => element instanceof HTMLElement)

      return {
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        hasOutsideElement: elements.some((element) => {
          const rect = element.getBoundingClientRect()
          return rect.left < -1 || rect.right > viewportWidth + 1 || rect.width <= 0 || rect.height <= 0
        }),
        hasInternalOverflow: elements.some(
          element => element.scrollWidth - element.clientWidth > 1,
        ),
      }
    })
    expect(layout.documentOverflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1)
    expect(layout.hasOutsideElement, `outside element at ${width}px`).toBe(false)
    expect(layout.hasInternalOverflow, `internal overflow at ${width}px`).toBe(false)
    await expect(page.locator('h1')).toBeVisible()
    await expect(principleItems).toHaveCount(3)
  }

  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  const textResizeOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(textResizeOverflow, 'horizontal overflow at 200% text resizing').toBeLessThanOrEqual(1)
  await expect(page.locator('h1')).toBeVisible()

  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  const unhandledRejections = await page.evaluate(() => {
    const testWindow = window as typeof window & {
      appShellUnhandledRejections: RuntimeErrorDetails[]
    }
    return testWindow.appShellUnhandledRejections
  })
  const unexpectedPageErrors = pageErrors.filter(
    error => !isKnownVercelPreviewFeedbackError(error),
  )
  const unexpectedUnhandledRejections = unhandledRejections.filter(
    error => !isKnownVercelPreviewFeedbackError(error),
  )
  expect(unexpectedPageErrors).toEqual([])
  expect(unexpectedUnhandledRejections).toEqual([])
})
