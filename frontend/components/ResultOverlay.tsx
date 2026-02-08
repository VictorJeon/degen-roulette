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
        {/* Corner decorations */}
        <div className="corner corner-tl" />
        <div className="corner corner-tr" />
        <div className="corner corner-bl" />
        <div className="corner corner-br" />

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
              <div className="result-stat wide">
                <span className="stat-label">DIED AT</span>
                <span className="stat-value danger">ROUND {roundsSurvived + 1}</span>
              </div>
              <div className="result-stat wide">
                <span className="stat-label">LOST</span>
                <span className="stat-value danger">-{betAmount.toFixed(3)} SOL</span>
              </div>
            </>
          )}
        </div>

        <button className="play-again-btn" onClick={onNewGame}>
          <span className="btn-text">PLAY AGAIN</span>
          <span className="btn-glow" />
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
          background: rgba(0, 3, 0, 0.94);
          z-index: 1000;
          animation: fadeIn 0.35s ease-out;
        }

        .result-overlay.lost .result-content {
          animation: shake 0.5s ease-in-out;
        }

        .result-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          padding: 2.2rem 2.8rem;
          background: 
            linear-gradient(180deg, rgba(10, 18, 10, 0.98) 0%, rgba(5, 10, 5, 0.99) 100%);
          border: 2px solid;
          border-radius: 8px;
          min-width: 360px;
          position: relative;
        }

        /* Corner decorations */
        .corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border: 1px solid;
          opacity: 0.7;
        }

        .corner-tl { top: 8px; left: 8px; border-right: none; border-bottom: none; }
        .corner-tr { top: 8px; right: 8px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 8px; left: 8px; border-right: none; border-top: none; }
        .corner-br { bottom: 8px; right: 8px; border-left: none; border-top: none; }

        .result-overlay.won .result-content {
          border-color: var(--success);
          border-width: 2px;
          box-shadow:
            0 0 25px var(--success-glow),
            0 0 50px rgba(0, 255, 65, 0.25),
            0 0 80px rgba(0, 255, 65, 0.15),
            0 0 120px rgba(0, 255, 65, 0.08),
            inset 0 0 40px rgba(0, 255, 65, 0.06);
        }

        .result-overlay.won .corner {
          border-color: var(--success);
        }

        .result-overlay.lost .result-content {
          border-color: var(--danger);
          border-width: 2px;
          box-shadow:
            0 0 25px var(--danger-glow),
            0 0 50px rgba(255, 0, 64, 0.25),
            0 0 80px rgba(255, 0, 64, 0.15),
            0 0 120px rgba(255, 0, 64, 0.08),
            inset 0 0 40px rgba(255, 0, 64, 0.06);
        }

        .result-overlay.lost .corner {
          border-color: var(--danger);
        }

        .result-title {
          font-family: var(--pixel-font);
          font-size: 2.8rem;
          margin: 0;
          letter-spacing: 6px;
        }

        .result-overlay.won .result-title {
          color: var(--success);
          text-shadow:
            0 0 15px var(--success),
            0 0 30px var(--success-glow),
            0 0 60px var(--success-glow),
            0 0 90px rgba(0, 255, 65, 0.3),
            0 0 120px rgba(0, 255, 65, 0.15);
          animation: textGlow 1.5s ease-in-out infinite;
        }

        .result-overlay.lost .result-title {
          color: var(--danger);
          text-shadow:
            0 0 15px var(--danger),
            0 0 30px var(--danger-glow),
            0 0 60px var(--danger-glow),
            0 0 90px rgba(255, 0, 64, 0.2);
          animation: flicker 0.15s step-end 4;
        }

        .result-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.8rem;
        }

        .result-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 0.7rem 0.9rem;
          background: 
            linear-gradient(180deg, rgba(0, 20, 0, 0.5) 0%, rgba(0, 12, 0, 0.7) 100%);
          border: 1px solid var(--border-dim);
          border-radius: 4px;
          min-width: 120px;
        }

        .result-stat.wide {
          grid-column: span 2;
          justify-self: center;
          min-width: 200px;
        }

        .stat-label {
          font-family: var(--pixel-font);
          font-size: 0.46rem;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        .stat-value {
          font-family: var(--pixel-font);
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .stat-value.success {
          color: var(--success);
          text-shadow: 0 0 10px var(--success-glow), 0 0 20px rgba(0, 255, 65, 0.2);
        }

        .stat-value.accent {
          color: var(--neon);
          text-shadow: 0 0 10px var(--neon-glow), 0 0 20px rgba(0, 255, 65, 0.2);
        }

        .stat-value.danger {
          color: var(--danger);
          text-shadow: 0 0 10px var(--danger-glow), 0 0 20px rgba(255, 0, 64, 0.2);
        }

        .play-again-btn {
          font-family: var(--pixel-font);
          font-size: 1rem;
          padding: 1.15rem 3rem;
          background:
            linear-gradient(180deg, rgba(0, 40, 0, 0.8) 0%, rgba(0, 22, 0, 0.95) 100%);
          border: 3px solid var(--neon);
          border-radius: 4px;
          color: var(--neon);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
          letter-spacing: 5px;
          margin-top: 0.6rem;
          position: relative;
          overflow: hidden;
          min-width: 300px;

          box-shadow:
            0 0 15px var(--neon-glow),
            0 0 30px var(--neon-glow-soft),
            0 0 50px var(--neon-glow-subtle),
            0 0 70px var(--neon-glow-subtle),
            inset 0 0 25px var(--neon-glow-subtle),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);

          text-shadow:
            0 0 8px var(--neon),
            0 0 15px var(--neon-glow);
        }

        .btn-text {
          position: relative;
          z-index: 1;
        }

        .btn-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120%;
          height: 120%;
          transform: translate(-50%, -50%);
          background: radial-gradient(ellipse, var(--neon-glow-subtle) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .play-again-btn:hover {
          background:
            linear-gradient(180deg, rgba(0, 55, 0, 0.9) 0%, rgba(0, 35, 0, 0.98) 100%);
          border-color: var(--neon-bright);

          box-shadow:
            0 0 25px var(--neon-glow),
            0 0 50px var(--neon-glow-soft),
            0 0 80px var(--neon-glow-soft),
            0 0 110px rgba(0, 255, 65, 0.15),
            inset 0 0 35px var(--neon-glow-soft),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);

          text-shadow:
            0 0 10px var(--neon),
            0 0 20px var(--neon-glow),
            0 0 35px var(--neon-glow-soft);

          transform: translateY(-2px);
        }

        .play-again-btn:hover .btn-glow {
          opacity: 1;
        }

        .play-again-btn:active {
          transform: translateY(0);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes textGlow {
          0%, 100% { 
            text-shadow: 
              0 0 10px var(--success),
              0 0 20px var(--success-glow),
              0 0 40px var(--success-glow),
              0 0 60px rgba(0, 255, 65, 0.3);
          }
          50% { 
            text-shadow: 
              0 0 15px var(--success),
              0 0 30px var(--success-glow),
              0 0 50px var(--success-glow),
              0 0 80px rgba(0, 255, 65, 0.4);
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
            opacity: 0.6;
          }
        }

        @media (max-width: 768px) {
          .result-content {
            min-width: auto;
            width: 90%;
            padding: 1.8rem;
          }

          .result-title {
            font-size: 1.5rem;
            letter-spacing: 3px;
          }

          .stat-value {
            font-size: 0.75rem;
          }

          .play-again-btn {
            font-size: 0.7rem;
            padding: 0.75rem 1.5rem;
            letter-spacing: 2px;
          }
        }
      `}</style>
    </div>
  );
}
