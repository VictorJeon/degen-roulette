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
          <li>2) 챔버 선택(연출용) + 실린더 회전</li>
          <li>3) PULL로 라운드 진행 (TX 없음)</li>
          <li>4) 원할 때 CASH OUT</li>
          <li>5) 서버가 settle → 결과 확정</li>
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
        {gameId && (
          <p className="mono">Game ID: {gameId}</p>
        )}
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

export default function GameBoard() {
  const { gameState, isLoading, error, startGame, pullTrigger, settleGame, resetGame } = useGame();
  const soundRef = useRef<SoundEngine | null>(null);

  const [shakeScreen, setShakeScreen] = useState(false);
  const [showFlashSuccess, setShowFlashSuccess] = useState(false);
  const [showFlashDeath, setShowFlashDeath] = useState(false);
  const [cylinderRotation, setCylinderRotation] = useState(0);
  const [selectedChamber, setSelectedChamber] = useState<number | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showFair, setShowFair] = useState(false);
  const [actionHint, setActionHint] = useState<string>('');

  useEffect(() => {
    soundRef.current = new SoundEngine();
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSelectChamber = (i: number) => {
    setSelectedChamber(i);
    soundRef.current?.playBulletLoad();
    setActionHint(`CHAMBER ${i + 1} LOADED`);
  };

  const handlePullTrigger = async () => {
    if (gameState.status !== 'active' || isLoading || isReloading) return;

    if (selectedChamber === null) {
      setActionHint('CHOOSE A CHAMBER FIRST');
      return;
    }

    try {
      const nextRounds = gameState.roundsSurvived + 1;

      setIsReloading(true);
      soundRef.current?.playCylinderSpin();
      setCylinderRotation(prev => prev + 420 + Math.floor(Math.random() * 120));

      await sleep(500);
      soundRef.current?.playTrigger();
      await sleep(180);

      pullTrigger();
      soundRef.current?.playEmptyChamber();
      setActionHint(`SURVIVED R${nextRounds}`);

      await sleep(220);
      setIsReloading(false);

      // Max rounds reached -> auto settle
      if (nextRounds >= 5) {
        await sleep(500);
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
    setIsReloading(false);
    setActionHint('');
  };

  useEffect(() => {
    if (gameState.status === 'lost') {
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
      return () => document.body.classList.remove('shake');
    }
    document.body.classList.remove('shake');
  }, [shakeScreen]);

  const isActive = gameState.status === 'active';
  const isSettling = gameState.status === 'settling';
  const isGameOver = gameState.status === 'won' || gameState.status === 'lost';

  const chamberPositions = [
    { x: 150, y: 50 },
    { x: 236.6, y: 100 },
    { x: 236.6, y: 200 },
    { x: 150, y: 250 },
    { x: 63.4, y: 200 },
    { x: 63.4, y: 100 },
  ];

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
        <p className="game-subtitle">1 BULLET. NO RESPAWN. HOW DEGEN ARE YOU?</p>

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

        <div className="cylinder-container depth">
          <div className="hammer-fixed">▼</div>
          <svg
            className="cylinder-svg"
            viewBox="0 0 300 300"
            style={{
              transition: cylinderRotation === 0 ? 'none' : 'transform 0.95s cubic-bezier(0.2, 0.9, 0.15, 1.0)',
              transform: `perspective(900px) rotateX(8deg) rotate(${cylinderRotation}deg)`
            }}
          >
            <defs>
              <radialGradient id="cylMetal" cx="50%" cy="44%" r="60%">
                <stop offset="0%" stopColor="#3a3a3a" />
                <stop offset="40%" stopColor="#232323" />
                <stop offset="100%" stopColor="#151515" />
              </radialGradient>
            </defs>

            <circle cx="150" cy="150" r="140" fill="none" stroke="#2b2b2f" strokeWidth="2" />
            <circle cx="150" cy="150" r="130" fill="url(#cylMetal)" />

            {chamberPositions.map((pos, i) => {
              const isFired = gameState.bulletPosition !== null && i === gameState.bulletPosition;
              const isCurrentChamber = i === gameState.roundsSurvived && isActive;
              const isSelected = selectedChamber === i;

              return (
                <g
                  key={i}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => isActive && gameState.roundsSurvived === 0 && handleSelectChamber(i)}
                  style={{ cursor: isActive && gameState.roundsSurvived === 0 ? 'pointer' : 'default' }}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="28"
                    className="chamber-circle"
                    fill={isFired ? 'rgba(239, 68, 68, 0.35)' : '#0d0d0d'}
                    stroke={isCurrentChamber ? '#a3e635' : isSelected ? '#f59e0b' : '#3f3f46'}
                    strokeWidth={isCurrentChamber || isSelected ? 3 : 2}
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="9"
                    fill="#ef4444"
                    style={{ opacity: isFired ? 1 : 0 }}
                  />
                </g>
              );
            })}

            <circle cx="150" cy="150" r="35" fill="#1a1a1a" stroke="#3f3f46" strokeWidth="2" />
            <circle cx="150" cy="150" r="15" fill="#0d0d0d" stroke="#a3e635" strokeWidth="2" />
          </svg>
        </div>

        {gameState.status === 'idle' && <BetPanel startGame={startGame} isLoading={isLoading} />}

        {isActive && (
          <>
            <p className="game-instruction">{isReloading ? '>>> RELOADING <<<' : '>>> PULL THE TRIGGER <<<'}</p>
            <div className="button-group">
              <button
                onClick={handlePullTrigger}
                disabled={isLoading || isReloading}
                className={`trigger-btn ${gameState.roundsSurvived >= 3 ? 'danger' : ''}`}
              >
                {isReloading ? 'RELOADING...' : 'TRIGGER'}
              </button>
              {gameState.roundsSurvived >= 1 && (
                <button
                  onClick={handleCashOut}
                  disabled={isLoading || isReloading}
                  className="cashout-btn visible"
                >
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

        .depth { filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.5)); }

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
        }

        .multiplier-table {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 8px;
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

        .mini-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.82);
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-card {
          width: min(620px, 92vw);
          background: #0f1013;
          border: 1px solid #2f3338;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .modal-card h3 {
          margin: 0;
          font-family: 'Press Start 2P', monospace;
          color: var(--accent);
          font-size: 0.9rem;
        }

        .modal-card ol {
          margin: 0;
          padding-left: 18px;
          color: #e4e4e7;
          line-height: 1.7;
          font-size: 0.95rem;
        }

        .mono {
          font-family: 'Space Grotesk', monospace;
          font-size: 0.85rem;
          color: #d4d4d8;
          margin: 0;
        }

        .seed {
          word-break: break-all;
          color: #a3e635;
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
          border: 4px solid rgba(163, 230, 53, 0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .settling-state p {
          font-family: 'Press Start 2P', monospace;
          color: var(--accent);
          text-shadow: 0 0 10px var(--accent);
        }
      `}</style>
    </div>
  );
}
