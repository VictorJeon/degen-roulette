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
    <div className="stats-grid">
      <div className="stat-card">
        <span className="label">BET</span>
        <span className="value">{betAmount.toFixed(3)}</span>
        <span className="unit">SOL</span>
      </div>
      <div className="stat-card">
        <span className="label">MULTIPLIER</span>
        <span className="value accent">{currentMultiplier.toFixed(2)}x</span>
      </div>
      <div className="stat-card">
        <span className="label">POTENTIAL</span>
        <span className="value success">{potentialWin.toFixed(3)}</span>
        <span className="unit">SOL</span>
      </div>
      <div className="stat-card danger-card">
        <span className="label">DEATH</span>
        <span className="value danger">{deathOdds}%</span>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          width: 100%;
          margin-bottom: 0.6rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: 
            linear-gradient(180deg, rgba(0, 20, 0, 0.6) 0%, rgba(0, 12, 0, 0.8) 100%);
          border: 1px solid var(--border-neon);
          border-radius: 4px;
          padding: 8px 6px;
          text-align: center;
          position: relative;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 6px;
          height: 6px;
          border-top: 1px solid var(--neon);
          border-left: 1px solid var(--neon);
          opacity: 0.5;
        }

        .danger-card {
          border-color: rgba(255, 0, 64, 0.3);
        }

        .danger-card::before {
          border-color: var(--danger);
        }

        .label {
          font-family: var(--pixel-font);
          font-size: 0.38rem;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .value {
          font-family: var(--pixel-font);
          font-size: 0.65rem;
          color: var(--text-primary);
        }

        .unit {
          font-family: var(--pixel-font);
          font-size: 0.32rem;
          color: var(--text-dim);
          margin-top: -2px;
        }

        .value.accent {
          color: var(--neon);
          text-shadow: 0 0 8px var(--neon-glow), 0 0 15px var(--neon-glow-soft);
        }

        .value.success {
          color: var(--success);
          text-shadow: 0 0 8px var(--success-glow);
        }

        .value.danger {
          color: var(--danger);
          text-shadow: 0 0 8px var(--danger-glow);
        }

        @media (max-width: 768px) {
          .stats-grid {
            gap: 5px;
          }

          .stat-card {
            padding: 6px 4px;
          }

          .label {
            font-size: 0.34rem;
          }

          .value {
            font-size: 0.58rem;
          }

          .unit {
            font-size: 0.3rem;
          }
        }

        @media (max-width: 500px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 4px;
          }

          .stat-card {
            padding: 5px 3px;
          }

          .label {
            font-size: 0.32rem;
          }

          .value {
            font-size: 0.52rem;
          }

          .unit {
            font-size: 0.28rem;
          }
        }

        @media (max-width: 380px) {
          .label {
            font-size: 0.3rem;
          }

          .value {
            font-size: 0.48rem;
          }
        }
      `}</style>
    </div>
  );
}
