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
        <h2 className="result-title">{won ? 'ESCAPED!' : 'REKT'}</h2>

        {won ? (
          <>
            <div className="result-stat">
              <span className="stat-label">PAYOUT</span>
              <span className="stat-value success">+{payout.toFixed(2)} SOL</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">PROFIT</span>
              <span className="stat-value accent">+{profit.toFixed(2)} SOL</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">MULTIPLIER</span>
              <span className="stat-value">{multiplier.toFixed(2)}x</span>
            </div>
          </>
        ) : (
          <>
            <div className="result-stat">
              <span className="stat-label">DIED AT ROUND</span>
              <span className="stat-value danger">{roundsSurvived + 1}</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">LOST</span>
              <span className="stat-value danger">-{betAmount.toFixed(2)} SOL</span>
            </div>
          </>
        )}

        <button className="btn-primary" onClick={onNewGame}>
          {won ? 'RUN IT BACK' : 'NEW GAME'}
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
          background: rgba(0, 0, 0, 0.95);
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
          gap: 2rem;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 3px solid;
          border-radius: 12px;
          min-width: 400px;
        }

        .result-overlay.won .result-content {
          border-color: var(--success);
          box-shadow: 0 0 30px var(--success);
        }

        .result-overlay.lost .result-content {
          border-color: var(--danger);
          box-shadow: 0 0 30px var(--danger);
        }

        .result-title {
          font-family: 'Press Start 2P', monospace;
          font-size: 3rem;
          margin: 0;
          letter-spacing: 4px;
        }

        .result-overlay.won .result-title {
          color: var(--success);
          text-shadow: 0 0 20px var(--success);
        }

        .result-overlay.lost .result-title {
          color: var(--danger);
          text-shadow: 0 0 20px var(--danger);
        }

        .result-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-label {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 2px;
        }

        .stat-value {
          font-family: 'Press Start 2P', monospace;
          font-size: 1.5rem;
          color: white;
        }

        .stat-value.success {
          color: var(--success);
          text-shadow: 0 0 15px var(--success);
        }

        .stat-value.accent {
          color: var(--accent);
          text-shadow: 0 0 15px var(--accent);
        }

        .stat-value.danger {
          color: var(--danger);
          text-shadow: 0 0 15px var(--danger);
        }

        .btn-primary {
          font-family: 'Press Start 2P', monospace;
          font-size: 1rem;
          padding: 1rem 2rem;
          background: var(--accent);
          color: black;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px var(--accent);
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
            transform: translateX(-10px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(10px);
          }
        }

        @media (max-width: 768px) {
          .result-content {
            min-width: auto;
            width: 90%;
            padding: 2rem;
          }

          .result-title {
            font-size: 2rem;
          }

          .stat-value {
            font-size: 1.2rem;
          }

          .btn-primary {
            font-size: 0.9rem;
            padding: 0.8rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
