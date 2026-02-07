'use client';

import { useRef, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBet } from '@/hooks/useBet';
import { useGameState } from '@/hooks/useGameState';
import { SoundEngine } from '@/lib/sound';

type GamePhase = 'idle' | 'loading' | 'active';

export default function GameBoard() {
  const { publicKey } = useWallet();
  const { pullTrigger, cashOut, loading: betLoading } = useBet();
  const { gameState, loading: stateLoading } = useGameState();
  const soundRef = useRef<SoundEngine | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [showFlashSuccess, setShowFlashSuccess] = useState(false);
  const [showFlashDeath, setShowFlashDeath] = useState(false);
  const [showDeathOverlay, setShowDeathOverlay] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [cylinderRotation, setCylinderRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (!gameState || betLoading) return;

    try {
      playSound('trigger');
      await sleep(500);

      await pullTrigger();

      // Wait for state update
      await sleep(1000);

      // Check result based on updated gameState
      // This will be handled by useGameState subscription
    } catch (err) {
      console.error('Pull trigger failed:', err);
    }
  };

  const handleCashOut = async () => {
    if (!gameState || betLoading) return;

    try {
      await cashOut();
      setShowWinOverlay(true);
    } catch (err) {
      console.error('Cash out failed:', err);
    }
  };

  const resetGame = () => {
    setShowDeathOverlay(false);
    setShowWinOverlay(false);
    setShowFlashDeath(false);
    setShowFlashSuccess(false);
    setCylinderRotation(0);
    setShakeScreen(false);
  };

  // Handle game state changes
  useEffect(() => {
    if (!gameState) return;

    const status = gameState.status;

    if ('lost' in status) {
      setShowFlashDeath(true);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);
      setTimeout(() => setShowDeathOverlay(true), 500);
    } else if ('won' in status) {
      setShowFlashSuccess(true);
      setTimeout(() => setShowFlashSuccess(false), 500);
    }
  }, [gameState]);

  const getChamberPosition = (index: number) => {
    const angle = (index * 60 - 90) * (Math.PI / 180);
    const x = 100 + 65 * Math.cos(angle);
    const y = 100 + 65 * Math.sin(angle);
    return { x, y };
  };

  const multipliers = [1.0, 1.2, 1.5, 2.0, 3.0, 6.0];
  const currentRound = gameState?.currentRound || 0;
  const multiplier = multipliers[currentRound] || 1.0;
  const chambers = 6 - currentRound;
  const betAmount = gameState?.betAmount ? Number(gameState.betAmount) / 1e9 : 0;

  const isActive = gameState && 'active' in gameState.status;

  return (
    <div className={`flex flex-col items-center justify-center gap-8 relative ${shakeScreen ? 'animate-shake' : ''}`}>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999 }}
      />

      {showFlashSuccess && (
        <div className="fixed inset-0 bg-[#00ff88] opacity-20 pointer-events-none" style={{ zIndex: 999 }} />
      )}
      {showFlashDeath && (
        <div className="fixed inset-0 bg-[#ff3b3b] opacity-30 pointer-events-none" style={{ zIndex: 999 }} />
      )}

      <div className="text-center">
        <h1 className="font-pixel text-[1.4rem] text-accent text-glow-strong tracking-[0.1em]">
          DEGEN ROULETTE
        </h1>
        <p className="font-pixel text-[0.5rem] text-text-muted mt-2 tracking-[0.05em]">
          1 BULLET. NO RESPAWN. HOW DEGEN ARE YOU?
        </p>
      </div>

      {/* Cylinder */}
      <div className="relative w-[280px] h-[280px]">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 font-pixel text-[16px] text-accent animate-hammer-pulse">
          ▼
        </div>

        <svg
          className="w-full h-full transition-transform duration-[1500ms] ease-in-out"
          style={{
            transform: `rotate(${cylinderRotation}deg)`,
            transition: cylinderRotation === 0 ? 'none' : 'transform 1500ms cubic-bezier(0.25, 0.1, 0.25, 1)'
          }}
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="95" fill="none" stroke="#333333" strokeWidth="2" />
          <circle cx="100" cy="100" r="30" fill="#1a1a1a" stroke="#a3e635" strokeWidth="2" />

          {[0, 1, 2, 3, 4, 5].map((i) => {
            const { x, y } = getChamberPosition(i);
            const isCurrentChamber = i === currentRound;
            const isFired = i < currentRound;

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill={isFired ? 'rgba(239, 68, 68, 0.3)' : '#0a0a0a'}
                  stroke={isCurrentChamber && isActive ? '#a3e635' : '#333333'}
                  strokeWidth={isCurrentChamber && isActive ? 3 : 2}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats */}
      <div className="game-stats">
        <div className="stat-item">
          <div className="stat-label">Bet</div>
          <div className="stat-value">{betAmount.toFixed(2)} SOL</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Multiplier</div>
          <div className="stat-value accent">{multiplier.toFixed(1)}x</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Potential</div>
          <div className="stat-value">{(betAmount * multiplier).toFixed(4)} SOL</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Death Odds</div>
          <div className="stat-value">1 in {chambers}</div>
        </div>
      </div>

      {/* Playing UI */}
      {isActive && (
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={handlePullTrigger}
            disabled={betLoading}
            className={`trigger-btn ${chambers <= 2 ? 'danger' : ''}`}
          >
            SHOT
          </button>
          {currentRound >= 1 && (
            <button
              onClick={handleCashOut}
              disabled={betLoading}
              className="cashout-btn"
            >
              TAKE THE BAG
            </button>
          )}
        </div>
      )}

      {/* Provably Fair Badge */}
      <div className="fair-badge">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
        </svg>
        Provably Fair
      </div>

      {/* Death overlay */}
      {showDeathOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center" style={{ zIndex: 2000 }}>
          <div className="text-center">
            <div className="font-pixel text-[2rem] text-danger mb-8">YOU DIED</div>
            <div className="font-pixel text-[1rem] text-text-secondary mb-2">FINAL MULTIPLIER</div>
            <div className="font-pixel text-[1.5rem] text-accent text-glow mb-6">{multiplier.toFixed(1)}x</div>
            <div className="font-pixel text-[0.7rem] text-text-muted mb-8">SURVIVED {currentRound} ROUNDS</div>
            <button
              onClick={resetGame}
              className="font-pixel text-[0.7rem] px-8 py-4 bg-accent border-[4px] border-accent-dim text-bg-primary uppercase tracking-wider shadow-[6px_6px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0_0_0_#000] transition-all"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Win overlay */}
      {showWinOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center" style={{ zIndex: 2000 }}>
          <div className="text-center">
            <div className="font-pixel text-[2rem] text-success text-glow-success mb-8">ESCAPED</div>
            <div className="font-pixel text-[1rem] text-text-secondary mb-2">YOU WON</div>
            <div className="font-pixel text-[1.5rem] text-accent text-glow mb-4">
              {(betAmount * multiplier).toFixed(4)} SOL
            </div>
            <div className="font-pixel text-[0.8rem] text-text-muted mb-2">{multiplier.toFixed(1)}x MULTIPLIER</div>
            <div className="font-pixel text-[0.7rem] text-success mb-8">
              +{((betAmount * multiplier) - betAmount).toFixed(4)} SOL PROFIT
            </div>
            <button
              onClick={resetGame}
              className="font-pixel text-[0.7rem] px-8 py-4 bg-accent border-[4px] border-accent-dim text-bg-primary uppercase tracking-wider shadow-[6px_6px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0_0_0_#000] transition-all"
            >
              NEW GAME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
