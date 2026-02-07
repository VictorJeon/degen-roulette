'use client';

import { useEffect, useState } from 'react';
import { useProgram } from './useProgram';
import { PublicKey } from '@solana/web3.js';
import type { GameState } from '@/lib/idl';

export function useGameState() {
  const { program, wallet } = useProgram();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!program || !wallet) {
      setGameState(null);
      setLoading(false);
      return;
    }

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('game'), wallet.publicKey.toBuffer()],
      program.programId
    );

    let subscriptionId: number | null = null;

    const fetchGameState = async () => {
      try {
        const accountInfo = await program.provider.connection.getAccountInfo(gamePda);
        if (!accountInfo) {
          setGameState(null);
          setLoading(false);
          return;
        }

        const state = program.coder.accounts.decode('GameState', accountInfo.data);
        setGameState(state as GameState);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch game state:', err);
        setGameState(null);
        setLoading(false);
      }
    };

    const subscribe = async () => {
      await fetchGameState();

      subscriptionId = program.provider.connection.onAccountChange(
        gamePda,
        async () => {
          await fetchGameState();
        },
        'confirmed'
      );
    };

    subscribe();

    return () => {
      if (subscriptionId !== null) {
        program.provider.connection.removeAccountChangeListener(subscriptionId);
      }
    };
  }, [program, wallet]);

  return { gameState, loading };
}
