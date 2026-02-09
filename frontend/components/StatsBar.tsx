'use client';

import { CHAMBERS } from '@/lib/constants';

interface StatsBarProps {
  betAmount: number;
  currentMultiplier: number;
  potentialWin: number;
  roundsSurvived: number;
}

export function StatsBar({ betAmount, currentMultiplier, potentialWin, roundsSurvived }: StatsBarProps) {
  const deathOdds = (((roundsSurvived + 1) / CHAMBERS) * 100).toFixed(0);

  return (
    <div className="grid grid-cols-4 max-[500px]:grid-cols-2 gap-1.5 w-full mb-2.5">
      <div className="flex flex-col items-center gap-0.5 bg-bg-surface border border-border-default rounded-lg p-2 text-center">
        <span className="font-display text-[0.625rem] text-gray-200 tracking-wide">BET</span>
        <span className="font-display text-xs text-white">{betAmount.toFixed(3)}</span>
        <span className="font-display text-[0.5rem] text-gray-300 -mt-0.5">SOL</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 bg-bg-surface border border-border-default rounded-lg p-2 text-center">
        <span className="font-display text-[0.625rem] text-gray-200 tracking-wide">MULTIPLIER</span>
        <span className="font-display text-xs text-accent">{currentMultiplier.toFixed(2)}x</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 bg-bg-surface border border-border-default rounded-lg p-2 text-center">
        <span className="font-display text-[0.625rem] text-gray-200 tracking-wide">POTENTIAL</span>
        <span className="font-display text-xs text-accent">{potentialWin.toFixed(3)}</span>
        <span className="font-display text-[0.5rem] text-gray-300 -mt-0.5">SOL</span>
      </div>
      <div className="flex flex-col items-center gap-0.5 bg-bg-surface border border-danger/30 rounded-lg p-2 text-center">
        <span className="font-display text-[0.625rem] text-gray-200 tracking-wide">DEATH</span>
        <span className="font-display text-xs text-danger">{deathOdds}%</span>
      </div>
    </div>
  );
}
