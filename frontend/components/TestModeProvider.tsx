'use client';

import { ReactNode } from 'react';

/**
 * TestModeProvider
 *
 * Previously injected window.solana for test mode, but now TestWalletAdapter
 * handles all wallet injection directly. This component is kept as a placeholder
 * for potential future test-mode setup logic.
 */

export function TestModeProvider({ children }: { children: ReactNode }) {
  // TestWalletAdapter now handles everything, no need for window.solana injection
  return <>{children}</>;
}
