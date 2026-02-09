import { Page } from '@playwright/test';
import { Keypair, PublicKey } from '@solana/web3.js';
import testKeypairData from './test-keypair';

/**
 * Mock Phantom Wallet for E2E tests
 *
 * Injects a fake window.solana object that mimics Phantom wallet API.
 * Uses a real test keypair for consistent public key across tests.
 */

export interface MockWalletOptions {
  autoConnect?: boolean;
}

export async function injectMockWallet(
  page: Page,
  options: MockWalletOptions = {}
): Promise<PublicKey> {
  const { autoConnect = true } = options;

  // Load test keypair
  const keypair = Keypair.fromSecretKey(new Uint8Array(testKeypairData));
  const publicKeyStr = keypair.publicKey.toBase58();

  console.log('[Mock Wallet] Injecting wallet with public key:', publicKeyStr);

  // Inject mock wallet before page loads
  await page.addInitScript((params) => {
    const { publicKeyStr, autoConnect } = params;

    // Mock Phantom wallet object
    (window as any).solana = {
      publicKey: {
        toBase58: () => publicKeyStr,
        toBuffer: () => {
          // Convert base58 to buffer (simplified - not used in tests)
          return new Uint8Array(32);
        },
        toString: () => publicKeyStr,
      },
      isPhantom: true,
      isConnected: autoConnect,

      // Auto-approve connection
      connect: async (options?: any) => {
        console.log('[Mock Wallet] connect() called', options);
        (window as any).solana.isConnected = true;
        return {
          publicKey: (window as any).solana.publicKey,
        };
      },

      disconnect: async () => {
        console.log('[Mock Wallet] disconnect() called');
        (window as any).solana.isConnected = false;
      },

      // Auto-approve transaction signing
      signTransaction: async (transaction: any) => {
        console.log('[Mock Wallet] signTransaction() called');
        // In real scenario, we'd sign with private key
        // For E2E tests, we just pass through - the backend validates
        return transaction;
      },

      signAllTransactions: async (transactions: any[]) => {
        console.log('[Mock Wallet] signAllTransactions() called', transactions.length);
        return transactions;
      },

      // Sign message (for auth)
      signMessage: async (message: Uint8Array) => {
        console.log('[Mock Wallet] signMessage() called');
        return {
          signature: new Uint8Array(64), // Mock signature
          publicKey: (window as any).solana.publicKey,
        };
      },

      // Event listeners (Phantom API)
      on: (event: string, callback: Function) => {
        console.log('[Mock Wallet] on() listener registered:', event);
        if (event === 'connect' && autoConnect) {
          // Auto-trigger connect event
          setTimeout(() => {
            callback({ publicKey: (window as any).solana.publicKey });
          }, 100);
        }
      },

      off: (event: string, callback: Function) => {
        console.log('[Mock Wallet] off() listener removed:', event);
      },
    };

    // Also inject as window.phantom for some wallet adapters
    (window as any).phantom = {
      solana: (window as any).solana,
    };

    console.log('[Mock Wallet] Injection complete');
  }, { publicKeyStr, autoConnect });

  return keypair.publicKey;
}

/**
 * Wait for wallet connection in UI
 */
export async function waitForWalletConnection(page: Page, timeout = 10000) {
  try {
    await page.waitForFunction(
      () => (window as any).solana?.isConnected === true,
      { timeout }
    );
    console.log('[Mock Wallet] Wallet connected in UI');
  } catch (error) {
    console.error('[Mock Wallet] Wallet connection timeout');
    throw error;
  }
}

/**
 * Get test keypair public key (for reference)
 */
export function getTestPublicKey(): PublicKey {
  const keypair = Keypair.fromSecretKey(new Uint8Array(testKeypairData));
  return keypair.publicKey;
}
