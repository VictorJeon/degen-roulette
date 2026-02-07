'use client';

import { useState, useCallback, useEffect } from 'react';
import { useProgram } from './useProgram';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface LeaderboardEntry {
  player: string;
  fullAddress: string;
  totalProfit: number;
  gamesPlayed: number;
  winRate: number;
  isCurrentUser: boolean;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { program } = useProgram();
  const wallet = useAnchorWallet();

  const fetchLeaderboard = useCallback(async () => {
    if (!program) return;

    setIsLoading(true);
    try {
      const accounts = await (program.account as any).playerStats.all();

      const entries: LeaderboardEntry[] = accounts
        .map((acc: any) => {
          const playerAddr = acc.account.player.toBase58();
          const shortPlayer = playerAddr.slice(0, 4) + '...' + playerAddr.slice(-4);
          const totalProfit = Number(acc.account.totalProfit) / LAMPORTS_PER_SOL;
          const gamesPlayed = Number(acc.account.totalGames);
          const totalWon = Number(acc.account.totalWon);
          const totalWagered = Number(acc.account.totalWagered);

          const winRate = totalWagered > 0
            ? ((totalWon / totalWagered) * 100)
            : 0;

          return {
            player: shortPlayer,
            fullAddress: playerAddr,
            totalProfit,
            gamesPlayed,
            winRate,
            isCurrentUser: wallet ? playerAddr === wallet.publicKey.toBase58() : false,
          };
        })
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.totalProfit - a.totalProfit)
        .slice(0, 20);

      setLeaderboard(entries);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [program, wallet]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, refresh: fetchLeaderboard };
}
