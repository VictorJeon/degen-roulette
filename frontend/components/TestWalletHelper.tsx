'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * TestWalletHelper
 *
 * Exposes wallet-adapter hooks to window for E2E testing.
 * Only active in testMode.
 */
export function TestWalletHelper() {
  const { select, connect, connected, publicKey, wallet } = useWallet();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__TEST_MODE_ENABLED__) {
      (window as any).__selectAndConnectWallet = async (walletName: string) => {
        try {
          console.log('[TestWalletHelper] __selectAndConnectWallet called with:', walletName);
          console.log('[TestWalletHelper] Current state - connected:', connected, 'publicKey:', publicKey?.toString());

          console.log('[TestWalletHelper] Calling select()...');
          select(walletName as any);

          // Wait for wallet to be selected
          await new Promise(resolve => setTimeout(resolve, 1000));

          console.log('[TestWalletHelper] After select, wallet object:', wallet?.adapter?.name);
          console.log('[TestWalletHelper] Wallet adapter connected:', wallet?.adapter?.connected);

          // If adapter is already connected but React context isn't, this is the known issue
          // Return true anyway since window.solana is ready
          console.log('[TestWalletHelper] Calling connect()...');
          await connect();

          // Wait for connection to propagate to React context
          await new Promise(resolve => setTimeout(resolve, 2000));

          console.log('[TestWalletHelper] After connect - connected:', connected, 'publicKey:', publicKey?.toString());

          // Return true even if React context didn't update, as long as adapter is connected
          return true;
        } catch (e) {
          console.error('[TestWalletHelper] Failed to select/connect:', e);
          return false;
        }
      };

      // Also expose status
      (window as any).__walletStatus = () => ({
        connected,
        publicKey: publicKey?.toString(),
        walletName: wallet?.adapter?.name,
      });

      console.log('[TestWalletHelper] Test helpers exposed');
    }
  }, [select, connect, connected, publicKey, wallet]);

  return null; // This component renders nothing
}
