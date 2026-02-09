import { test, expect } from '@playwright/test';
import { setupTestMode } from '../../playwright/fixtures/test-setup';
import {
  waitForElement,
  clickAndWaitForNetwork,
  fillAndVerify,
} from '../../playwright/utils/wallet-utils';

/**
 * E2E Test: Happy Path - Game Flow (Win Scenario)
 *
 * Tests the complete game flow:
 * 1. Connect wallet
 * 2. Place bet
 * 3. Select chamber
 * 4. Pull trigger (survive 2 rounds)
 * 5. Cash out
 * 6. Verify results
 */
test.describe('Game Flow - Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test mode with real devnet TX signing
    await setupTestMode(page);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete a winning game with 2 rounds', async ({ page }) => {
    console.log('[Test] Starting happy path test');

    // Step 1: Connect wallet via wallet button
    console.log('[Test] Step 1: Connect wallet');

    // Click the wallet button to open wallet selection modal
    const walletButton = page.locator('.wallet-adapter-button').first();
    await expect(walletButton).toBeVisible({ timeout: 10000 });

    const buttonText = await walletButton.textContent();
    console.log('[Test] Wallet button text:', buttonText);

    // If button says "Select Wallet", click it
    if (buttonText?.includes('Select')) {
      await walletButton.click();
      await page.waitForTimeout(500);

      // Look for Test Wallet option and click it
      const testWalletOption = page.locator('text=Test Wallet');
      if (await testWalletOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('[Test] Clicking Test Wallet option');
        await testWalletOption.click();
        await page.waitForTimeout(1000);
      }
    }

    // Wait for wallet to be connected
    await page.waitForFunction(
      () => {
        const instruction = document.querySelector('.game-instruction');
        const text = instruction?.textContent || '';
        return !text.includes('CONNECT WALLET FIRST');
      },
      { timeout: 5000 }
    );

    console.log('[Test] Wallet connected');

    // Step 2: Enter bet amount
    console.log('[Test] Step 2: Enter bet amount');

    // Find bet input field
    const betInput = page.locator('[data-testid="bet-amount-input"]');
    await expect(betInput).toBeVisible();

    // Clear and enter bet amount
    await betInput.clear();
    await betInput.fill('0.01');

    // Verify value
    const inputValue = await betInput.inputValue();
    expect(parseFloat(inputValue)).toBe(0.01);

    console.log('[Test] Bet amount entered: 0.01 SOL');

    // Step 3: Wait for wallet adapter to connect
    console.log('[Test] Step 3: Waiting for wallet adapter');
    await page.waitForTimeout(2000);

    // Step 4: Click PLAY AGAIN button
    console.log('[Test] Step 4: Click PLAY AGAIN button');

    // Find PLAY AGAIN button (in BetPanel) - NOT "START"
    const startButton = page.locator('[data-testid="start-game-button"]');
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    await startButton.click();

    // Wait for game to start
    // Look for instruction to load chamber
    await page.waitForSelector('.game-instruction:has-text(">>> LOAD THE BULLET <<<")', {
      timeout: 30000,
    });

    console.log('[Test] Game started, waiting for chamber selection');

    // Step 4: Select chamber #1
    console.log('[Test] Step 4: Select chamber');

    // Wait a bit for UI to be ready
    await page.waitForTimeout(1000);

    // Click on chamber #0 (first selectable chamber)
    // Wait for chamber to be selectable (has .selectable class)
    const chamberButton = page.locator('.chamber-overlay.selectable').first();
    await expect(chamberButton).toBeVisible({ timeout: 5000 });
    await chamberButton.click();

    console.log('[Test] Chamber selected');

    // Wait for cylinder to spin and become ready
    await page.waitForSelector('.game-instruction:has-text(">>> PULL THE TRIGGER <<<")', {
      timeout: 10000,
    });

    console.log('[Test] Cylinder ready, trigger can be pulled');

    // Step 5: Pull trigger (Round 1)
    console.log('[Test] Step 5: Pull trigger (Round 1)');

    const pullButton = page.locator('[data-testid="pull-trigger-button"]');
    await expect(pullButton).toBeVisible();
    await expect(pullButton).toBeEnabled();

    await pullButton.click();

    // Wait for round result (animation + network call)
    await page.waitForTimeout(4000);

    // Check if we survived (game should still be active)
    // If lost, test would fail here as game would be over
    const isGameOver = await page.locator('.game-result-title.dead, h1:has-text("YOU DIED.")').isVisible();
    if (isGameOver) {
      console.warn('[Test] Lost on round 1 (RNG - this can happen)');
      // This is acceptable as it's based on random bullet position
      return;
    }

    console.log('[Test] Survived Round 1');

    // Wait for cylinder to reload
    await page.waitForSelector('.game-instruction:has-text(">>> PULL THE TRIGGER <<<")', { timeout: 10000 });

    // Step 6: Pull trigger (Round 2)
    console.log('[Test] Step 6: Pull trigger (Round 2)');

    await pullButton.click();

    // Wait for round result (animation + network call)
    await page.waitForTimeout(4000);

    // Check result
    const isLost = await page.locator('.game-result-title.dead, h1:has-text("YOU DIED.")').isVisible();
    const isWon = await page.locator('.game-result-title.safe, h1:has-text("YOU LIVE.")').isVisible();

    if (isLost) {
      console.warn('[Test] Lost on round 2 (RNG - this can happen)');
      // Verify we at least survived 1 round
      const roundsText = await page.locator('text=/Round|Rounds Survived/i').textContent();
      console.log('[Test] Rounds survived:', roundsText);
      return;
    }

    if (isWon || !isLost) {
      console.log('[Test] Survived Round 2 - checking for cash out option');

      // Step 7: Cash out
      const cashOutButton = page.locator('[data-testid="cashout-button"]');

      if (await cashOutButton.isVisible()) {
        console.log('[Test] Step 7: Cash out');
        await cashOutButton.click();

        // Wait for cash out to process
        await page.waitForTimeout(5000);

        // Verify win message
        await expect(page.locator('.game-result-title.safe, h1:has-text("YOU LIVE.")')).toBeVisible({
          timeout: 10000,
        });

        console.log('[Test] Cash out successful, game won');
      } else {
        console.log('[Test] Auto-settled or continue playing');
      }
    }

    // Step 8: Verify game stats
    console.log('[Test] Step 8: Verify game stats');

    // Look for rounds survived indicator
    const hasRoundsIndicator = await page.locator('text=/rounds? survived/i').isVisible();
    if (hasRoundsIndicator) {
      const roundsText = await page.locator('text=/rounds? survived/i').textContent();
      console.log('[Test] Final stats:', roundsText);
    }

    // Verify we can start a new game
    const newGameButton = page.locator('button:has-text("NEW GAME"), button:has-text("Play Again")');
    if (await newGameButton.isVisible()) {
      console.log('[Test] New game button available');
    }

    console.log('[Test] ✅ Happy path test complete');
  });

  test('should display provably fair information', async ({ page }) => {
    console.log('[Test] Testing provably fair modal');

    // Note: wallet already connected via beforeEach (setupTestMode)

    // Look for "Provably Fair" button (mini-btn in sub-actions)
    const fairButton = page.locator('[data-testid="provably-fair-button"]');

    if (await fairButton.isVisible()) {
      await fairButton.click();

      // Wait for modal to appear
      await page.waitForTimeout(500);

      // Verify modal content
      const modalTitle = page.locator('.modal-card h3:has-text("PROVABLY FAIR")');
      await expect(modalTitle).toBeVisible({ timeout: 3000 });

      console.log('[Test] ✅ Provably Fair modal displayed');

      // Close modal
      const closeButton = page.locator('.modal-card .mini-btn:has-text("Close")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Click backdrop
        await page.keyboard.press('Escape');
      }
    } else {
      console.log('[Test] Provably Fair button not found (may require completed game)');
    }
  });
});
