'use client';

import { useRef, useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { SoundEngine } from '@/lib/sound';
import BetPanel from './BetPanel';
import { StatsBar } from './StatsBar';
import { ResultOverlay } from './ResultOverlay';
import { MULTIPLIERS } from '@/lib/constants';

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>HOW TO PLAY</h3>
        <ol>
          <li>1) BET 금액 입력 후 START</li>
          <li>2) 총알 넣을 챔버 선택</li>
          <li>3) 실린더 회전 → 총알 위치 감춰짐</li>
          <li>4) PULL → 상단 챔버 발사</li>
          <li>5) 살았으면 실린더 한 칸 회전</li>
          <li>6) 원할 때 CASH OUT</li>
        </ol>
        <button className="mini-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

function FairModal({ serverSeed, gameId, onClose }: { serverSeed: string | null; gameId: number | null; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>PROVABLY FAIR</h3>
        <p>게임 시작 시 seed hash를 온체인에 commit한 뒤,
          settle 시 server seed를 공개해 검증해요.</p>
        {gameId && <p className="mono">Game ID: {gameId}</p>}
        {serverSeed ? (
          <>
            <p className="mono">Server Seed (revealed):</p>
            <p className="mono seed">{serverSeed}</p>
          </>
        ) : (
          <p className="mono">정산 후 seed가 공개돼요.</p>
        )}
        <button className="mini-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
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
      setActionHint(`SURVIVED R${nextRounds}`);

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
        {/* Result Title */}
        {isGameOver && (
          <h1 className={`game-result-title ${gameState.status === 'won' ? 'safe' : 'dead'}`}>
            {getResultText()}
          </h1>
        )}

        {/* Tagline */}
        <p className="game-subtitle">1 BULLET. 6 CHAMBERS. HOW DEGEN ARE YOU?</p>

        {error && <p className="game-error">{error}</p>}
        {actionHint && <p className="game-hint">{actionHint}</p>}

        {/* Multiplier Table */}
        <div className="multiplier-table">
          {MULTIPLIERS.map((m, idx) => (
            <div key={idx} className={`m-row ${gameState.roundsSurvived === idx + 1 ? 'active' : ''}`}>
              <span>R{idx + 1}</span>
              <span>{m.toFixed(2)}x</span>
            </div>
          ))}
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
            <svg viewBox="0 0 40 32" className="barrel-svg">
              <path d="M20 32 L8 8 L14 8 L14 0 L26 0 L26 8 L32 8 Z" fill="#00FF41" opacity="0.95" />
            </svg>
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
          <button className="mini-btn" onClick={() => setShowHowTo(true)}>How to Play</button>
          <button className="mini-btn" onClick={() => setShowFair(true)}>Provably Fair</button>
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
          background: var(--bg-panel);
          border: 1px solid var(--border-neon);
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 0 30px var(--neon-green-soft);
          width: 100%;
          max-width: 680px;
        }

        .game-error {
          color: var(--danger);
          font-family: var(--body-font);
          font-size: 0.85rem;
          text-align: center;
        }

        .game-hint {
          color: var(--neon-green);
          font-family: var(--pixel-font);
          font-size: 0.52rem;
          text-shadow: 0 0 8px var(--neon-green-glow);
          min-height: 1.2em;
          text-align: center;
        }

        /* Revolver frame */
        .revolver-frame {
          position: relative;
          width: 280px;
          height: 280px;
          margin: 0 auto 12px;
          padding: 0;
        }

        .barrel-indicator {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          width: 32px;
          height: 28px;
          pointer-events: none;
        }

        .barrel-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 8px var(--neon-green)) drop-shadow(0 0 16px var(--neon-green-glow));
        }

        .trigger-btn.locked {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sub-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          justify-content: center;
        }

        .mini-btn {
          background: rgba(0, 20, 0, 0.5);
          border: 1px solid var(--border-neon);
          color: var(--text-secondary);
          font-family: var(--pixel-font);
          font-size: 0.48rem;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .mini-btn:hover {
          border-color: var(--neon-green);
          color: var(--neon-green);
          box-shadow: 0 0 10px var(--neon-green-soft);
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-card {
          width: min(620px, 92vw);
          background: var(--bg-secondary);
          border: 1px solid var(--border-neon);
          border-radius: 10px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 0 40px var(--neon-green-soft);
        }

        .modal-card h3 {
          margin: 0;
          font-family: var(--pixel-font);
          color: var(--neon-green);
          font-size: 0.85rem;
          text-shadow: 0 0 10px var(--neon-green-glow);
        }

        .modal-card ol {
          margin: 0;
          padding-left: 18px;
          color: var(--text-primary);
          line-height: 1.8;
          font-size: 0.9rem;
        }

        .mono {
          font-family: var(--body-font);
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .seed {
          word-break: break-all;
          color: var(--neon-green);
        }

        .settling-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--neon-green-soft);
          border-top-color: var(--neon-green);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .settling-state p {
          font-family: var(--pixel-font);
          color: var(--neon-green);
          text-shadow: 0 0 10px var(--neon-green-glow);
          font-size: 0.6rem;
        }
      `}</style>
    </div>
  );
}
