import { Page } from '@playwright/test';

/**
 * Test setup utilities for E2E tests
 */

/**
 * Setup test mode with real devnet TX signing via wallet-adapter
 *
 * Navigates to the app with ?testMode=true which activates TestWalletAdapter.
 * Uses programmatic connection via exposed test helper.
 */
export async function setupTestMode(page: Page): Promise<void> {
  // Capture browser console logs for debugging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[WalletProvider]') || text.includes('[TestWalletAdapter]') || text.includes('[TestWalletHelper]') || text.includes('[BetPanel]')) {
      console.log(`[Browser] ${text}`);
    }
  });

  // Clear mock game state from previous tests
  await page.request.post('http://127.0.0.1:3000/api/game/reset').catch(() => {});

  console.log('[Test Setup] Navigating to /?testMode=true');

  // Navigate with testMode=true query parameter (relative to baseURL)
  await page.goto('/?testMode=true', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  console.log('[Test Setup] Waiting for test wallet to be ready');

  try {
    // Wait for TestWalletAdapter to be ready
    await page.waitForFunction(
      () => {
        const w = window as any;
        return w.__TEST_WALLET_READY__ === true && w.solana?.isConnected === true;
      },
      { timeout: 30000, polling: 100 }
    );

    console.log('[Test Setup] ✓ TestWalletAdapter ready');

    // Wait for test helper function to be available
    await page.waitForFunction(
      () => typeof (window as any).__selectAndConnectWallet === 'function',
      { timeout: 10000 }
    );

    console.log('[Test Setup] Test helper function available');

    // Attempt to call the test helper to programmatically select and connect
    const result = await page.evaluate(async () => {
      return await (window as any).__selectAndConnectWallet('Test Wallet');
    }).catch((err) => {
      console.warn('[Test Setup] Helper failed (this is OK if window.solana is ready):', err.message);
      return false;
    });

    if (result) {
      console.log('[Test Setup] ✓ Wallet helper called (connect() invoked)');
    }

    // Wait for React wallet state to potentially update via autoConnect
    // Note: Due to wallet-adapter-react limitations, the context may not update
    // even though the adapter is connected. This is a known issue.
    console.log('[Test Setup] Checking if autoConnect updated React context...');
    try {
      await page.waitForFunction(
        () => {
          const status = (window as any).__walletStatus?.();
          const btn = document.querySelector('.wallet-adapter-button');
          const btnText = btn?.textContent || '';

          // Success if either React context shows connected OR button shows pubkey
          return (status?.connected === true && !!status?.publicKey) ||
                 (btnText.length > 0 && !btnText.includes('Select') && !btnText.includes('Connect'));
        },
        { timeout: 5000, polling: 300 }
      );

      console.log('[Test Setup] ✓ React wallet connected via autoConnect');
    } catch (e) {
      console.warn('[Test Setup] ⚠ React context did not update (wallet-adapter-react limitation)');
      console.warn('[Test Setup] ⚠ Adapter is connected but useWallet() context shows disconnected');
      console.warn('[Test Setup] ⚠ Continuing anyway - window.solana is ready');
      // Don't throw - continue with window.solana only
    }

    // Final verification: Check window.solana state
    const walletReady = await page.evaluate(() => {
      const w = window as any;
      return w.solana?.isConnected === true && !!w.solana?.publicKey;
    });

    if (!walletReady) {
      throw new Error('window.solana is not in connected state with publicKey');
    }

    console.log('[Test Setup] ✓ window.solana ready (isConnected=true, publicKey exists)');

    // Log wallet information (including button state for debugging)
    const walletInfo = await page.evaluate(() => {
      const btn = document.querySelector('.wallet-adapter-button');
      const reactWalletStatus = (window as any).__walletStatus?.();
      return {
        windowSolana: {
          publicKey: (window as any).solana?.publicKey?.toString(),
          isConnected: (window as any).solana?.isConnected,
        },
        reactWallet: reactWalletStatus || { error: '__walletStatus not available' },
        buttonText: btn?.textContent || '(button not found)',
      };
    });
    console.log('[Test Setup] Wallet info:', JSON.stringify(walletInfo, null, 2));

    if (walletInfo.buttonText.includes('Connect') || walletInfo.buttonText.includes('Select')) {
      console.warn('[Test Setup] ⚠ Button still shows disconnected state, but window.solana is ready');
      console.warn('[Test Setup] ⚠ This is a wallet-adapter-react context limitation');
      console.warn('[Test Setup] ⚠ React wallet connected:', walletInfo.reactWallet.connected);
    }

  } catch (error) {
    // Collect debug information on failure
    const debugInfo = await page.evaluate(() => {
      return {
        hasSolana: typeof (window as any).solana !== 'undefined',
        isConnected: (window as any).solana?.isConnected,
        publicKey: (window as any).solana?.publicKey?.toString(),
        ready: (window as any).__TEST_WALLET_READY__,
        walletButton: document.querySelector('.wallet-adapter-button')?.textContent,
        helperAvailable: typeof (window as any).__connectTestWallet === 'function',
      };
    });

    console.error('[Test Setup] ✗ Wallet connection failed:', debugInfo);
    throw error;
  }

  // Wait for network to stabilize (with fallback)
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.warn('[Test Setup] Network did not become idle within 10s (continuing anyway)');
  });

  console.log('[Test Setup] ✓ Test mode setup complete');
}
