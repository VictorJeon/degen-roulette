'use client';

import { useState, useEffect } from 'react';
import { useProgram } from './useProgram';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface FeedItem {
  player: string;
  betAmount: number;
  roundsSurvived: number;
  won: boolean;
  payout: number;
  profit: number;
  timestamp: Date;
}

export function useLiveFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const { program } = useProgram();

  useEffect(() => {
    if (!program) return;

    const listener = program.addEventListener('GameSettled', (event: any, slot: number) => {
      const playerAddr = event.player.toBase58();
      const shortPlayer = playerAddr.slice(0, 4) + '...' + playerAddr.slice(-4);

      const betAmount = Number(event.betAmount) / LAMPORTS_PER_SOL;
      const payout = Number(event.payout) / LAMPORTS_PER_SOL;
      const won = event.won;
      const profit = won ? payout - betAmount : -betAmount;

      const item: FeedItem = {
        player: shortPlayer,
        betAmount,
        roundsSurvived: event.roundsSurvived,
        won,
        payout,
        profit,
        timestamp: new Date(),
      };

      setFeed(prev => [item, ...prev].slice(0, 20));
    });

    return () => {
      program.removeEventListener(listener);
    };
  }, [program]);

  return { feed };
}
