'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useProgram } from './useProgram';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { MULTIPLIERS, CHAMBERS } from '@/lib/constants';

interface GameState {
  status: 'idle' | 'waiting_start' | 'active' | 'settling' | 'won' | 'lost';
  betAmount: number | null;
  roundsSurvived: number;
  currentMultiplier: number;
  potentialWin: number;
  bulletPosition: number | null;
  payout: number | null;
  gameId: number | null;
  serverSeed: string | null;
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
    gameId: null,
    serverSeed: null,
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

  const startGame = useCallback(async (betAmount: number) => {
    if (!wallet || !gamePda || !program || !houseConfigPda || !houseVaultPda || !playerStatsPda) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setGameState(prev => ({ ...prev, status: 'waiting_start', betAmount }));

    try {
      // Step 1: Get server seed hash from API
      const seedRes = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerWallet: wallet.publicKey.toBase58() }),
      });
      const seedData = await seedRes.json();
      if (!seedRes.ok) throw new Error(seedData.error || 'Failed to get seed');

      const { gameId, seedHashBytes } = seedData;

      // Step 2: Send start_game TX with seed_hash
      const betAmountLamports = new BN(Math.round(betAmount * LAMPORTS_PER_SOL));

      const tx = await program.methods
        .startGame(betAmountLamports, seedHashBytes)
        .accounts({
          player: wallet.publicKey,
          game: gamePda,
          houseConfig: houseConfigPda,
          houseVault: houseVaultPda,
          playerStats: playerStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('start_game TX:', tx);

      // Step 3: Confirm TX with API
      fetch('/api/game/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, txSignature: tx }),
      }).catch(err => console.warn('confirm API error:', err));

      setGameState(prev => ({
        ...prev,
        status: 'active',
        gameId,
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
  }, [wallet, program, gamePda, houseConfigPda, houseVaultPda, playerStatsPda]);

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
    if (!gameState.gameId || gameState.roundsSurvived < 1) {
      throw new Error('Cannot settle: no active game or no pulls');
    }

    setIsLoading(true);
    setError(null);
    setGameState(prev => ({ ...prev, status: 'settling' }));

    try {
      const res = await fetch('/api/game/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: gameState.gameId,
          roundsSurvived: gameState.roundsSurvived,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Settlement failed');

      const resolvedStatus = data.cancelled ? 'lost' : (data.won ? 'won' : 'lost');
      setGameState(prev => ({
        ...prev,
        status: resolvedStatus,
        roundsSurvived: data.roundsSurvived ?? prev.roundsSurvived,
        bulletPosition: data.bulletPosition,
        payout: data.payout / LAMPORTS_PER_SOL,
        serverSeed: data.serverSeed,
      }));
    } catch (err: any) {
      console.error('settle error:', err);
      setError(err.message || 'Failed to settle game');
      setGameState(prev => ({ ...prev, status: 'active' }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [gameState.gameId, gameState.roundsSurvived]);

  const resetGame = useCallback(() => {
    setGameState({
      status: 'idle',
      betAmount: null,
      roundsSurvived: 0,
      currentMultiplier: MULTIPLIERS[0],
      potentialWin: 0,
      bulletPosition: null,
      payout: null,
      gameId: null,
      serverSeed: null,
    });
    setError(null);
  }, []);

  // Check for existing active game on page load
  useEffect(() => {
    if (!wallet) return;
    const checkActive = async () => {
      try {
        const res = await fetch(`/api/game/active/${wallet.publicKey.toBase58()}`);
        const data = await res.json();
        if (data.hasActiveGame) {
          setGameState(prev => ({
            ...prev,
            status: 'active',
            gameId: data.gameId,
            betAmount: data.betAmount / LAMPORTS_PER_SOL,
            roundsSurvived: 0,
            currentMultiplier: MULTIPLIERS[0],
            potentialWin: (data.betAmount / LAMPORTS_PER_SOL) * MULTIPLIERS[0],
          }));
        }
      } catch {
        // No active game or API unavailable
      }
    };
    checkActive();
  }, [wallet]);

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
