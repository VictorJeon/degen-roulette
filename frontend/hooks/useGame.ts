'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useProgram } from './useProgram';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  ORAO_VRF_PROGRAM_ID,
  ORAO_VRF_TREASURY,
  MULTIPLIERS,
  CHAMBERS
} from '@/lib/constants';

interface GameState {
  status: 'idle' | 'waiting_start' | 'active' | 'settling' | 'won' | 'lost';
  betAmount: number | null;
  roundsSurvived: number;
  currentMultiplier: number;
  potentialWin: number;
  bulletPosition: number | null;
  payout: number | null;
  vrfSeed: Uint8Array | null;
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    betAmount: null,
    roundsSurvived: 0,
    currentMultiplier: MULTIPLIERS[0],
    potentialWin: 0,
    bulletPosition: null,
    payout: null,
    vrfSeed: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { program } = useProgram();
  const wallet = useAnchorWallet();

  const gamePda = useMemo(() => {
    if (!wallet || !program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('game'), wallet.publicKey.toBuffer()],
      program.programId
    )[0];
  }, [wallet, program]);

  const houseConfigPda = useMemo(() => {
    if (!program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('house_config')],
      program.programId
    )[0];
  }, [program]);

  const houseVaultPda = useMemo(() => {
    if (!program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('house_vault')],
      program.programId
    )[0];
  }, [program]);

  const playerStatsPda = useMemo(() => {
    if (!wallet || !program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('player_stats'), wallet.publicKey.toBuffer()],
      program.programId
    )[0];
  }, [wallet, program]);

  const vrfConfigPda = useMemo(() => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('orao-vrf-network-configuration')],
      ORAO_VRF_PROGRAM_ID
    )[0];
  }, []);

  const getRandomnessPda = useCallback((seed: Uint8Array) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('orao-vrf-randomness-request'), seed],
      ORAO_VRF_PROGRAM_ID
    )[0];
  }, []);

  const startGame = useCallback(async (betAmount: number) => {
    if (!wallet || !gamePda || !program || !houseConfigPda || !houseVaultPda || !playerStatsPda) {
      throw new Error('Wallet not connected or PDAs not initialized');
    }

    setIsLoading(true);
    setError(null);
    setGameState(prev => ({ ...prev, status: 'waiting_start', betAmount }));

    try {
      const betAmountLamports = new BN(betAmount * LAMPORTS_PER_SOL);

      const tempSeed = new Uint8Array(32);
      crypto.getRandomValues(tempSeed);
      const tempRandomPda = getRandomnessPda(tempSeed);

      const tx = await program.methods
        .startGame(betAmountLamports)
        .accounts({
          player: wallet.publicKey,
          game: gamePda,
          houseConfig: houseConfigPda,
          houseVault: houseVaultPda,
          playerStats: playerStatsPda,
          vrfConfig: vrfConfigPda,
          vrfTreasury: ORAO_VRF_TREASURY,
          random: tempRandomPda,
          vrf: ORAO_VRF_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('start_game TX:', tx);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const gameAccount = await (program.account as any).gameState.fetch(gamePda);
      const vrfSeed = new Uint8Array(gameAccount.vrfSeed as any);

      setGameState(prev => ({
        ...prev,
        status: 'active',
        vrfSeed,
        roundsSurvived: 0,
        currentMultiplier: MULTIPLIERS[0],
        potentialWin: betAmount * MULTIPLIERS[0],
      }));
    } catch (err: any) {
      console.error('start_game error:', err);
      setError(err.message || 'Failed to start game');
      setGameState(prev => ({ ...prev, status: 'idle' }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, program, gamePda, houseConfigPda, houseVaultPda, playerStatsPda, vrfConfigPda, getRandomnessPda]);

  const pullTrigger = useCallback(() => {
    setGameState(prev => {
      const newRounds = prev.roundsSurvived + 1;
      if (newRounds > 5) return prev;

      const mult = MULTIPLIERS[newRounds - 1];
      return {
        ...prev,
        roundsSurvived: newRounds,
        currentMultiplier: mult,
        potentialWin: (prev.betAmount ?? 0) * mult,
      };
    });
  }, []);

  const settleGame = useCallback(async () => {
    if (!wallet || !gamePda || !program || !gameState.vrfSeed || !houseConfigPda || !houseVaultPda || !playerStatsPda) {
      throw new Error('Cannot settle: missing required data');
    }

    setIsLoading(true);
    setError(null);
    setGameState(prev => ({ ...prev, status: 'settling' }));

    try {
      const randomPda = getRandomnessPda(gameState.vrfSeed);

      const tx = await program.methods
        .settleGame(gameState.roundsSurvived)
        .accounts({
          player: wallet.publicKey,
          game: gamePda,
          houseConfig: houseConfigPda,
          houseVault: houseVaultPda,
          playerStats: playerStatsPda,
          random: randomPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('settle_game TX:', tx);

      // Update leaderboard via API (fire-and-forget)
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: wallet.publicKey.toBase58(),
          txSignature: tx,
        }),
      }).catch(err => {
        console.warn('Leaderboard API update failed:', err);
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      const gameAccount = await (program.account as any).gameState.fetch(gamePda);

      const won = 'won' in gameAccount.status;
      const bulletPosition = gameAccount.bulletPosition;
      const payout = gameAccount.payout ? Number(gameAccount.payout) / LAMPORTS_PER_SOL : 0;

      setGameState(prev => ({
        ...prev,
        status: won ? 'won' : 'lost',
        bulletPosition,
        payout,
      }));
    } catch (err: any) {
      console.error('settle_game error:', err);
      setError(err.message || 'Failed to settle game');
      setGameState(prev => ({ ...prev, status: 'idle' }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, program, gamePda, gameState.vrfSeed, gameState.roundsSurvived, houseConfigPda, houseVaultPda, playerStatsPda, getRandomnessPda]);

  const resetGame = useCallback(() => {
    setGameState({
      status: 'idle',
      betAmount: null,
      roundsSurvived: 0,
      currentMultiplier: MULTIPLIERS[0],
      potentialWin: 0,
      bulletPosition: null,
      payout: null,
      vrfSeed: null,
    });
    setError(null);
  }, []);

  useEffect(() => {
    if (!program || !gamePda) return;

    const checkExistingGame = async () => {
      try {
        const gameAccount = await (program.account as any).gameState.fetch(gamePda);
        if ('active' in gameAccount.status) {
          const vrfSeed = new Uint8Array(gameAccount.vrfSeed as any);
          const betAmount = Number(gameAccount.betAmount) / LAMPORTS_PER_SOL;
          const roundsSurvived = Number(gameAccount.roundsSurvived);
          const mult = roundsSurvived >= 1 ? MULTIPLIERS[roundsSurvived - 1] : MULTIPLIERS[0];

          setGameState({
            status: 'active',
            betAmount,
            roundsSurvived,
            currentMultiplier: mult,
            potentialWin: betAmount * mult,
            bulletPosition: null,
            payout: null,
            vrfSeed,
          });
        }
      } catch (err) {
        // No active game
      }
    };

    checkExistingGame();
  }, [program, gamePda]);

  return {
    gameState,
    isLoading,
    error,
    startGame,
    pullTrigger,
    settleGame,
    resetGame,
  };
}
