'use client';

import { useCallback, useState } from 'react';
import { useProgram } from './useProgram';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export function useBet() {
  const { program, wallet } = useProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initGame = useCallback(
    async (betAmountSol: number) => {
      if (!program || !wallet) {
        throw new Error('Wallet not connected');
      }

      setLoading(true);
      setError(null);

      try {
        const betAmountLamports = new anchor.BN(betAmountSol * LAMPORTS_PER_SOL);

        const [houseConfig] = PublicKey.findProgramAddressSync(
          [Buffer.from('house_config')],
          program.programId
        );

        const [houseVault] = PublicKey.findProgramAddressSync(
          [Buffer.from('house_vault')],
          program.programId
        );

        const [gamePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('game'), wallet.publicKey.toBuffer()],
          program.programId
        );

        const tx = await program.methods
          .initGame(betAmountLamports)
          .accounts({
            houseConfig,
            houseVault,
            game: gamePda,
            player: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log('Init game TX:', tx);
        return tx;
      } catch (err: any) {
        console.error('Init game error:', err);
        setError(err.message || 'Failed to init game');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [program, wallet]
  );

  const pullTrigger = useCallback(async () => {
    if (!program || !wallet) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const [houseConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from('house_config')],
        program.programId
      );

      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('game'), wallet.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .pullTrigger()
        .accounts({
          houseConfig,
          game: gamePda,
          player: wallet.publicKey,
        })
        .rpc();

      console.log('Pull trigger TX:', tx);
      return tx;
    } catch (err: any) {
      console.error('Pull trigger error:', err);
      setError(err.message || 'Failed to pull trigger');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  const cashOut = useCallback(async () => {
    if (!program || !wallet) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const [houseConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from('house_config')],
        program.programId
      );

      const [houseVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('house_vault')],
        program.programId
      );

      const [gamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('game'), wallet.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .cashOut()
        .accounts({
          houseConfig,
          houseVault,
          game: gamePda,
          player: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Cash out TX:', tx);
      return tx;
    } catch (err: any) {
      console.error('Cash out error:', err);
      setError(err.message || 'Failed to cash out');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  return {
    initGame,
    pullTrigger,
    cashOut,
    loading,
    error,
  };
}
