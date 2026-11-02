import { defineConfig } from '@playwright/test'

/**
 * Playwright E2E smoke configuration (Phase 2).
 * Serves the production build locally via `vite preview`; no production
 * APIs, no network fixtures. Browsers: Chromium headless shell.
 */
export default defineConfig({
  testDir: '../e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4317',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'cd .. && npm run build && npx vite preview -c config/vite.config.ts --port 4317 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
