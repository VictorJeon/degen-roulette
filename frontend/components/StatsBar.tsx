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
          gap: 10px;
          width: 100%;
          margin-bottom: 1rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: var(--bg-tertiary);
          border: 1px solid #2f2f35;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }

        .label {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.52rem;
          color: #a1a1aa;
        }

        .value {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.82rem;
          color: #f4f4f5;
        }

        .value.accent {
          color: var(--accent);
          text-shadow: 0 0 10px rgba(163,230,53,0.45);
        }

        .value.success {
          color: var(--success);
          text-shadow: 0 0 10px rgba(0,255,136,0.35);
        }

        .value.danger {
          color: var(--danger);
          text-shadow: 0 0 10px rgba(255,59,59,0.35);
        }

        @media (max-width: 920px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
