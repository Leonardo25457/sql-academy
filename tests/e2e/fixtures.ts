import { expect, test as base } from '@playwright/test'

interface E2EFixtures {
  vercelProtectionBypass: boolean
}

const rawProtectionBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const protectionBypassSecret = rawProtectionBypassSecret?.trim()

if (rawProtectionBypassSecret !== undefined && !protectionBypassSecret) {
  throw new Error('VERCEL_AUTOMATION_BYPASS_SECRET must not be empty.')
}

export const test = base.extend<E2EFixtures>({
  vercelProtectionBypass: [async ({ baseURL, context }, use) => {
    if (protectionBypassSecret !== undefined) {
      if (!baseURL) {
        throw new Error('PLAYWRIGHT_BASE_URL is required for Vercel Protection bypass.')
      }

      let targetURL: URL
      try {
        targetURL = new URL(baseURL)
      }
      catch {
        throw new Error('PLAYWRIGHT_BASE_URL must be a valid HTTPS URL for Vercel Protection bypass.')
      }

      if (targetURL.protocol !== 'https:') {
        throw new Error('PLAYWRIGHT_BASE_URL must use HTTPS for Vercel Protection bypass.')
      }

      const targetRoot = new URL('/', targetURL.origin).href

      try {
        const bypassResponse = await context.request.get(
          targetRoot,
          {
            headers: {
              'x-vercel-protection-bypass': protectionBypassSecret,
              'x-vercel-set-bypass-cookie': 'true',
            },
            maxRedirects: 0,
          },
        )

        try {
          if (bypassResponse.status() >= 400) {
            throw new Error('Vercel Protection bypass was not accepted.')
          }
        }
        finally {
          await bypassResponse.dispose()
        }

        const verificationResponse = await context.request.get(targetRoot, {
          maxRedirects: 0,
        })

        try {
          const html = await verificationResponse.text()
          if (
            verificationResponse.status() !== 200
            || !html.includes('id="main-content"')
            || !html.includes('SQL Academy')
          ) {
            throw new Error('Vercel Protection bypass verification failed.')
          }
        }
        finally {
          await verificationResponse.dispose()
        }
      }
      catch {
        throw new Error('Unable to initialize Vercel Deployment Protection bypass.')
      }
    }

    await use(true)
  }, { auto: true }],
})

export { expect }
export type { Page } from '@playwright/test'
