import { defineConfig, devices } from '@playwright/test'

const localBaseURL = 'http://127.0.0.1:3000'
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: remoteBaseURL ?? localBaseURL,
    trace: 'retain-on-failure',
  },
  webServer: remoteBaseURL === undefined
    ? {
        command: 'npm run preview -- --host=127.0.0.1 --port=3000',
        url: `${localBaseURL}/spikes/sqlite-wasm`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
