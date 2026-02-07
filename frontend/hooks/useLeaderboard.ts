'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';

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
  const wallet = useAnchorWallet();

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await res.json();

      const entries: LeaderboardEntry[] = data.leaderboard.map((item: any) => {
        const shortWallet = item.wallet.slice(0, 4) + '...' + item.wallet.slice(-4);

        return {
          player: shortWallet,
          fullAddress: item.wallet,
          totalProfit: item.profitSol,
          gamesPlayed: item.totalGames,
          winRate: 0, // API doesn't provide winRate calculation
          isCurrentUser: wallet ? item.wallet === wallet.publicKey.toBase58() : false,
        };
      });

      setLeaderboard(entries);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setLeaderboard([]); // Graceful degradation
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, refresh: fetchLeaderboard };
}
