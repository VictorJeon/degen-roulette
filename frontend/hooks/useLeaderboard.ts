'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import { getAnchorWallet } from '@/lib/testMode';

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
  const walletFromHook = useAnchorWallet();
  const wallet = getAnchorWallet(walletFromHook);
  const searchParams = useSearchParams();
  const isTestMode = searchParams.get('testMode') === 'true';

  const fetchLeaderboard = useCallback(async () => {
    // Test mode에서는 API 호출 건너뛰기
    if (isTestMode) {
      console.log('[TEST MODE] Leaderboard fetch disabled');
      return;
    }

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
  }, [wallet, isTestMode]);

  useEffect(() => {
    // Test mode에서는 polling도 비활성화
    if (isTestMode) {
      return;
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, isTestMode]);

  return { leaderboard, isLoading, refresh: fetchLeaderboard };
}
