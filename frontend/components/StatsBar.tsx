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
    <div className="stats-grid">
      <div className="stat-card">
        <span className="label">BET</span>
        <span className="value">{betAmount.toFixed(3)} SOL</span>
      </div>
      <div className="stat-card">
        <span className="label">MULTIPLIER</span>
        <span className="value accent">{currentMultiplier.toFixed(2)}x</span>
      </div>
      <div className="stat-card">
        <span className="label">POTENTIAL</span>
        <span className="value success">{potentialWin.toFixed(3)} SOL</span>
      </div>
      <div className="stat-card">
        <span className="label">DEATH ODDS</span>
        <span className="value danger">{deathOdds}%</span>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          width: 100%;
          margin-bottom: 0.8rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: rgba(0, 20, 0, 0.5);
          border: 1px solid var(--border-neon);
          border-radius: 6px;
          padding: 10px 8px;
          text-align: center;
        }

        .label {
          font-family: var(--pixel-font);
          font-size: 0.42rem;
          color: var(--text-muted);
        }

        .value {
          font-family: var(--pixel-font);
          font-size: 0.65rem;
          color: var(--text-primary);
        }

        .value.accent {
          color: var(--neon-green);
          text-shadow: 0 0 10px var(--neon-green-glow);
        }

        .value.success {
          color: var(--success);
          text-shadow: 0 0 10px var(--success-glow);
        }

        .value.danger {
          color: var(--danger);
          text-shadow: 0 0 10px var(--danger-glow);
        }

        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
