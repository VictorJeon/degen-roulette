'use client';

import { useRef, useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { SoundEngine } from '@/lib/sound';
import BetPanel from './BetPanel';
import { StatsBar } from './StatsBar';
import { ResultOverlay } from './ResultOverlay';
import { MULTIPLIERS } from '@/lib/constants';

// Odds for each round (survival probability display)
const ROUND_ODDS = ['5/6', '4/5', '3/4', '2/3', '1/2'];

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h3>HOW TO PLAY</h3>
          <ol>
            <li>Enter BET amount and click START</li>
            <li>Select a chamber to load the bullet</li>
            <li>Cylinder spins → bullet position hidden</li>
            <li>PULL TRIGGER → fires top chamber</li>
            <li>If you survive, cylinder rotates one chamber</li>
            <li>CASH OUT anytime to collect winnings</li>
          </ol>
          <button className="mini-btn" onClick={onClose}>Close</button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-card {
          width: min(580px, 92vw);
          background:
            linear-gradient(180deg, rgba(12, 25, 12, 0.98) 0%, rgba(8, 18, 18, 0.99) 100%);
          border: 1px solid var(--border-neon-bright);
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          box-shadow:
            0 0 20px var(--neon-glow-soft),
            0 0 40px var(--neon-glow-subtle),
            0 0 60px var(--neon-glow-subtle),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 40px rgba(0, 255, 65, 0.04);
        }

        .modal-card::before,
        .modal-card::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid var(--neon);
          opacity: 0.8;
        }

        .modal-card::before {
          top: 6px;
          left: 6px;
          border-right: none;
          border-bottom: none;
        }

        .modal-card::after {
          bottom: 6px;
          right: 6px;
          border-left: none;
          border-top: none;
        }

        .modal-card h3 {
          margin: 0;
          font-family: var(--pixel-font);
          color: var(--neon);
          font-size: 0.85rem;
          text-shadow:
            0 0 10px var(--neon),
            0 0 20px var(--neon-glow),
            0 0 35px var(--neon-glow-soft);
          letter-spacing: 2px;
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 65, 0.15);
        }

        .modal-card ol {
          margin: 0;
          padding-left: 16px;
          color: var(--text-primary);
          line-height: 1.85;
          font-size: 0.88rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        }

        .modal-card li {
          margin-bottom: 0.4rem;
        }

        .mini-btn {
          font-family: var(--pixel-font);
          color: var(--neon);
          text-shadow: 0 0 8px var(--neon-glow), 0 0 15px var(--neon-glow-soft);
          font-size: 0.55rem;
          letter-spacing: 1px;
          background: transparent;
          border: 1px solid var(--border-neon);
          padding: 0.4rem 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 4px;
        }

        .mini-btn:hover {
          border-color: var(--neon);
          box-shadow: 0 0 10px var(--neon-glow-soft), inset 0 0 5px var(--neon-glow-subtle);
        }
      `}</style>
    </>
  );
}

function FairModal({ serverSeed, gameId, onClose }: { serverSeed: string | null; gameId: number | null; onClose: () => void }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h3>PROVABLY FAIR</h3>
          <p>At game start, a seed hash is committed on-chain. After settlement, the server seed is revealed for verification.</p>
          {gameId && <p className="mono">Game ID: {gameId}</p>}
          {serverSeed ? (
            <>
              <p className="mono">Server Seed (revealed):</p>
              <p className="mono seed">{serverSeed}</p>
            </>
          ) : (
            <p className="mono">Seed will be revealed after settlement.</p>
          )}
          <button className="mini-btn" onClick={onClose}>Close</button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-card {
          width: min(580px, 92vw);
          background:
            linear-gradient(180deg, rgba(12, 25, 12, 0.98) 0%, rgba(8, 18, 8, 0.99) 100%);
          border: 1px solid var(--border-neon-bright);
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          box-shadow:
            0 0 20px var(--neon-glow-soft),
            0 0 40px var(--neon-glow-subtle),
            0 0 60px var(--neon-glow-subtle),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 40px rgba(0, 255, 65, 0.04);
        }

        .modal-card::before,
        .modal-card::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid var(--neon);
          opacity: 0.8;
        }

        .modal-card::before {
          top: 6px;
          left: 6px;
          border-right: none;
          border-bottom: none;
        }

        .modal-card::after {
          bottom: 6px;
          right: 6px;
          border-left: none;
          border-top: none;
        }

        .modal-card h3 {
          margin: 0;
          font-family: var(--pixel-font);
          color: var(--neon);
          font-size: 0.85rem;
          text-shadow:
            0 0 10px var(--neon),
            0 0 20px var(--neon-glow),
            0 0 35px var(--neon-glow-soft);
          letter-spacing: 2px;
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 65, 0.15);
        }

        .modal-card p {
          margin: 0;
          color: var(--text-primary);
          line-height: 1.6;
          font-size: 0.85rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        }

        .modal-card p.mono {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .modal-card p.seed {
          background: rgba(0, 255, 65, 0.05);
          border: 1px solid var(--border-neon);
          border-radius: 4px;
          padding: 0.5rem;
          word-break: break-all;
          font-size: 0.7rem;
        }

        .mini-btn {
          font-family: var(--pixel-font);
          color: var(--neon);
          text-shadow: 0 0 8px var(--neon-glow), 0 0 15px var(--neon-glow-soft);
          font-size: 0.55rem;
          letter-spacing: 1px;
          background: transparent;
          border: 1px solid var(--border-neon);
          padding: 0.4rem 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 4px;
        }

        .mini-btn:hover {
          border-color: var(--neon);
          box-shadow: 0 0 10px var(--neon-glow-soft), inset 0 0 5px var(--neon-glow-subtle);
        }
      `}</style>
    </>
  );
}

