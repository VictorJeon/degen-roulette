'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProgram } from './useProgram';
import { PublicKey } from '@solana/web3.js';
import type { GameState } from '@/lib/idl';

export function useGameState() {
  const { program, wallet } = useProgram();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGameState = useCallback(async () => {
    if (!program || !wallet) {
      setGameState(null);
      setLoading(false);
      return;
    }

    const [gamePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('game'), wallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      const accountInfo = await program.provider.connection.getAccountInfo(gamePda);
      if (!accountInfo) {
        setGameState(null);
        setLoading(false);
        return;
      }

      const state = program.coder.accounts.decode('GameState', accountInfo.data);
      console.log('Decoded GameState:', JSON.stringify(state, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
      console.log('Status:', state.status);
      console.log('Is active?:', 'active' in state.status);
      setGameState(state as GameState);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch game state:', err);
      setGameState(null);
      setLoading(false);
    }
  }, [program, wallet]);

  // Manual refresh function for after initGame
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchGameState();
  }, [fetchGameState]);

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
  }, [program, wallet, fetchGameState]);

  return { gameState, loading, refresh };
}
