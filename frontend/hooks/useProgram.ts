'use client';

import { useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { IDL } from '@/lib/idl';
import { PROGRAM_ID } from '@/lib/constants';
import { getAnchorWallet } from '@/lib/testMode';

export function useProgram() {
  const { connection } = useConnection();
  const walletFromHook = useAnchorWallet();
  const wallet = getAnchorWallet(walletFromHook);

  const program = useMemo(() => {
    if (!wallet) return null;

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    return new Program(IDL, provider);
  }, [connection, wallet]);

  return { program, wallet };
}
