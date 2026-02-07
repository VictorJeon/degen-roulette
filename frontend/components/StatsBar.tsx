'use client';

import { CHAMBERS } from '@/lib/constants';

interface StatsBarProps {
  betAmount: number;
  currentMultiplier: number;
  potentialWin: number;
  roundsSurvived: number;
}

export function StatsBar({ betAmount, currentMultiplier, potentialWin, roundsSurvived }: StatsBarProps) {
  const deathOdds = (((roundsSurvived + 1) / CHAMBERS) * 100).toFixed(1);

  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="label">BET</span>
        <span className="value">{betAmount.toFixed(2)} SOL</span>
      </div>
      <div className="stat">
        <span className="label">MULTIPLIER</span>
        <span className="value accent">{currentMultiplier.toFixed(2)}x</span>
      </div>
      <div className="stat">
        <span className="label">WIN</span>
        <span className="value success">{potentialWin.toFixed(2)} SOL</span>
      </div>
      <div className="stat">
        <span className="label">DEATH</span>
        <span className="value danger">{deathOdds}%</span>
      </div>

      <style jsx>{`
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid var(--accent);
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: center;
        }

        .label {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 1px;
        }

        .value {
          font-family: 'Press Start 2P', monospace;
          font-size: 1rem;
          color: white;
        }

        .value.accent {
          color: var(--accent);
          text-shadow: 0 0 10px var(--accent);
        }

        .value.success {
          color: var(--success);
          text-shadow: 0 0 10px var(--success);
        }

        .value.danger {
          color: var(--danger);
          text-shadow: 0 0 10px var(--danger);
        }

        @media (max-width: 768px) {
          .stats-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
            padding: 1rem;
          }

          .label {
            font-size: 0.6rem;
          }

          .value {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
