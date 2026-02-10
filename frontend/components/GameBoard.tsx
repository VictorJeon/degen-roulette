'use client';

import { useRef, useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { SoundEngine } from '@/lib/sound';
import BetPanel from './BetPanel';
import { StatsBar } from './StatsBar';
import { ResultOverlay } from './ResultOverlay';
import { MULTIPLIERS } from '@/lib/constants';


function HowToPlayModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/88 z-[1400] flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="How to play">
      <div className="w-[min(580px,92vw)] bg-bg-elevated border border-border-default rounded-xl p-6 flex flex-col gap-3.5 max-md:w-[calc(100vw-2rem)] max-md:p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="m-0 font-display text-sm max-md:text-xs text-accent tracking-[2px] text-center pb-2 border-b border-border-default">
          HOW TO PLAY
        </h3>
        <ol className="m-0 pl-4 text-white leading-[1.85] text-sm max-md:text-xs font-body">
          <li className="mb-1.5">Enter BET amount and click START</li>
          <li className="mb-1.5">Select a chamber to load the bullet</li>
          <li className="mb-1.5">Cylinder spins → bullet position hidden</li>
          <li className="mb-1.5">PULL TRIGGER → fires top chamber</li>
          <li className="mb-1.5">If you survive, cylinder rotates one chamber</li>
          <li className="mb-1.5">CASH OUT anytime to collect winnings</li>
        </ol>
        <button
          className="font-pixel text-sm max-md:text-xs text-accent tracking-wide bg-transparent border border-border-default px-3 py-1.5 cursor-pointer transition-colors rounded hover:border-accent max-md:px-3.5 max-md:py-2"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function FairModal({ serverSeed, gameId, onClose }: { serverSeed: string | null; gameId: number | null; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/88 z-[1400] flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-label="Provably fair verification">
      <div className="w-[min(580px,92vw)] bg-bg-elevated border border-border-default rounded-xl p-6 flex flex-col gap-3.5 max-md:w-[calc(100vw-2rem)] max-md:p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="m-0 font-display text-sm max-md:text-xs text-accent tracking-[2px] text-center pb-2 border-b border-border-default">
          PROVABLY FAIR
        </h3>
        <p className="m-0 text-white leading-relaxed text-sm max-md:text-xs font-body">
          At game start, a seed hash is committed on-chain. After settlement, the server seed is revealed for verification.
        </p>
        {gameId && <p className="m-0 font-mono text-sm max-md:text-xs text-gray-100">Game ID: {gameId}</p>}
        {serverSeed ? (
          <>
            <p className="m-0 font-mono text-sm max-md:text-xs text-gray-100">Server Seed (revealed):</p>
            <p className="m-0 font-mono text-sm max-md:text-xs text-accent bg-accent/5 border border-border-default rounded p-2 break-all">
              {serverSeed}
            </p>
          </>
        ) : (
          <p className="m-0 font-mono text-sm max-md:text-xs text-gray-100">Seed will be revealed after settlement.</p>
        )}
        <button
          className="font-pixel text-sm max-md:text-xs text-accent tracking-wide bg-transparent border border-border-default px-3 py-1.5 cursor-pointer transition-colors rounded hover:border-accent max-md:px-3.5 max-md:py-2"
          onClick={onClose}
        >
          Close
        </button>
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
      setIsReloading(true);
      setActionHint('');

      soundRef.current?.playTrigger();
      await sleep(250);

      const result = await pullTrigger();

      if (result && !result.survived) {
        const bulletPos = result.bulletPosition ?? 0;
        const targetAngle = -(bulletPos * 60);
        const currentNormalized = cylinderRotation % 360;
        const delta = targetAngle - currentNormalized;
        setCylinderRotation(prev => prev + 360 + (delta % 360));
        soundRef.current?.playGunshot?.();
        setActionHint('');
        setSelectedChamber(null);
        setBulletVisible(false);
        await sleep(600);
        setIsReloading(false);
        return;
      }

      const nextRounds = gameState.roundsSurvived + 1;
      soundRef.current?.playEmptyChamber();
      setActionHint(`✓ YOU LIVE · R${nextRounds + 1}`);

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

  // Chamber positions — manually calibrated by Mason to match PNG
  const chamberOverlayPositions = [
    { left: 50,      top: 20.4  },  // 0° Top
    { left: 74.2,    top: 34.6  },  // 60° Top-right
    { left: 74.1344, top: 62.9  },  // 120° Bottom-right
    { left: 50,      top: 78.4  },  // 180° Bottom
    { left: 25.8,    top: 62.8  },  // 240° Bottom-left
    { left: 25.7,    top: 34.6  },  // 300° Top-left
  ];

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

  const getResultText = () => {
    if (gameState.status === 'won') return 'YOU LIVE.';
    if (gameState.status === 'lost') return 'YOU DIED.';
    return null;
  };

  return (
    <div className="flex flex-col items-center w-full">
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

      <div className="flex flex-col items-center gap-[26px] w-full max-w-[680px] bg-bg-surface border border-border-default py-1 px-0 max-md:bg-transparent max-md:border-none max-md:shadow-none max-md:p-3 max-md:max-w-full max-md:gap-3 max-md:pt-2">
        {/* Result Title or Game Title */}
        {isGameOver ? (
          <h1 className={`font-pixel text-[2.8rem] text-center tracking-[0.25em] mb-0.5 max-md:text-2xl max-md:tracking-[0.15em] max-sm:text-xl max-[360px]:text-lg ${
            gameState.status === 'won' ? 'text-accent' : 'text-danger'
          }`}>
            {getResultText()}
          </h1>
        ) : (
          <h1 className="font-pixel text-[2.8rem] text-center text-accent tracking-[0.15em] mb-0 max-md:text-xl max-md:tracking-[0.08em] max-sm:text-lg">
            DEGEN ROULETTE
          </h1>
        )}

        {/* Tagline */}
        <p className="font-body text-sm max-md:text-xs text-gray-100 text-center tracking-wide">
          1 BULLET. 6 CHAMBERS. HOW DEGEN ARE YOU?
        </p>

        {error && <p className="text-danger font-body text-sm text-center" role="alert">{error}</p>}
        {actionHint && (
          <p className="text-accent font-body text-sm max-md:text-xs font-bold min-h-[1.5em] text-center tracking-[2px]" aria-live="polite">
            {actionHint}
          </p>
        )}

        {/* Multiplier Table */}
        <div className="w-full flex flex-col gap-1 mb-0 max-w-[600px] mx-auto max-md:mb-0" role="group" aria-label="Round multipliers">
          <div className="grid grid-cols-5 gap-1.5 w-full max-md:gap-1.5">
            {MULTIPLIERS.map((m, idx) => (
              <div
                key={idx}
                aria-label={`Round ${idx + 1}: ${m.toFixed(2)}x`}
                className={`border rounded flex flex-col items-center gap-1 py-2 px-1 transition-all max-md:py-1.5 max-md:px-1 max-sm:p-1 ${
                  isActive && gameState.roundsSurvived === idx
                    ? 'border-accent border-2 bg-accent/10 scale-y-[1.15] scale-x-[1.04] z-[2] max-md:scale-y-[1.08] max-md:scale-x-[1.02]'
                    : 'border-border-default bg-bg-surface'
                }`}
              >
                <span className={`font-display text-sm max-md:text-xs tracking-wide ${
                  isActive && gameState.roundsSurvived === idx ? 'text-accent' : 'text-white'
                }`}>
                  Round {idx + 1}
                </span>
                <span className={`font-body text-sm max-md:text-xs font-bold ${
                  isActive && gameState.roundsSurvived === idx ? 'text-accent' : 'text-accent'
                }`}>
                  {m.toFixed(2)}x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats during active game */}
        {isActive && !!gameState.betAmount && (
          <StatsBar
            betAmount={gameState.betAmount}
            currentMultiplier={gameState.currentMultiplier}
            potentialWin={gameState.potentialWin}
            roundsSurvived={gameState.roundsSurvived}
          />
        )}

        {/* Revolver Cylinder */}
        <div className="relative w-[300px] h-[300px] mx-auto mt-0 mb-0 max-md:w-[min(300px,75vw)] max-md:h-[min(300px,75vw)] max-sm:w-[min(260px,70vw)] max-sm:h-[min(260px,70vw)] max-[360px]:w-[min(220px,60vw)] max-[360px]:h-[min(220px,60vw)]">
          {/* Barrel indicator */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-9 h-8 pointer-events-none max-md:w-8 max-md:h-7 max-sm:w-7 max-sm:h-6">
            <svg viewBox="0 0 40 36" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,65,0.15))' }}>
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

          {/* Cylinder PNG — rotates */}
          <div className="relative w-full h-full" style={{
            transition: spinTransition,
            transform: `rotate(${cylinderRotation}deg)`,
          }}>
            <img
              src="/cylinder-512.png"
              alt="Revolver cylinder - click chamber to spin"
              className={`w-full h-full object-contain select-none transition-all duration-700 ease-out ${
                cylinderPhase === 'spinning'
                  ? 'blur-[8px] brightness-[1.3]'
                  : !isActive && !isGameOver
                    ? 'brightness-[0.35] saturate-[0.3]'
                    : ''
              }`}
              style={{ filter: cylinderPhase !== 'spinning' && (isActive || isGameOver) ? 'drop-shadow(0 0 3px rgba(0,255,65,0.12))' : undefined }}
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
                  className={`absolute transition-all duration-200 ${canSelect ? 'cursor-pointer' : 'cursor-default'}`}
                  data-testid={`chamber-${i}`}
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '18.5%',
                    height: '18.5%',
                    borderRadius: '50%',
                  }}
                  onClick={() => canSelect && handleSelectChamber(i)}
                >
                  {(showBullet || isFired) && (
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65%] h-[65%] rounded-full transition-all duration-150"
                      style={{
                        background: isFired
                          ? 'radial-gradient(circle, #5a1a1a 30%, #FF3B3B 60%, #FF5C5C 80%, rgba(255,59,59,0.3) 100%)'
                          : 'radial-gradient(circle, #1a5a1a 30%, #00cc33 60%, #00ff41 80%, rgba(0,255,65,0.3) 100%)',
                        boxShadow: isFired
                          ? '0 0 10px rgba(255,59,59,0.6), 0 0 20px rgba(255,59,59,0.3), inset 0 0 8px rgba(0,0,0,0.4)'
                          : '0 0 10px rgba(0,255,65,0.6), 0 0 20px rgba(0,255,65,0.3), inset 0 0 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {/* Plus icon */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[14%] bg-white/85 rounded-sm" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14%] h-[40%] bg-white/85 rounded-sm" />
                    </div>
                  )}
                  {canSelect && (
                    <div
                      className="absolute -inset-[3px] rounded-full border-2 border-accent/40 animate-pulse"
                      style={{ boxShadow: '0 0 8px rgba(0,255,65,0.3), inset 0 0 8px rgba(0,255,65,0.15)' }}
                    />
                  )}
                  {isFired && (
                    <div
                      className="absolute inset-[8%] rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,59,59,0.4) 0%, rgba(255,59,59,0.1) 70%)',
                        boxShadow: '0 0 15px rgba(255,59,59,0.5), inset 0 0 10px rgba(255,59,59,0.5)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Betting Panel (idle state) */}
        {gameState.status === 'idle' && <BetPanel startGame={startGame} isLoading={isLoading} onShowFairModal={() => setShowFair(true)} />}

        {/* Active Game Controls */}
        {isActive && (
          <>
            <p className="font-body text-sm max-md:text-xs text-gray-200 text-center tracking-wide max-md:p-2">
              {getInstruction()}
            </p>
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={handlePullTrigger}
                disabled={!triggerReady}
                aria-label="Pull trigger - risk current round"
                className={`font-display text-sm px-9 py-4 border-2 rounded cursor-pointer transition-all uppercase tracking-[0.12em] max-md:w-full max-md:min-h-[48px] max-md:text-xs max-md:px-6 max-md:py-3.5 max-md:tracking-[0.08em] max-sm:text-xs max-sm:px-5 max-sm:py-3 ${
                  gameState.roundsSurvived >= 3
                    ? 'border-danger text-danger bg-bg-surface animate-pulse'
                    : 'border-accent text-accent bg-bg-surface shadow-[0_0_20px_rgba(0,255,65,0.15)] hover:bg-bg-elevated hover:shadow-[0_0_30px_rgba(0,255,65,0.25)] hover:-translate-y-0.5'
                } ${!triggerReady ? 'opacity-35 cursor-not-allowed' : ''} active:translate-y-0 disabled:opacity-35 disabled:cursor-not-allowed`}
                data-testid="pull-trigger-button"
              >
                {cylinderPhase === 'selecting' ? 'LOAD FIRST'
                  : cylinderPhase === 'spinning' ? 'SPINNING...'
                  : isReloading ? 'RELOADING...'
                  : 'PULL TRIGGER'}
              </button>
              {gameState.roundsSurvived >= 1 && cylinderPhase === 'ready' && (
                <button onClick={handleCashOut} disabled={isLoading || isReloading}
                  aria-label={`Cash out ${gameState.potentialWin.toFixed(3)} SOL`}
                  className="font-display text-sm max-md:text-xs px-4 py-2.5 bg-transparent border border-accent rounded text-accent cursor-pointer transition-all uppercase max-md:w-full max-md:min-h-[44px] max-md:px-4 max-md:py-3 hover:bg-accent/5"
                  data-testid="cashout-button">
                  CASH OUT
                </button>
              )}
            </div>
          </>
        )}


        {/* Settling State */}
        {isSettling && (
          <div className="flex flex-col items-center gap-3 mt-3">
            <div className="w-9 h-9 border-2 border-gray-300 border-t-accent rounded-full animate-spin" />
            <p className="font-body text-accent text-sm max-md:text-xs tracking-wide">SETTLING...</p>
          </div>
        )}

        {/* Footer Links */}
        <div className="flex gap-6 mt-0 justify-center max-md:gap-3 max-md:mt-0 max-md:flex-wrap">
          <button
            className="bg-bg-surface text-gray-100 font-body text-sm max-md:text-xs px-0 py-0 rounded cursor-pointer transition-colors flex items-center gap-1.5 hover:text-accent max-md:min-h-[36px]"
            onClick={() => setShowHowTo(true)}
            aria-label="How to play"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-70 max-md:w-[9px] max-md:h-[9px]">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            How to Play
          </button>
          <button
            className="bg-bg-surface text-gray-100 font-body text-sm max-md:text-xs px-0 py-0 rounded cursor-pointer transition-colors flex items-center gap-1.5 hover:text-accent max-md:min-h-[36px]"
            onClick={() => setShowFair(true)}
            aria-label="Provably fair verification"
            data-testid="provably-fair-button"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-70 max-md:w-[9px] max-md:h-[9px]">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            Provably Fair
          </button>
        </div>
      </div>

      {/* Result Overlay */}
      {isGameOver && (
        <ResultOverlay
          won={gameState.status === 'won'}
          betAmount={gameState.betAmount || 0}
          payout={gameState.payout || 0}
          multiplier={gameState.roundsSurvived > 0 ? MULTIPLIERS[gameState.roundsSurvived - 1] : MULTIPLIERS[0]}
          roundsSurvived={gameState.roundsSurvived}
          onNewGame={handleNewGame}
          onShowFair={() => setShowFair(true)}
        />
      )}
    </div>
  );
}
