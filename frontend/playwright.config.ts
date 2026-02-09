import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Tests run against local dev server with test wallet injection.
 * Uses Devnet RPC with test keypair.
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './playwright/global-setup.ts',

  // TX confirmation can take 30s+ on devnet
  timeout: 90_000,

  fullyParallel: false,
  forbidOnly: !!process.env.CI,

  // Devnet RPC can be flaky
  retries: 2,

  // Avoid RPC rate limiting
  workers: 1,

  reporter: [['html'], ['list']],

  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000, // Next.js + Turbopack can take time to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
