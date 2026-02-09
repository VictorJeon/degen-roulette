'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useProgram } from './useProgram';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { MULTIPLIERS, CHAMBERS } from '@/lib/constants';
import { getPublicKey, getAnchorWallet, isTestMode } from '@/lib/testMode';

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
  const walletFromHook = useAnchorWallet();
  const wallet = getAnchorWallet(walletFromHook);
  const { publicKey: walletPublicKey } = useWallet();
  const effectivePublicKey = getPublicKey(walletPublicKey);

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

      if (isTestMode()) {
        // In test mode, skip on-chain TX — the API mock handles game state
        console.log('[testMode] Skipping on-chain TX, using mock game:', gameId);

        // Confirm the game with a fake TX signature (must await to avoid race)
        await fetch('/api/game/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, txSignature: 'test-tx-' + gameId }),
        });
      } else {
        // Step 2: Send start_game TX with seed_hash
        const betAmountLamports = new BN(Math.round(betAmount * LAMPORTS_PER_SOL));

        // Retry blockhash fetch up to 3 times for mobile network stability
        const connection = program.provider.connection;
        let blockhash;
        for (let i = 0; i < 3; i++) {
          try {
            const bh = await connection.getLatestBlockhash('confirmed');
            blockhash = bh;
            break;
          } catch (err) {
            console.warn(`[useGame] Blockhash fetch attempt ${i + 1} failed:`, err);
            if (i === 2) {
              throw new Error('Network error: Could not connect to Solana. Please check your connection and try again.');
            }
            await new Promise(r => setTimeout(r, 1000));
          }
        }

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
      }

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
      // Convert network errors to user-friendly messages
      let errorMessage = err.message || 'Failed to start game';
      if (err instanceof TypeError && err.message.includes('Load failed')) {
        errorMessage = 'Network error: Please check your connection and try again.';
      }
      setError(errorMessage);
      setGameState(prev => ({ ...prev, status: 'idle' }));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [wallet, program, gamePda, houseConfigPda, houseVaultPda, playerStatsPda]);

  const pullTrigger = useCallback(async () => {
    if (!gameState.gameId) throw new Error('No active game');

    setIsLoading(true);
    setError(null);

    try {
      // Call API for server-side check
      const res = await fetch('/api/game/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameState.gameId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Pull failed');
      }

      const data = await res.json();

      if (data.survived) {
        // Survived → update state
        setGameState(prev => {
          const mult = MULTIPLIERS[data.round - 1];
          return {
            ...prev,
            roundsSurvived: data.round,
            currentMultiplier: mult,
            potentialWin: (prev.betAmount ?? 0) * mult,
          };
        });
        return { survived: true, round: data.round };
      } else {
        // Died → REKT state
        setGameState(prev => ({
          ...prev,
          status: 'lost',
          roundsSurvived: data.round,
          bulletPosition: data.bulletPosition,
          payout: data.settleResult.payout / LAMPORTS_PER_SOL,
          serverSeed: data.settleResult.serverSeed,
        }));
        return { survived: false, round: data.round, bulletPosition: data.bulletPosition };
      }
    } catch (err: any) {
      console.error('pullTrigger error:', err);
      setError(err.message || 'Failed to pull trigger');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [gameState.gameId]);

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
          // roundsSurvived removed - server uses DB current_round
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
    if (!effectivePublicKey) return;
    const checkActive = async () => {
      try {
        const res = await fetch(`/api/game/active/${effectivePublicKey.toBase58()}`);
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
  }, [effectivePublicKey]);

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
