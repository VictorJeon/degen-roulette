'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { initErrorReporter, setErrorWallet } from '@/lib/error-reporter';

export function ErrorReporterInit() {
  const { publicKey } = useWallet();

  useEffect(() => {
    initErrorReporter();
  }, []);

  useEffect(() => {
    setErrorWallet(publicKey?.toBase58() || null);
  }, [publicKey]);

  return null;
}
