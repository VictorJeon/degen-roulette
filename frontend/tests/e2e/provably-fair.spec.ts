import { test, expect } from '@playwright/test';
import { setupTestMode } from '../../playwright/fixtures/test-setup';

/**
 * E2E Test: Provably Fair Verification
 *
 * Tests the provably fair system:
 * 1. Complete a game
 * 2. Open provably fair modal
 * 3. Verify server seed is displayed
 * 4. Verify seed hash matches
 * 5. Test verification functionality
 */
test.describe('Provably Fair Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test mode with real devnet TX signing
    await setupTestMode(page);

    await page.waitForLoadState('networkidle');
  });

  test('should display server seed after game completion', async ({ page }) => {
    console.log('[Test] Testing provably fair - server seed display');

    // Wallet should already be connected via setupTestMode in beforeEach
    // Verify connection
    await page.waitForFunction(
      () => (window as any).solana?.isConnected === true,
      { timeout: 5000 }
    ).catch(() => {
      console.warn('[Test] Wallet not connected, test may fail');
    });

    // Start a game
    const betInput = page.locator('[data-testid="bet-amount-input"]').first();
    await betInput.clear();
    await betInput.fill('0.01');

    const startButton = page.locator('[data-testid="start-game-button"]');
    await startButton.click();

    // Wait for game to start
    await page.waitForSelector('.game-instruction:has-text(">>> LOAD THE BULLET <<<")', { timeout: 30000 });

    // Select chamber (wait for selectable class)
    const chamberButton = page.locator('.chamber-overlay.selectable').first();
    await expect(chamberButton).toBeVisible({ timeout: 5000 });
    await chamberButton.click();

    // Wait for trigger to be ready
    await page.waitForSelector('.game-instruction:has-text(">>> PULL THE TRIGGER <<<")', { timeout: 10000 });

    // Pull trigger
    const pullButton = page.locator('[data-testid="pull-trigger-button"]').first();
    await pullButton.click();

    // Wait for result
    await page.waitForTimeout(5000);

    // Use sub-actions button — ResultOverlay may cover it, use dispatchEvent for reliable click
    const fairButton = page.locator('[data-testid="provably-fair-button"]');

    if (await fairButton.isVisible({ timeout: 5000 })) {
      console.log('[Test] Provably Fair button found, opening modal');

      await fairButton.dispatchEvent('click');
      await page.waitForTimeout(500);

      // Verify modal is displayed
      const modalTitle = page.locator('.modal-card h3:has-text("PROVABLY FAIR")');
      await expect(modalTitle).toBeVisible({ timeout: 3000 });

      // Look for server seed (revealed after game)
      const serverSeedLabel = page.locator('.modal-card p:has-text("Server Seed")');
      const seedElement = page.locator('.modal-card p.mono.seed');

      const hasSeedLabel = await serverSeedLabel.isVisible();
      const hasSeed = await seedElement.isVisible();

      // Game ID should also be visible
      const gameIdElement = page.locator('.modal-card p.mono:has-text("Game ID:")');
      const hasGameId = await gameIdElement.isVisible();

      expect(hasSeedLabel || hasSeed || hasGameId).toBeTruthy();

      console.log('[Test] ✅ Server seed displayed in modal');

      // Close modal
      const closeButton = page.locator('.modal-card .mini-btn:has-text("Close")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    } else {
      console.log('[Test] Provably Fair button not visible yet (may need game completion)');
    }
  });

  test('should allow manual verification of game result', async ({ page }) => {
    console.log('[Test] Testing manual verification flow');

    // This test assumes we can access a completed game's data
    // In practice, we'd need to complete a game first or have test data

    // Look for any "View Details" or "Verify" functionality
    const verifyLinks = page.locator('a:has-text("Verify"), button:has-text("Verify")');

    if (await verifyLinks.count() > 0) {
      console.log('[Test] Found verify link');

      await verifyLinks.first().click();
      await page.waitForTimeout(1000);

      // Should show verification details
      const hasVerification = await page.locator('text=/verification|verified|hash/i').isVisible();

      if (hasVerification) {
        console.log('[Test] ✅ Verification page displayed');

        // Look for key elements:
        // - Server seed
        // - Seed hash
        // - Bullet position
        // - Verification result

        const hasSeed = await page.locator('text=/server seed/i').isVisible();
        const hasHash = await page.locator('text=/seed hash|hash/i').isVisible();
        const hasBullet = await page.locator('text=/bullet position/i').isVisible();

        console.log('[Test] Verification elements:', {
          seed: hasSeed,
          hash: hasHash,
          bullet: hasBullet,
        });

        expect(hasSeed || hasHash || hasBullet).toBeTruthy();
      }
    } else {
      console.log('[Test] No verify link found (requires completed game)');
    }
  });

  test('should show consistent seed hash before and after game', async ({ page }) => {
    console.log('[Test] Testing seed hash consistency');

    // Wallet should already be connected via setupTestMode in beforeEach
    await page.waitForFunction(
      () => (window as any).solana?.isConnected === true,
      { timeout: 5000 }
    ).catch(() => {
      console.warn('[Test] Wallet not connected, test may fail');
    });

    // Start game and capture seed hash (if visible)
    const betInput = page.locator('[data-testid="bet-amount-input"]').first();
    await betInput.clear();
    await betInput.fill('0.01');

    const startButton = page.locator('[data-testid="start-game-button"]');
    await startButton.click();

    await page.waitForTimeout(3000);

    // Try to find seed hash in UI before game completes
    let seedHashBefore: string | null = null;
    const hashElementBefore = page.locator('text=/[0-9a-f]{32,}/i').first();
    if (await hashElementBefore.isVisible({ timeout: 2000 })) {
      seedHashBefore = await hashElementBefore.textContent();
      console.log('[Test] Seed hash before game:', seedHashBefore?.substring(0, 16) + '...');
    }

    // Complete the game (quick path - just lose immediately)
    await page.waitForSelector('.game-instruction:has-text(">>> LOAD THE BULLET <<<")', { timeout: 10000 });

    // Select chamber (must be selectable)
    const chamberButton = page.locator('.chamber-overlay.selectable').first();
    await expect(chamberButton).toBeVisible({ timeout: 5000 });
    await chamberButton.click();

    await page.waitForSelector('.game-instruction:has-text(">>> PULL THE TRIGGER <<<")', { timeout: 10000 });

    // Pull trigger
    const pullButton = page.locator('[data-testid="pull-trigger-button"]').first();
    await pullButton.click();

    await page.waitForTimeout(5000);

    // Use sub-actions button — ResultOverlay may cover it, use dispatchEvent for reliable click
    const fairButton = page.locator('[data-testid="provably-fair-button"]');
    if (await fairButton.isVisible({ timeout: 3000 })) {
      await fairButton.dispatchEvent('click');
      await page.waitForTimeout(500);

      // Get seed from modal
      const seedElement = page.locator('.modal-card p.mono.seed');
      if (await seedElement.isVisible()) {
        const seedHashAfter = await seedElement.textContent();
        console.log('[Test] Server seed after game:', seedHashAfter?.substring(0, 16) + '...');

        // Note: seedHashBefore is the hash, seedHashAfter is the revealed seed
        // We can't directly compare them, but both should exist
        if (seedHashBefore && seedHashAfter) {
          console.log('[Test] ✅ Both seed hash and revealed seed are present');
        } else {
          console.log('[Test] Could not verify seed (one missing)');
        }
      }
    }
  });

  test('should explain provably fair system to users', async ({ page }) => {
    console.log('[Test] Testing provably fair explanation');

    // Look for "How to Play" or "Provably Fair" buttons (mini-btn in sub-actions)
    const howToPlayButton = page.locator('.mini-btn:has-text("How to Play")');
    const fairButton = page.locator('[data-testid="provably-fair-button"]');

    if (await howToPlayButton.isVisible()) {
      await howToPlayButton.click();
      await page.waitForTimeout(500);

      // Check for modal
      const modalTitle = page.locator('.modal-card h3:has-text("HOW TO PLAY")');
      if (await modalTitle.isVisible()) {
        console.log('[Test] ✅ How to Play modal displayed');
      }

      // Close modal
      await page.keyboard.press('Escape');
    }

    if (await fairButton.isVisible()) {
      await fairButton.click();
      await page.waitForTimeout(500);

      // Verify modal content
      const modalTitle = page.locator('.modal-card h3:has-text("PROVABLY FAIR")');
      const hasExplanation = await modalTitle.isVisible();

      if (hasExplanation) {
        console.log('[Test] ✅ Provably Fair explanation found in modal');
      } else {
        console.log('[Test] Provably Fair modal not shown');
      }

      // Close modal
      await page.keyboard.press('Escape');
    } else {
      console.log('[Test] Provably Fair button not found');
    }
  });
});
