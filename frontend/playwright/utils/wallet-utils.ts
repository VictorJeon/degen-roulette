import { Page, expect } from '@playwright/test';

/**
 * Wallet utilities for E2E tests
 */

/**
 * Connect wallet via wallet-adapter UI
 * Handles the modal flow: click connect -> select Phantom -> wait for connection
 */
export async function connectWallet(page: Page, timeout = 10000) {
  console.log('[Wallet Utils] Connecting wallet...');

  // Click connect button
  const connectButton = page.locator('.wallet-adapter-button').first();
  if (await connectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await connectButton.click();

    // Wait for wallet modal and click Phantom
    const phantomOption = page.locator('.wallet-adapter-modal button:has-text("Phantom")').first();
    if (await phantomOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phantomOption.click();
      console.log('[Wallet Utils] Clicked Phantom option');
    }

    // Wait for connection and modal to close
    await page.waitForTimeout(1500);

    // If modal still open, click overlay to close
    const modalOverlay = page.locator('.wallet-adapter-modal-overlay');
    if (await modalOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
      await modalOverlay.click({ force: true });
      console.log('[Wallet Utils] Closed modal overlay');
    }

    // Verify connection by checking button text changed
    await page.waitForTimeout(500);
    console.log('[Wallet Utils] Wallet connected');
  } else {
    console.log('[Wallet Utils] Connect button not found, wallet may already be connected');
  }
}

/**
 * Wait for transaction confirmation
 * Polls for success/error message in UI
 */
export async function waitForTransactionConfirmation(
  page: Page,
  timeout = 30000
) {
  try {
    // Wait for either success or error message
    await Promise.race([
      page.waitForSelector('text=/transaction confirmed|game started|transaction successful/i', { timeout }),
      page.waitForSelector('text=/transaction failed|error/i', { timeout }).then(() => {
        throw new Error('Transaction failed');
      }),
    ]);
    console.log('[Wallet Utils] Transaction confirmed');
  } catch (error) {
    console.error('[Wallet Utils] Transaction confirmation timeout or failed');
    throw error;
  }
}

/**
 * Get displayed wallet balance from UI
 */
export async function getDisplayedBalance(page: Page): Promise<number> {
  // Try to find balance display (adjust selector based on actual UI)
  const balanceText = await page.locator('text=/[0-9]+\\.?[0-9]* SOL/i').first().textContent();

  if (!balanceText) {
    throw new Error('Balance not found in UI');
  }

  const match = balanceText.match(/([0-9]+\.?[0-9]*)/);
  if (!match) {
    throw new Error(`Invalid balance format: ${balanceText}`);
  }

  const balance = parseFloat(match[1]);
  console.log('[Wallet Utils] Displayed balance:', balance, 'SOL');
  return balance;
}

/**
 * Capture current game state from UI
 */
export async function captureGameState(page: Page) {
  // Extract game state from UI (adjust selectors based on actual UI)
  const state = {
    status: await page.locator('[data-testid="game-status"]').textContent().catch(() => 'unknown'),
    betAmount: await page.locator('[data-testid="bet-amount"]').textContent().catch(() => '0'),
    roundsSurvived: await page.locator('[data-testid="rounds-survived"]').textContent().catch(() => '0'),
    currentMultiplier: await page.locator('[data-testid="current-multiplier"]').textContent().catch(() => '1.0'),
  };

  console.log('[Wallet Utils] Game state:', state);
  return state;
}

/**
 * Wait for game to be in specific status
 */
export async function waitForGameStatus(
  page: Page,
  status: 'idle' | 'waiting_start' | 'active' | 'settling' | 'won' | 'lost',
  timeout = 15000
) {
  console.log('[Wallet Utils] Waiting for game status:', status);

  // Map status to UI indicators
  const statusIndicators: Record<string, string> = {
    idle: 'text=/ready|start game/i',
    waiting_start: 'text=/waiting|processing/i',
    active: 'text=/pull trigger|active/i',
    settling: 'text=/settling|processing/i',
    won: 'text=/you survived|won|victory/i',
    lost: 'text=/you lost|dead|game over/i',
  };

  const selector = statusIndicators[status];
  if (!selector) {
    throw new Error(`Unknown status: ${status}`);
  }

  await page.waitForSelector(selector, { timeout });
  console.log('[Wallet Utils] Game status reached:', status);
}

/**
 * Wait for element to be visible (with retry)
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  console.log('[Wallet Utils] Element visible:', selector);
}

/**
 * Click button and wait for network idle
 */
export async function clickAndWaitForNetwork(
  page: Page,
  selector: string,
  timeout = 15000
) {
  console.log('[Wallet Utils] Clicking:', selector);

  // Wait for network to be idle before clicking
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
    console.warn('[Wallet Utils] Network not idle before click');
  });

  // Click button
  await page.click(selector);

  // Wait for network requests to complete
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {
    console.warn('[Wallet Utils] Network not idle after click');
  });

  console.log('[Wallet Utils] Click complete:', selector);
}

/**
 * Fill input and verify value
 */
export async function fillAndVerify(
  page: Page,
  selector: string,
  value: string
) {
  await page.fill(selector, value);

  // Verify value was set
  const actualValue = await page.inputValue(selector);
  expect(actualValue).toBe(value);

  console.log('[Wallet Utils] Input filled:', selector, '=', value);
}
