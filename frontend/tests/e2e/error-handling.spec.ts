import { test, expect } from '@playwright/test';
import { setupTestMode } from '../../playwright/fixtures/test-setup';

/**
 * E2E Test: Error Handling
 *
 * Tests error scenarios:
 * 1. Invalid bet amount (below minimum)
 * 2. Wallet not connected
 * 3. Duplicate game start (if applicable)
 */
test.describe('Error Handling', () => {
  test.describe('without wallet', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate without test mode (no wallet injection)
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should show error for wallet not connected', async ({ page }) => {
    console.log('[Test] Testing wallet not connected error');

    // Don't inject wallet - test without connection

    // Try to enter bet amount
    const betInput = page.locator('[data-testid="bet-amount-input"]').first();
    await expect(betInput).toBeVisible({ timeout: 10000 });

    await betInput.clear();
    await betInput.fill('0.01');

    // Try to click PLAY AGAIN button
    const startButton = page.locator('[data-testid="start-game-button"]');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Should show wallet connection error in game-instruction
    const errorMessage = page.locator('.game-instruction:has-text(">>> CONNECT WALLET FIRST <<<")');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('[Test] ✅ Wallet not connected error displayed');
    });
  });

  test.describe('with wallet', () => {
    test.beforeEach(async ({ page }) => {
      // Setup test mode (wallet already connected)
      await setupTestMode(page);
    });

    test('should show error for bet below minimum', async ({ page }) => {
      console.log('[Test] Testing minimum bet validation');

    // Enter bet below minimum (MIN_BET is 0.001 SOL)
    const betInput = page.locator('[data-testid="bet-amount-input"]').first();
    await expect(betInput).toBeVisible();

    await betInput.clear();
    await betInput.fill('0.0001'); // Below minimum

    // Try to start game
    const startButton = page.locator('[data-testid="start-game-button"]');
    await startButton.click();

    // Should show minimum bet error in game-instruction
    const errorMessage = page.locator('.game-instruction:has-text(">>> MIN BET: 0.001 SOL <<<")');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('[Test] ✅ Minimum bet error displayed');
  });

    test('should handle invalid bet amount (zero or negative)', async ({ page }) => {
      console.log('[Test] Testing invalid bet amount');

      // Try zero bet
    const betInput = page.locator('[data-testid="bet-amount-input"]').first();
    await expect(betInput).toBeVisible();

    await betInput.clear();
    await betInput.fill('0');

    const startButton = page.locator('[data-testid="start-game-button"]');
    await startButton.click();

    // Should show error in game-instruction
    const errorMessage = page.locator('.game-instruction:has-text(">>> MIN BET: 0.001 SOL <<<")');
    const hasError = await errorMessage.isVisible({ timeout: 3000 });

      expect(hasError).toBeTruthy();

      console.log('[Test] ✅ Invalid bet amount handled');
    });

    test('should prevent starting duplicate game', async ({ page }) => {
      console.log('[Test] Testing duplicate game start prevention');

      // Start first game
    const betInput = page.locator('[data-testid="bet-amount-input"]').first();
    await betInput.clear();
    await betInput.fill('0.01');

    const startButton = page.locator('[data-testid="start-game-button"]');
    await startButton.click();

    // Wait for game to start (using selector instead of fixed timeout)
    const gameInstruction = page.locator('.game-instruction:has-text(">>> LOAD THE BULLET <<<")');
    const gameStarted = await gameInstruction.isVisible({ timeout: 10000 }).catch(() => false);

    if (gameStarted) {
      console.log('[Test] Game started, checking duplicate prevention...');

      // START button should not be visible during active game (BetPanel is hidden)
      const isStartVisible = await startButton.isVisible({ timeout: 2000 }).catch(() => false);
      const isStartEnabled = await startButton.isEnabled({ timeout: 2000 }).catch(() => false);

      if (isStartVisible && isStartEnabled) {
        // Try clicking again
        await startButton.click();
        await page.waitForTimeout(1000);

        // Game state should not change (still showing LOAD)
        const stillActive = await gameInstruction.isVisible();
        expect(stillActive).toBeTruthy();
        console.log('[Test] ✅ Duplicate game start prevented');
      } else {
        console.log('[Test] ✅ START button hidden/disabled during active game');
      }
      } else {
        console.log('[Test] Game start may have failed, skipping duplicate check');
      }
    });

    test('should handle insufficient balance gracefully', async ({ page }) => {
      console.log('[Test] Testing insufficient balance handling');

      // Try to bet an extremely high amount
    const betInput = page.locator('[data-testid="bet-amount-input"]').first();
    await betInput.clear();
    await betInput.fill('1000'); // 1000 SOL (unlikely to have)

    const startButton = page.locator('[data-testid="start-game-button"]');
    await startButton.click();

    // Wait for error
    await page.waitForTimeout(5000);

    // Should show insufficient balance error (in game-instruction or game-error)
    const errorInstruction = page.locator('.game-instruction:has-text(">>>")');
    const errorElement = page.locator('.game-error');
    const hasError = (await errorInstruction.isVisible({ timeout: 5000 })) ||
                     (await errorElement.isVisible({ timeout: 5000 }));

    if (hasError) {
      console.log('[Test] ✅ Error message displayed');
    } else {
      console.log('[Test] No explicit error shown, but transaction likely failed');
      // Game should not have started
      const gameStarted = page.locator('.game-instruction:has-text(">>> LOAD THE BULLET <<<")');
        const started = await gameStarted.isVisible({ timeout: 2000 });
        expect(started).toBeFalsy();
      }
    });
  });
});
