'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
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
  // Rotation always in multiples of 60° so chambers snap to positions
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

  // Chamber at 12 o'clock = the one whose original position, after rotation, is at top
  // Chambers are indexed 0-5 clockwise starting from top (0°, 60°, 120°, 180°, 240°, 300°)
  // After rotating cylinder by R degrees CW, chamber i is visually at angle (i*60 + R) % 360
  // Chamber at top (0°): i where (i*60 + R) % 360 === 0 → i = ((360 - R%360) % 360) / 60

  const handleSelectChamber = async (i: number) => {
    if (cylinderPhase !== 'selecting') return;

    setSelectedChamber(i);
    setBulletVisible(true);
    soundRef.current?.playBulletLoad();
    setActionHint(`CHAMBER ${i + 1} LOADED`);

    await sleep(600);

    // Spin: multiple full rotations + random offset (always 60° multiples)
    setCylinderPhase('spinning');
    setActionHint('');
    soundRef.current?.playCylinderSpin();
    const randomSteps = Math.floor(Math.random() * 6); // 0-5 extra chambers
    const fullSpins = 360 * 4; // 4 full rotations for drama
    const spinAmount = fullSpins + randomSteps * 60;
    setCylinderRotation(prev => prev + spinAmount);

    await sleep(300);
    setBulletVisible(false);

    // Wait for spin to settle (matches CSS transition duration)
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

      // Fire: brief pause then trigger sound
      soundRef.current?.playTrigger();
      await sleep(250);

      pullTrigger();
      soundRef.current?.playEmptyChamber();
      setActionHint(`SURVIVED R${nextRounds}`);

      // Advance cylinder by one chamber (60° clockwise)
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

  // 6 chambers at 60° intervals, index 0 at 12 o'clock (top center)
  // For PNG overlay: positions as percentage of container size
  const CHAMBER_PCT = 26.5; // chamber center distance from center as % of container
  const chamberAngles = [0, 60, 120, 180, 240, 300]; // degrees, 0 = top
  const chamberOverlayPositions = chamberAngles.map(deg => {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
      left: 50 + CHAMBER_PCT * Math.cos(rad),
      top: 50 + CHAMBER_PCT * Math.sin(rad),
    };
  });
  // SVG positions still needed for backwards compat
  const CHAMBER_RADIUS = 75;
  const chamberPositions = chamberAngles.map(deg => {
    const rad = (deg - 90) * (Math.PI / 180);
    return {
      x: 150 + CHAMBER_RADIUS * Math.cos(rad),
      y: 150 + CHAMBER_RADIUS * Math.sin(rad),
    };
  });

  const getInstruction = () => {
    if (!isActive) return null;
    if (cylinderPhase === 'selecting') return '>>> LOAD THE BULLET <<<';
    if (cylinderPhase === 'spinning') return '>>> SPINNING... <<<';
    if (isReloading) return '>>> RELOADING <<<';
    return '>>> PULL THE TRIGGER <<<';
  };

  // Slower easing for initial big spin, snappy for chamber advance
  const spinTransition = cylinderPhase === 'spinning'
    ? 'transform 2.0s cubic-bezier(0.08, 0.82, 0.17, 1.0)'
    : cylinderRotation === 0
      ? 'none'
      : 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1.0)';

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
        <h1 className="game-title">DEGEN ROULETTE</h1>
        <p className="game-subtitle">1 BULLET. 6 CHAMBERS. HOW DEGEN ARE YOU?</p>

        {error && <p className="game-error">{error}</p>}
        {actionHint && <p className="game-hint">{actionHint}</p>}

        {isActive && gameState.betAmount && (
          <StatsBar
            betAmount={gameState.betAmount}
            currentMultiplier={gameState.currentMultiplier}
            potentialWin={gameState.potentialWin}
            roundsSurvived={gameState.roundsSurvived}
          />
        )}

        <div className="multiplier-table">
          {MULTIPLIERS.map((m, idx) => (
            <div key={idx} className={`m-row ${gameState.roundsSurvived === idx + 1 ? 'active' : ''}`}>
              <span>R{idx + 1}</span>
              <span>{m.toFixed(2)}x</span>
            </div>
          ))}
        </div>

        {/* Revolver cylinder — PNG asset + overlay */}
        <div className="revolver-frame">
          {/* Barrel / firing pin — fixed at top, does NOT rotate */}
          <div className="barrel-indicator">
            <svg viewBox="0 0 40 32" className="barrel-svg">
              <path d="M20 32 L8 8 L14 8 L14 0 L26 0 L26 8 L32 8 Z" fill="#BFFF00" opacity="0.95" />
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

            {/* Chamber overlays — rotate with the cylinder */}
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
                  {/* Bullet */}
                  {(showBullet || isFired) && (
                    <div className={`bullet-dot ${isFired ? 'fired' : ''}`} />
                  )}
                  {/* Selection glow ring */}
                  {canSelect && <div className="chamber-select-ring" />}
                  {/* Fired red overlay */}
                  {isFired && <div className="chamber-fired-overlay" />}
                </div>
              );
            })}
          </div>
        </div>

        {gameState.status === 'idle' && <BetPanel startGame={startGame} isLoading={isLoading} />}

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

        <div className="sub-actions">
          <button className="mini-btn" onClick={() => setShowHowTo(true)}>How to Play</button>
          <button className="mini-btn" onClick={() => setShowFair(true)}>Provably Fair</button>
        </div>

        {isSettling && (
          <div className="settling-state">
            <div className="spinner"></div>
            <p>SETTLING...</p>
          </div>
        )}
      </div>

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
          background: var(--bg-secondary);
          border: 1px solid #27272a;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.45);
          width: 100%;
          max-width: 760px;
        }

        .game-error {
          color: var(--danger);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.85rem;
        }

        .game-hint {
          color: var(--accent);
          font-family: 'Press Start 2P', monospace;
          font-size: 0.55rem;
          text-shadow: 0 0 8px var(--accent-glow);
          min-height: 1.2em;
        }

        .multiplier-table {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .m-row {
          background: var(--bg-tertiary);
          border: 1px solid #2f2f35;
          border-radius: 8px;
          padding: 8px;
          font-family: 'Press Start 2P', monospace;
          font-size: 0.52rem;
          display: flex;
          justify-content: space-between;
          color: #a1a1aa;
        }

        .m-row.active {
          border-color: var(--accent);
          color: var(--accent);
          box-shadow: 0 0 12px rgba(163,230,53,0.2);
        }

        /* === Revolver frame - Neon Cyberpunk === */
        .revolver-frame {
          position: relative;
          width: 280px;
          height: 280px;
          margin: 0 auto 16px;
          border-radius: 20%;
          border: 3px solid #BFFF00;
          background: radial-gradient(circle at center, rgba(15, 26, 15, 0.8) 0%, rgba(5, 10, 5, 0.95) 100%);
          box-shadow: 
            0 0 15px rgba(191, 255, 0, 0.4),
            0 0 30px rgba(191, 255, 0, 0.2),
            0 0 60px rgba(191, 255, 0, 0.1),
            inset 0 0 30px rgba(0, 0, 0, 0.5);
          padding: 10px;
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
          filter: drop-shadow(0 0 8px #BFFF00) drop-shadow(0 0 16px rgba(191, 255, 0, 0.5));
        }

        .cylinder-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 10px rgba(191, 255, 0, 0.15));
        }

        .cylinder-svg.cylinder-blur {
          filter: blur(2px) drop-shadow(0 0 10px rgba(191, 255, 0, 0.15));
        }

        .chamber-hover:hover {
          stroke: rgba(191, 255, 0, 0.6) !important;
        }

        .trigger-btn.locked {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .sub-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .mini-btn {
          background: #171717;
          border: 1px solid #3a3a3a;
          color: #d4d4d8;
          font-family: 'Press Start 2P', monospace;
          font-size: 0.52rem;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        .mini-btn:hover { border-color: var(--accent); color: var(--accent); }

        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.82);
          z-index: 1400;
          display: flex; align-items: center; justify-content: center;
        }
        .modal-card {
          width: min(620px, 92vw);
          background: #0f1013; border: 1px solid #2f3338;
          border-radius: 12px; padding: 20px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .modal-card h3 { margin: 0; font-family: 'Press Start 2P', monospace; color: var(--accent); font-size: 0.9rem; }
        .modal-card ol { margin: 0; padding-left: 18px; color: #e4e4e7; line-height: 1.7; font-size: 0.95rem; }
        .mono { font-family: 'Space Grotesk', monospace; font-size: 0.85rem; color: #d4d4d8; margin: 0; }
        .seed { word-break: break-all; color: #a3e635; }

        .settling-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-top: 1rem; }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(163,230,53,0.2); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .settling-state p { font-family: 'Press Start 2P', monospace; color: var(--accent); text-shadow: 0 0 10px var(--accent); }
      `}</style>
    </div>
  );
}
