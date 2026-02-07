'use client';

import { useRef, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBet } from '@/hooks/useBet';
import { useGameState } from '@/hooks/useGameState';
import { SoundEngine } from '@/lib/sound';

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
      await sleep(1000);
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

  const multipliers = [1.0, 1.2, 1.5, 2.0, 3.0, 6.0];
  const currentRound = gameState?.currentRound || 0;
  const multiplier = multipliers[currentRound] || 1.0;
  const chambers = 6 - currentRound;
  const betAmount = gameState?.betAmount ? Number(gameState.betAmount) / 1e9 : 1;

  const isActive = gameState && 'active' in gameState.status;

  // Fixed chamber positions matching reference HTML exactly
  const chamberPositions = [
    { x: 150, y: 50 },    // chamber-0: top
    { x: 236.6, y: 100 }, // chamber-1: top-right
    { x: 236.6, y: 200 }, // chamber-2: bottom-right
    { x: 150, y: 250 },   // chamber-3: bottom
    { x: 63.4, y: 200 },  // chamber-4: bottom-left
    { x: 63.4, y: 100 },  // chamber-5: top-left
  ];

  return (
    <div className="game-content">
      {/* Flash overlays */}
      <div className={`flash-overlay success ${showFlashSuccess ? 'active' : ''}`} />
      <div className={`flash-overlay death ${showFlashDeath ? 'active' : ''}`} />

      {/* Main game section */}
      <div className="game-main">
        <h1 className="game-title">DEGEN ROULETTE</h1>
        <p className="game-subtitle">1 BULLET. NO RESPAWN. HOW DEGEN ARE YOU?</p>

      {/* Cylinder - matches reference HTML exactly */}
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

          {/* Outer ring */}
          <circle cx="150" cy="150" r="140" fill="none" stroke="#27272a" strokeWidth="2" />

          {/* Cylinder body */}
          <circle cx="150" cy="150" r="130" fill="url(#cylinderGrad)" />

          {/* Chambers */}
          {chamberPositions.map((pos, i) => {
            const isFired = i < currentRound;
            const isCurrentChamber = i === currentRound && isActive;

            return (
              <g
                key={i}
                id={`chamber-${i}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: 'pointer' }}
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
                  style={{ opacity: 0 }}
                />
              </g>
            );
          })}

          {/* Center pieces */}
          <circle cx="150" cy="150" r="35" fill="#1a1a1a" stroke="#3f3f46" strokeWidth="2" />
          <circle cx="150" cy="150" r="15" fill="#0d0d0d" stroke="#a3e635" strokeWidth="2" />
        </svg>
      </div>

      {/* Stats */}
      <div className="game-stats">
        <div className="stat-item">
          <div className="stat-label">Bet</div>
          <div className="stat-value" id="betDisplay">{betAmount} SOL</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Multiplier</div>
          <div className="stat-value accent" id="multiplierDisplay">{multiplier.toFixed(1)}x</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Potential</div>
          <div className="stat-value" id="potentialDisplay">{(betAmount * multiplier).toFixed(4)} SOL</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Death Odds</div>
          <div className="stat-value" id="oddsDisplay">1 in {chambers}</div>
        </div>
      </div>

        {/* Action Buttons */}
        <div className="button-group">
          {isActive ? (
            <>
              <button
                onClick={handlePullTrigger}
                disabled={betLoading}
                className={`trigger-btn ${chambers <= 2 ? 'danger' : ''}`}
                id="shotBtn"
              >
                SHOT
              </button>
              {currentRound >= 1 && (
                <button
                  onClick={handleCashOut}
                  disabled={betLoading}
                  className="cashout-btn visible"
                  id="cashoutBtn"
                >
                  TAKE THE BAG
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Bottom section - instruction and badge */}
      <div className="game-bottom">
        <p className="game-instruction" id="gameInstruction">
          {isActive ? '>>> PULL THE TRIGGER <<<' : '>>> PLACE YOUR BET <<<'}
        </p>

        {/* Provably Fair Badge */}
        <div className="fair-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          Provably Fair
        </div>
      </div>

      {/* Death Overlay */}
      <div className={`result-overlay ${showDeathOverlay ? 'active' : ''}`} id="deathOverlay">
        <h2 className="result-title death">REKT</h2>
        <div className="result-stats">
          FINAL MULTI: <span id="deathMultiplier">{multiplier.toFixed(1)}x</span><br />
          SURVIVED: <span id="deathSurvived">{currentRound}</span> SHOTS
        </div>
        <button className="result-btn" id="retryBtn" onClick={resetGame}>
          RUN IT BACK
        </button>
      </div>

      {/* Win Overlay */}
      <div className={`result-overlay ${showWinOverlay ? 'active' : ''}`} id="winOverlay">
        <h2 className="result-title win">ESCAPED</h2>
        <div className="result-stats">
          SECURED: <span id="winAmount">{(betAmount * multiplier).toFixed(4)} SOL</span><br />
          MULTIPLIER: <span id="winMultiplier">{multiplier.toFixed(1)}x</span><br />
          PROFIT: <span id="winProfit">{((betAmount * multiplier) - betAmount).toFixed(4)} SOL</span>
        </div>
        <button className="result-btn" id="newGameBtn" onClick={resetGame}>
          AGAIN
        </button>
      </div>

      {/* Multiplier Popup */}
      <div className="multiplier-popup" id="multiplierPopup">{multiplier.toFixed(1)}x</div>

      {/* Load Popup */}
      <div className="load-popup" id="loadPopup">● LOADED</div>
    </div>
  );
}
