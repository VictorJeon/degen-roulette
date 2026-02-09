import { PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';

/**
 * Detects if the app is running in testMode (for E2E tests)
 */
export function isTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('testMode') === 'true';
}

/**
 * Gets the public key, falling back to window.solana in testMode
 * This is needed because wallet-adapter-react's useWallet() context
 * doesn't always reflect TestWalletAdapter connection state.
 */
export function getPublicKey(walletPublicKey: PublicKey | null): PublicKey | null {
  // If wallet context has publicKey, use it
  if (walletPublicKey) return walletPublicKey;

  // In testMode, fallback to window.solana
  if (isTestMode()) {
    const solana = (window as any).solana;
    return solana?.publicKey || null;
  }

  return null;
}

/**
 * Gets the AnchorWallet, falling back to window.solana in testMode
 * This is needed because wallet-adapter-react's useAnchorWallet() returns null
 * even when TestWalletAdapter is connected via window.solana.
 */
export function getAnchorWallet(walletFromHook: AnchorWallet | undefined): AnchorWallet | undefined {
  // If wallet context has wallet, use it
  if (walletFromHook) return walletFromHook;

  // In testMode, wrap window.solana as AnchorWallet
  if (!isTestMode()) return undefined;

  const solana = (window as any).solana;
  if (!solana?.publicKey || !solana?.isConnected) return undefined;

  return {
    publicKey: solana.publicKey,
    signTransaction: (tx) => solana.signTransaction(tx),
    signAllTransactions: (txs) => solana.signAllTransactions(txs),
  };
}
