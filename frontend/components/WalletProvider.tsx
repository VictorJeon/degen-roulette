'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { TestWalletAdapter } from '@/lib/test-wallet-adapter';
import { TestWalletHelper } from '@/components/TestWalletHelper';

const isTestMode = typeof window !== 'undefined' && (window as any).__TEST_MODE_ENABLED__ === true;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => {
    const w = [new PhantomWalletAdapter()];
    if (isTestMode) {
      w.push(new TestWalletAdapter() as any);
    }
    return w;
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {isTestMode && <TestWalletHelper />}
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
