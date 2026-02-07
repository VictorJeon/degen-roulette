'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import WalletProvider with SSR disabled
const WalletProviderInner = dynamic(
  () => import('./WalletProvider').then((mod) => mod.WalletProvider),
  { ssr: false }
);

export function WalletProviderWrapper({ children }: { children: ReactNode }) {
  return <WalletProviderInner>{children}</WalletProviderInner>;
}
