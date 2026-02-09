import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for Playwright E2E Tests
 *
 * Ensures that the dev server is fully ready before tests begin.
 * This is especially important for Next.js 16 with Turbopack.
 */
async function globalSetup(config: FullConfig) {
  console.log('[Global Setup] Starting...');

  // Get base URL from webServer config
  const baseURL = config.webServer?.url || 'http://127.0.0.1:3000';
  console.log('[Global Setup] Checking dev server at:', baseURL);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Retry up to 10 times to reach the dev server
    for (let i = 0; i < 10; i++) {
      try {
        console.log(`[Global Setup] Attempt ${i + 1}/10 to reach dev server...`);
        await page.goto(baseURL, { timeout: 45000 });

        // Wait for page to be interactive
        await page.waitForLoadState('domcontentloaded');

        // Wait for network to stabilize (Next.js hydration)
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        console.log('[Global Setup] ✓ Dev server is ready!');
        break;
      } catch (error) {
        if (i === 9) {
          console.error('[Global Setup] ✗ Failed to reach dev server after 10 attempts');
          console.error('[Global Setup] Error:', error);
          throw error;
        }
        console.log(`[Global Setup] Retry in 10s...`);
        await page.waitForTimeout(10000);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('[Global Setup] Complete');
}

export default globalSetup;