// Decorative corner SVG component
function CornerDecor({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const transforms: Record<string, string> = {
    tl: '',
    tr: 'scale(-1, 1)',
    bl: 'scale(1, -1)',
    br: 'scale(-1, -1)',
  };
  
  return (
    <svg 
      className={`corner-decor corner-${position}`} 
      width="24" 
      height="24" 
      viewBox="0 0 24 24"
      style={{ transform: transforms[position] }}
    >
      <path 
        d="M0 0 L8 0 L8 2 L2 2 L2 8 L0 8 Z" 
        fill="currentColor"
        opacity="0.6"
      />
      <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

type CylinderPhase = 'selecting' | 'spinning' | 'ready';

export default function GameBoard() {
  const { gameState, isLoading, error, startGame, pullTrigger, settleGame, resetGame } = useGame();
  const soundRef = useRef<SoundEngine | null>(null);

  const [shakeScreen, setShakeScreen] = useState(false);
  const [showFlashSuccess, setShowFlashSuccess] = useState(false);
  const [showFlashDeath, setShowFlashDeath] = useState(false);
  const [cylinderRotation, setCylinderRotation] = useState(0);
  const [selectedChamber, setSelectedChamber] = useState<number | null>(null);
  const [cylinderPhase, setCylinderPhase] = useState<CylinderPhase>('selecting');
  const [isReloading, setIsReloading] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showFair, setShowFair] = useState(false);
  const [actionHint, setActionHint] = useState<string>('');
  const [bulletVisible, setBulletVisible] = useState(true);

  useEffect(() => {
    soundRef.current = new SoundEngine();
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSelectChamber = async (i: number) => {
    if (cylinderPhase !== 'selecting') return;

    setSelectedChamber(i);
    setBulletVisible(true);
    soundRef.current?.playBulletLoad();
    setActionHint(`CHAMBER ${i + 1} LOADED`);

    await sleep(600);

    setCylinderPhase('spinning');
    setActionHint('');
    soundRef.current?.playCylinderSpin();
    const randomSteps = Math.floor(Math.random() * 6);
    const fullSpins = 360 * 4;
    const spinAmount = fullSpins + randomSteps * 60;
    setCylinderRotation(prev => prev + spinAmount);

    await sleep(300);
    setBulletVisible(false);

    await sleep(1800);

    soundRef.current?.playReload();
    setActionHint('LOCKED & LOADED');
    setCylinderPhase('ready');
  };

  const handlePullTrigger = async () => {
    if (gameState.status !== 'active' || isLoading || isReloading) return;
    if (cylinderPhase !== 'ready') return;

    try {
      const nextRounds = gameState.roundsSurvived + 1;
      setIsReloading(true);
      setActionHint('');

      soundRef.current?.playTrigger();
      await sleep(250);

      pullTrigger();
      soundRef.current?.playEmptyChamber();
      setActionHint(`✓ YOU LIVE · R${nextRounds}`);

      await sleep(300);
      soundRef.current?.playCylinderSpin();
      setCylinderRotation(prev => prev + 60);

      await sleep(500);
      setIsReloading(false);

      if (nextRounds >= 5) {
        await sleep(400);
        await handleCashOut();
      }
    } catch (err) {
      console.error('Pull trigger failed:', err);
      setIsReloading(false);
    }
  };

  const handleCashOut = async () => {
    if (gameState.status !== 'active' || isLoading) return;
    try {
      await settleGame();
      soundRef.current?.playCashout();
    } catch (err) {
      console.error('Cash out failed:', err);
    }
  };

  const handleNewGame = () => {
    resetGame();
    setShowFlashDeath(false);
    setShowFlashSuccess(false);
    setCylinderRotation(0);
    setShakeScreen(false);
    setSelectedChamber(null);
    setCylinderPhase('selecting');
    setBulletVisible(true);
    setIsReloading(false);
    setActionHint('');
  };

  useEffect(() => {
    if (gameState.status === 'lost') {
      setBulletVisible(true);
      setShowFlashDeath(true);
      setShakeScreen(true);
      soundRef.current?.playGunshot();
      setTimeout(() => setShakeScreen(false), 400);
    } else if (gameState.status === 'won') {
      setShowFlashSuccess(true);
      soundRef.current?.playWinJingle();
      setTimeout(() => setShowFlashSuccess(false), 500);
    }
  }, [gameState.status]);

  useEffect(() => {
    if (shakeScreen) {
      document.body.classList.add('shake');
      return () => { document.body.classList.remove('shake'); };
    }
    document.body.classList.remove('shake');
  }, [shakeScreen]);

  const isActive = gameState.status === 'active';
  const isSettling = gameState.status === 'settling';
  const isGameOver = gameState.status === 'won' || gameState.status === 'lost';
  const triggerReady = isActive && cylinderPhase === 'ready' && !isLoading && !isReloading;

  // Chamber positions for PNG overlay
  const CHAMBER_PCT = 26.5;
  const chamberAngles = [0, 60, 120, 180, 240, 300];
  const chamberOverlayPositions = chamberAngles.map(deg => {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
      left: 50 + CHAMBER_PCT * Math.cos(rad),
      top: 50 + CHAMBER_PCT * Math.sin(rad),
    };
  });

  const getInstruction = () => {
    if (!isActive) return null;
    if (cylinderPhase === 'selecting') return '>>> LOAD THE BULLET <<<';
    if (cylinderPhase === 'spinning') return '>>> SPINNING... <<<';
    if (isReloading) return '>>> RELOADING <<<';
    return '>>> PULL THE TRIGGER <<<';
  };

  const spinTransition = cylinderPhase === 'spinning'
    ? 'transform 2.0s cubic-bezier(0.08, 0.82, 0.17, 1.0)'
    : cylinderRotation === 0
      ? 'none'
      : 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1.0)';

  // Result text for display
  const getResultText = () => {
    if (gameState.status === 'won') return 'YOU LIVE.';
    if (gameState.status === 'lost') return 'YOU DIED.';
    return null;
  };

  return (
    <div className="game-content">
      {/* Vignette overlay */}
      <div className="vignette" />
      
      <div className={`flash-overlay success ${showFlashSuccess ? 'active' : ''}`} />
      <div className={`flash-overlay death ${showFlashDeath ? 'active' : ''}`} />

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
      {showFair && (
        <FairModal
          serverSeed={gameState.serverSeed}
          gameId={gameState.gameId}
          onClose={() => setShowFair(false)}
        />
      )}

      <div className="game-main game-card">
        {/* Result Title or Game Title */}
        {isGameOver ? (
          <h1 className={`game-result-title ${gameState.status === 'won' ? 'safe' : 'dead'}`}>
            {getResultText()}
          </h1>
        ) : (
          <h1 className="game-title">DEGEN ROULETTE</h1>
        )}

        {/* Tagline */}
        <p className="game-subtitle">1 BULLET. 6 CHAMBERS. HOW DEGEN ARE YOU?</p>

        {error && <p className="game-error">{error}</p>}
        {actionHint && <p className="game-hint">{actionHint}</p>}

        {/* Multiplier Table with Odds */}
        <div className="multiplier-table">
          <div className="multiplier-row">
            {MULTIPLIERS.map((m, idx) => (
              <div key={idx} className={`m-row ${gameState.roundsSurvived === idx + 1 ? 'active' : ''}`}>
                <span>R{idx + 1}</span>
                <span>{m.toFixed(2)}x</span>
              </div>
            ))}
          </div>
          <div className="odds-row">
            {ROUND_ODDS.map((odds, idx) => (
              <div
                key={idx}
                className={`odds-cell ${gameState.roundsSurvived === idx + 1 ? 'active' : ''}`}
              >
                {odds}
              </div>
            ))}
          </div>
        </div>

        {/* Stats during active game */}
        {isActive && gameState.betAmount && (
          <StatsBar
            betAmount={gameState.betAmount}
            currentMultiplier={gameState.currentMultiplier}
            potentialWin={gameState.potentialWin}
            roundsSurvived={gameState.roundsSurvived}
          />
        )}

        {/* Revolver Cylinder */}
        <div className="revolver-frame">
          {/* Barrel indicator */}
          <div className="barrel-indicator">
            <svg viewBox="0 0 40 36" className="barrel-svg">
              <defs>
                <linearGradient id="barrelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00FF41" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#00cc34" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <path
                d="M20 36 L6 10 L12 10 L12 0 L28 0 L28 10 L34 10 Z"
                fill="none"
                stroke="#00FF41"
                strokeWidth="2"
              />
              <path
                d="M20 34 L8 11 L13 11 L13 2 L27 2 L27 11 L32 11 Z"
                fill="url(#barrelGrad)"
              />
            </svg>
          </div>

          {/* Sparkles - 8 particles */}
          <div className="cylinder-sparkles">
            <span>✦</span><span>✦</span><span>✦</span><span>✦</span>
            <span>✦</span><span>✦</span><span>✦</span><span>✦</span>
          </div>

          {/* Cylinder PNG — rotates */}
          <div className="cylinder-container" style={{
            transition: spinTransition,
            transform: `rotate(${cylinderRotation}deg)`,
          }}>
            <img
              src="/cylinder-512.png"
              alt="Revolver cylinder"
              className={`cylinder-png ${cylinderPhase === 'spinning' ? 'cylinder-blur' : ''}`}
              draggable={false}
            />

            {/* Chamber overlays */}
            {chamberOverlayPositions.map((pos, i) => {
              const isBulletHere = selectedChamber === i;
              const isFired = gameState.bulletPosition !== null && i === gameState.bulletPosition;
              const canSelect = isActive && cylinderPhase === 'selecting' && gameState.roundsSurvived === 0;
              const showBullet = isBulletHere && bulletVisible;

              return (
                <div
                  key={i}
                  className={`chamber-overlay ${canSelect ? 'selectable' : ''} ${isFired ? 'fired' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '18%',
                    height: '18%',
                    borderRadius: '50%',
                    cursor: canSelect ? 'pointer' : 'default',
                  }}
                  onClick={() => canSelect && handleSelectChamber(i)}
                >
                  {(showBullet || isFired) && (
                    <div className={`bullet-dot ${isFired ? 'fired' : ''}`} />
                  )}
                  {canSelect && <div className="chamber-select-ring" />}
                  {isFired && <div className="chamber-fired-overlay" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Betting Panel (idle state) */}
        {gameState.status === 'idle' && <BetPanel startGame={startGame} isLoading={isLoading} />}

        {/* Active Game Controls */}
        {isActive && (
          <>
            <p className="game-instruction">{getInstruction()}</p>
            <div className="button-group">
              <button
                onClick={handlePullTrigger}
                disabled={!triggerReady}
                className={`trigger-btn ${gameState.roundsSurvived >= 3 ? 'danger' : ''} ${!triggerReady ? 'locked' : ''}`}
              >
                {cylinderPhase === 'selecting' ? 'LOAD FIRST'
                  : cylinderPhase === 'spinning' ? 'SPINNING...'
                  : isReloading ? 'RELOADING...'
                  : 'PULL TRIGGER'}
              </button>
              {gameState.roundsSurvived >= 1 && cylinderPhase === 'ready' && (
                <button onClick={handleCashOut} disabled={isLoading || isReloading}
                  className="cashout-btn visible">
                  CASH OUT
                </button>
              )}
            </div>
          </>
        )}

        {/* Sub Actions */}
        <div className="sub-actions">
          <button className="mini-btn" onClick={() => setShowHowTo(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            How to Play
          </button>
          <button className="mini-btn" onClick={() => setShowFair(true)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            Provably Fair
          </button>
        </div>

        {/* Settling State */}
        {isSettling && (
          <div className="settling-state">
            <div className="spinner"></div>
            <p>SETTLING...</p>
          </div>
        )}
      </div>

      {/* Result Overlay */}
      {isGameOver && gameState.betAmount && (
        <ResultOverlay
          won={gameState.status === 'won'}
          betAmount={gameState.betAmount}
          payout={gameState.payout || 0}
          multiplier={gameState.roundsSurvived > 0 ? MULTIPLIERS[gameState.roundsSurvived - 1] : MULTIPLIERS[0]}
          roundsSurvived={gameState.roundsSurvived}
          onNewGame={handleNewGame}
        />
      )}

      <style jsx>{`
        .game-card {
          background:
            linear-gradient(180deg, rgba(10, 18, 10, 0.95) 0%, rgba(5, 10, 5, 0.98) 100%);
          border: 1px solid var(--border-neon-bright);
          border-radius: 8px;
          padding: 18px 20px;
          position: relative;
          width: 100%;
          max-width: 680px;

          box-shadow:
            0 0 20px var(--neon-glow-soft),
            0 0 40px var(--neon-glow-subtle),
            0 0 60px var(--neon-glow-subtle),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 50px rgba(0, 255, 65, 0.03);
        }

        .corner-decor {
          position: absolute;
          color: var(--neon);
          filter: drop-shadow(0 0 4px var(--neon-glow));
        }

        .corner-tl { top: 6px; left: 6px; }
        .corner-tr { top: 6px; right: 6px; }
        .corner-bl { bottom: 6px; left: 6px; }
        .corner-br { bottom: 6px; right: 6px; }

        .game-error {
          color: var(--danger);
          font-family: var(--body-font);
          font-size: 0.82rem;
          text-align: center;
        }

        .game-hint {
          color: var(--neon);
          font-family: var(--pixel-font);
          font-size: 0.85rem;
          font-weight: bold;
          text-shadow:
            0 0 10px var(--neon),
            0 0 20px var(--neon-glow),
            0 0 35px var(--neon-glow-soft),
            0 0 50px var(--neon-glow-subtle);
          min-height: 1.5em;
          text-align: center;
          letter-spacing: 2px;
          animation: textGlow 1.5s ease-in-out infinite;
        }

        .max-label {
          color: var(--neon);
          text-shadow: 0 0 4px var(--neon-glow);
        }

        /* Revolver frame */
        .revolver-frame {
          position: relative;
          width: 300px;
          height: 300px;
          margin: 0 auto 10px;
          padding: 0;
        }

        .barrel-indicator {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: 36px;
          height: 32px;
          pointer-events: none;
        }

        .barrel-svg {
          width: 100%;
          height: 100%;
          filter: 
            drop-shadow(0 0 6px var(--neon)) 
            drop-shadow(0 0 12px var(--neon-glow))
            drop-shadow(0 0 20px var(--neon-glow-soft));
        }

        .trigger-btn.locked {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .sub-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          justify-content: center;
        }

        .mini-btn {
          background: 
            linear-gradient(180deg, rgba(0, 20, 0, 0.6) 0%, rgba(0, 12, 0, 0.8) 100%);
          border: 1px solid var(--border-neon);
          color: var(--text-secondary);
          font-family: var(--pixel-font);
          font-size: 0.44rem;
          padding: 7px 11px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .mini-btn svg {
          opacity: 0.7;
        }

        .mini-btn:hover {
          border-color: var(--neon);
          color: var(--neon);
          box-shadow: 0 0 10px var(--neon-glow-subtle), inset 0 0 8px var(--neon-glow-subtle);
        }

        .mini-btn:hover svg {
          opacity: 1;
          filter: drop-shadow(0 0 3px var(--neon-glow));
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-card {
          width: min(580px, 92vw);
          background:
            linear-gradient(180deg, rgba(12, 25, 12, 0.98) 0%, rgba(8, 18, 8, 0.99) 100%);
          border: 1px solid var(--border-neon-bright);
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          box-shadow:
            0 0 20px var(--neon-glow-soft),
            0 0 40px var(--neon-glow-subtle),
            0 0 60px var(--neon-glow-subtle),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 0 40px rgba(0, 255, 65, 0.04);
        }

        /* Modal corner accents */
        .modal-card::before,
        .modal-card::after {
          content: '';
          position: absolute;
          width: 14px;
          height: 14px;
          border: 1px solid var(--neon);
          opacity: 0.8;
        }

        .modal-card::before {
          top: 6px;
          left: 6px;
          border-right: none;
          border-bottom: none;
        }

        .modal-card::after {
          bottom: 6px;
          right: 6px;
          border-left: none;
          border-top: none;
        }

        .modal-card h3 {
          margin: 0;
          font-family: var(--pixel-font);
          color: var(--neon);
          font-size: 0.85rem;
          text-shadow:
            0 0 10px var(--neon),
            0 0 20px var(--neon-glow),
            0 0 35px var(--neon-glow-soft);
          letter-spacing: 2px;
          text-align: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 65, 0.15);
        }

        .modal-card ol {
          margin: 0;
          padding-left: 16px;
          color: var(--text-primary);
          line-height: 1.85;
          font-size: 0.88rem;
        }

        .modal-card p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }

        .mono {
          font-family: var(--body-font);
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .seed {
          word-break: break-all;
          color: var(--neon);
          text-shadow: 0 0 5px var(--neon-glow);
        }

        .settling-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          margin-top: 0.8rem;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 2px solid var(--neon-glow-soft);
          border-top-color: var(--neon);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          box-shadow: 0 0 15px var(--neon-glow-subtle);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .settling-state p {
          font-family: var(--pixel-font);
          color: var(--neon);
          text-shadow: 0 0 8px var(--neon-glow), 0 0 15px var(--neon-glow-soft);
          font-size: 0.55rem;
          letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
