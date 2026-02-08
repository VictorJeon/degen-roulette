'use client';

interface ResultOverlayProps {
  won: boolean;
  betAmount: number;
  payout: number;
  multiplier: number;
  roundsSurvived: number;
  onNewGame: () => void;
}

export function ResultOverlay({
  won,
  betAmount,
  payout,
  multiplier,
  roundsSurvived,
  onNewGame,
}: ResultOverlayProps) {
  const profit = payout - betAmount;

  return (
    <div className={`result-overlay ${won ? 'won' : 'lost'}`}>
      <div className="result-content">
        <h2 className="result-title">{won ? 'YOU LIVE.' : 'YOU DIED.'}</h2>

        <div className="result-stats-grid">
          {won ? (
            <>
              <div className="result-stat">
                <span className="stat-label">PAYOUT</span>
                <span className="stat-value success">+{payout.toFixed(3)} SOL</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">PROFIT</span>
                <span className="stat-value accent">+{profit.toFixed(3)} SOL</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">MULTIPLIER</span>
                <span className="stat-value">{multiplier.toFixed(2)}x</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">ROUNDS</span>
                <span className="stat-value">{roundsSurvived}</span>
              </div>
            </>
          ) : (
            <>
              <div className="result-stat">
                <span className="stat-label">DIED AT</span>
                <span className="stat-value danger">ROUND {roundsSurvived + 1}</span>
              </div>
              <div className="result-stat">
                <span className="stat-label">LOST</span>
                <span className="stat-value danger">-{betAmount.toFixed(3)} SOL</span>
              </div>
            </>
          )}
        </div>

        <button className="play-again-btn" onClick={onNewGame}>
          PLAY AGAIN
        </button>
      </div>

      <style jsx>{`
        .result-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.92);
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }

        .result-overlay.lost .result-content {
          animation: shake 0.5s ease-in-out;
        }

        .result-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 2.5rem 3rem;
          background: var(--bg-panel);
          border: 2px solid;
          border-radius: 10px;
          min-width: 380px;
        }

        .result-overlay.won .result-content {
          border-color: var(--success);
          box-shadow: 0 0 40px var(--success-glow), inset 0 0 30px var(--neon-green-soft);
        }

        .result-overlay.lost .result-content {
          border-color: var(--danger);
          box-shadow: 0 0 40px var(--danger-glow), inset 0 0 30px rgba(255, 0, 64, 0.1);
        }

        .result-title {
          font-family: var(--pixel-font);
          font-size: 2.2rem;
          margin: 0;
          letter-spacing: 4px;
        }

        .result-overlay.won .result-title {
          color: var(--success);
          text-shadow: 0 0 30px var(--success-glow);
        }

        .result-overlay.lost .result-title {
          color: var(--danger);
          text-shadow: 0 0 30px var(--danger-glow);
          animation: flicker 0.3s step-end 3;
        }

        .result-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .result-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          padding: 0.8rem 1rem;
          background: rgba(0, 20, 0, 0.4);
          border: 1px solid var(--border-dim);
          border-radius: 6px;
        }

        .stat-label {
          font-family: var(--pixel-font);
          font-size: 0.5rem;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        .stat-value {
          font-family: var(--pixel-font);
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .stat-value.success {
          color: var(--success);
          text-shadow: 0 0 12px var(--success-glow);
        }

        .stat-value.accent {
          color: var(--neon-green);
          text-shadow: 0 0 12px var(--neon-green-glow);
        }

        .stat-value.danger {
          color: var(--danger);
          text-shadow: 0 0 12px var(--danger-glow);
        }

        .play-again-btn {
          font-family: var(--pixel-font);
          font-size: 0.85rem;
          padding: 1rem 2.5rem;
          background: transparent;
          border: 2px solid var(--neon-green);
          border-radius: 6px;
          color: var(--neon-green);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-top: 0.5rem;
          box-shadow: 0 0 25px var(--neon-green-soft), inset 0 0 20px var(--neon-green-soft);
        }

        .play-again-btn:hover {
          background: rgba(0, 255, 65, 0.1);
          box-shadow: 0 0 40px var(--neon-green-glow), inset 0 0 30px var(--neon-green-soft);
          transform: translateY(-2px);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-8px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(8px);
          }
        }

        @keyframes flicker {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .result-content {
            min-width: auto;
            width: 90%;
            padding: 2rem;
          }

          .result-title {
            font-size: 1.6rem;
          }

          .stat-value {
            font-size: 0.8rem;
          }

          .play-again-btn {
            font-size: 0.75rem;
            padding: 0.8rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
