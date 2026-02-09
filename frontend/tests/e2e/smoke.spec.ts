import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic Diagnostics
 *
 * These tests verify that:
 * 1. The dev server is running and accessible
 * 2. The homepage loads correctly
 * 3. Test mode parameter works and injects test wallet
 */
test.describe('Smoke Test - Dev Server', () => {
  test('should load the homepage', async ({ page }) => {
    console.log('[Smoke] Navigating to homepage...');
    await page.goto('/');

    console.log('[Smoke] Waiting for page load...');
    await page.waitForLoadState('domcontentloaded');

    console.log('[Smoke] Checking title...');
    await expect(page).toHaveTitle(/DEGEN ROULETTE/i);

    console.log('[Smoke] ✓ Homepage loaded successfully');
  });

  test('should load with testMode parameter', async ({ page }) => {
    console.log('[Smoke] Navigating with testMode...');
    await page.goto('/?testMode=true');

    await page.waitForLoadState('domcontentloaded');

    console.log('[Smoke] Waiting for test wallet injection...');

    // Wait for test wallet to be injected (max 30s)
    const hasTestWallet = await page.waitForFunction(
      () => {
        const w = window as any;
        return w.__TEST_WALLET_READY__ === true && typeof w.solana !== 'undefined';
      },
      { timeout: 30000 }
    );

    expect(hasTestWallet).toBeTruthy();

    // Verify wallet details
    const walletInfo = await page.evaluate(() => ({
      hasSolana: typeof (window as any).solana !== 'undefined',
      publicKey: (window as any).solana?.publicKey?.toString(),
      isConnected: (window as any).solana?.isConnected,
    }));

    console.log('[Smoke] Test wallet info:', walletInfo);
    expect(walletInfo.hasSolana).toBeTruthy();
    expect(walletInfo.publicKey).toBeTruthy();

    console.log('[Smoke] ✓ Test mode working correctly');
  });
});
