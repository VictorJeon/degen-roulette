'use client';

import { useRef, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGame } from '@/hooks/useGame';
import { SoundEngine } from '@/lib/sound';
import BetPanel from './BetPanel';
import { StatsBar } from './StatsBar';
import { ResultOverlay } from './ResultOverlay';
import { MULTIPLIERS } from '@/lib/constants';

export default function GameBoard() {
  const { publicKey } = useWallet();
  const { gameState, isLoading, pullTrigger, settleGame, resetGame } = useGame();
  const soundRef = useRef<SoundEngine | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [showFlashSuccess, setShowFlashSuccess] = useState(false);
  const [showFlashDeath, setShowFlashDeath] = useState(false);
  const [cylinderRotation, setCylinderRotation] = useState(0);

  useEffect(() => {
    soundRef.current = new SoundEngine();
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const playSound = (type: 'spin' | 'trigger' | 'empty' | 'gunshot' | 'bulletLoad') => {
    if (!soundRef.current) return;
    switch (type) {
      case 'spin':
        soundRef.current.playCylinderSpin();
        break;
      case 'trigger':
        soundRef.current.playTrigger();
        break;
      case 'empty':
        soundRef.current.playEmptyChamber();
        break;
      case 'gunshot':
        soundRef.current.playGunshot();
        break;
      case 'bulletLoad':
        soundRef.current.playBulletLoad();
        break;
    }
  };

  const handlePullTrigger = async () => {
    if (gameState.status !== 'active' || isLoading) return;

    try {
      playSound('trigger');
      setCylinderRotation(prev => prev + 60);
      await sleep(500);
      pullTrigger();
      playSound('empty');
      await sleep(500);
    } catch (err) {
      console.error('Pull trigger failed:', err);
    }
  };

  const handleCashOut = async () => {
    if (gameState.status !== 'active' || isLoading) return;

    try {
      await settleGame();
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
  };

  useEffect(() => {
    if (gameState.status === 'lost') {
      setShowFlashDeath(true);
      setShakeScreen(true);
      playSound('gunshot');
      setTimeout(() => setShakeScreen(false), 400);
    } else if (gameState.status === 'won') {
      setShowFlashSuccess(true);
      setTimeout(() => setShowFlashSuccess(false), 500);
    }
  }, [gameState.status]);

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

      <div className="game-main">
        <h1 className="game-title">DEGEN ROULETTE</h1>
        <p className="game-subtitle">1 BULLET. NO RESPAWN. HOW DEGEN ARE YOU?</p>

        {isActive && gameState.betAmount && (
          <StatsBar
            betAmount={gameState.betAmount}
            currentMultiplier={gameState.currentMultiplier}
            potentialWin={gameState.potentialWin}
            roundsSurvived={gameState.roundsSurvived}
          />
        )}

        <div className="cylinder-container">
          <div className="hammer-fixed">▼</div>

          <svg
            className="cylinder-svg"
            id="cylinder"
            viewBox="0 0 300 300"
            style={{
              transition: cylinderRotation === 0 ? 'none' : 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              transform: `rotate(${cylinderRotation}deg)`
            }}
          >
            <defs>
              <radialGradient id="cylinderGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2a2a2a" />
                <stop offset="100%" stopColor="#1a1a1a" />
              </radialGradient>
            </defs>

            <circle cx="150" cy="150" r="140" fill="none" stroke="#27272a" strokeWidth="2" />
            <circle cx="150" cy="150" r="130" fill="url(#cylinderGrad)" />

            {chamberPositions.map((pos, i) => {
              const isFired = gameState.bulletPosition !== null && i === gameState.bulletPosition;
              const isCurrentChamber = i === gameState.roundsSurvived && isActive;

              return (
                <g
                  key={i}
                  id={`chamber-${i}`}
                  transform={`translate(${pos.x}, ${pos.y})`}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="28"
                    className="chamber-circle"
                    fill={isFired ? 'rgba(239, 68, 68, 0.3)' : '#0d0d0d'}
                    stroke={isCurrentChamber ? '#a3e635' : '#3f3f46'}
                    strokeWidth={isCurrentChamber ? 3 : 2}
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="8"
                    className="bullet-indicator"
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

        {gameState.status === 'idle' && <BetPanel />}

        {isActive && (
          <>
            <p className="game-instruction">
              {'>>> PULL THE TRIGGER <<<'}
            </p>
            <div className="button-group">
              <button
                onClick={handlePullTrigger}
                disabled={isLoading}
                className={`trigger-btn ${gameState.roundsSurvived >= 3 ? 'danger' : ''}`}
              >
                PULL TRIGGER
              </button>
              {gameState.roundsSurvived >= 1 && (
                <button
                  onClick={handleCashOut}
                  disabled={isLoading}
                  className="cashout-btn visible"
                >
                  CASH OUT
                </button>
              )}
            </div>
          </>
        )}

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
          multiplier={MULTIPLIERS[gameState.roundsSurvived]}
          roundsSurvived={gameState.roundsSurvived}
          onNewGame={handleNewGame}
        />
      )}

      <style jsx>{`
        .settling-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(163, 230, 53, 0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .settling-state p {
          font-family: 'Press Start 2P', monospace;
          color: var(--accent);
          text-shadow: 0 0 10px var(--accent);
        }
      `}</style>
    </div>
  );
}
