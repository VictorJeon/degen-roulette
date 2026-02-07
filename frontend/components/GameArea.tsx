'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SoundEngine } from '@/lib/sound';

type GamePhase = 'betting' | 'loading' | 'spinning' | 'playing';

export default function GameArea() {
  const { publicKey } = useWallet();
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
  const [betAmount, setBetAmount] = useState(1);
  const [multiplier, setMultiplier] = useState(1.0);
  const [survived, setSurvived] = useState(0);
  const [chambers, setChambers] = useState(6);
  const [currentChamber, setCurrentChamber] = useState(0);
  const [bulletPos, setBulletPos] = useState(-1);
  const [selectedBet, setSelectedBet] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [showMultiplierPopup, setShowMultiplierPopup] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [showFlashSuccess, setShowFlashSuccess] = useState(false);
  const [showFlashDeath, setShowFlashDeath] = useState(false);
  const [showDeathOverlay, setShowDeathOverlay] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [winTitle, setWinTitle] = useState('ESCAPED');
  const [showCashout, setShowCashout] = useState(false);
  const [cylinderRotation, setCylinderRotation] = useState(0);
  const [activeChamber, setActiveChamber] = useState(-1);
  const [firedChambers, setFiredChambers] = useState<number[]>([]);
  const [showBulletAt, setShowBulletAt] = useState(-1);
  const [shakeBetting, setShakeBetting] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soundRef = useRef<SoundEngine | null>(null);

  const quickBets = [0.1, 0.5, 1, 5, 10];
  const multipliers = [1.0, 1.2, 1.5, 2.0, 3.0, 6.0];

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

  const startGame = async () => {
    if (!publicKey) {
      setInstruction('>>> CONNECT WALLET FIRST <<<');
      return;
    }

    if (betAmount < 0.01) {
      setInstruction('>>> SELECT YOUR BET <<<');
      setShakeBetting(true);
      setTimeout(() => setShakeBetting(false), 300);
      return;
    }

    setInstruction('');
    setGamePhase('loading');
  };

  const loadBullet = async (chamberIndex: number) => {
    if (gamePhase !== 'loading' || isAnimating) return;

    setBulletPos(chamberIndex);
    setShowBulletAt(chamberIndex);
    playSound('bulletLoad');

    await sleep(300);
    setGamePhase('spinning');
  };

  const spinCylinder = async () => {
    if (gamePhase !== 'spinning' || isAnimating) return;
    setIsAnimating(true);

    // Reset game state
    setChambers(6);
    setCurrentChamber(0);
    setMultiplier(1.0);
    setSurvived(0);
    setFiredChambers([]);

    // Spin animation
    const randomSpins = 3 + Math.random() * 2;
    const randomOffset = Math.floor(Math.random() * 6) * 60;
    setCylinderRotation(360 * randomSpins + randomOffset);
    playSound('spin');

    await sleep(400);

    // Hide bullet indicator
    setShowBulletAt(-1);

    await sleep(1100);

    // Reset rotation visually
    setCylinderRotation(0);

    // Show LOADED popup
    setShowLoadPopup(true);
    await sleep(800);
    setShowLoadPopup(false);

    setGamePhase('playing');
    setIsAnimating(false);
  };

  const pullTrigger = async () => {
    if (isAnimating || gamePhase !== 'playing') return;
    setIsAnimating(true);

    setActiveChamber(currentChamber);
    await sleep(300);
    playSound('trigger');
    setInstruction('');

    await sleep(500);

    const isDead = currentChamber === bulletPos;

    if (isDead) {
      // Show bullet and shoot
      setShowBulletAt(currentChamber);
      await sleep(200);
      playSound('gunshot');
      await sleep(100);
      death();
    } else {
      // Empty chamber
      playSound('empty');
      setFiredChambers([...firedChambers, currentChamber]);

      // Rotate to next chamber
      await sleep(300);
      const nextRotation = -(currentChamber + 1) * 60;
      setCylinderRotation(nextRotation);

      survive();
    }
  };

  const survive = async () => {
    setShowFlashSuccess(true);
    
    const newSurvived = survived + 1;
    const newChambers = chambers - 1;
    const newMultiplier = multipliers[newSurvived] || multiplier;

    setSurvived(newSurvived);
    setChambers(newChambers);
    setCurrentChamber(currentChamber + 1);
    setMultiplier(newMultiplier);

    setShowMultiplierPopup(true);

    if (newMultiplier >= 6) {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 400);
    }

    await sleep(500);
    setShowFlashSuccess(false);

    await sleep(newMultiplier >= 3 ? 2000 : 1000);
    setShowMultiplierPopup(false);

    if (newSurvived >= 1) {
      setShowCashout(true);
    }

    setIsAnimating(false);
    setActiveChamber(-1);

    // Auto win at 5 survived
    if (newSurvived >= 5) {
      await sleep(1000);
      autoWin();
    }
  };

  const death = async () => {
    createParticles();
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 400);

    setShowFlashDeath(true);
    await sleep(300);

    // Add to leaderboard (localStorage)
    addToLeaderboard(multiplier);

    setShowDeathOverlay(true);
    setShowCashout(false);
    setGamePhase('betting');
  };

  const cashout = async () => {
    if (isAnimating || gamePhase !== 'playing') return;

    setInstruction('>>> CASHING OUT... <<<');
    // Mock transaction
    await sleep(500);

    setGamePhase('betting');
    addToLeaderboard(multiplier);
    
    setWinTitle('ESCAPED');
    setShowWinOverlay(true);
    setShowCashout(false);
  };

  const autoWin = async () => {
    setGamePhase('betting');
    
    setShowMultiplierPopup(true);
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 400);

    await sleep(1500);
    setShowMultiplierPopup(false);

    addToLeaderboard(multiplier);
    
    setWinTitle('GIGACHAD');
    setShowWinOverlay(true);
    setShowCashout(false);
  };

  const resetGame = () => {
    setGamePhase('betting');
    setShowDeathOverlay(false);
    setShowWinOverlay(false);
    setShowFlashDeath(false);
    setChambers(6);
    setBulletPos(-1);
    setCurrentChamber(0);
    setMultiplier(1.0);
    setSurvived(0);
    setIsAnimating(false);
    setCylinderRotation(0);
    setActiveChamber(-1);
    setFiredChambers([]);
    setShowBulletAt(-1);
    setShowCashout(false);
    setWinTitle('ESCAPED');
    setInstruction('');
  };

  const createParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: cx,
        y: cy,
        size: Math.random() * 5 + 2,
        speedX: (Math.random() - 0.5) * 15,
        speedY: (Math.random() - 0.5) * 15,
        color: `hsl(${Math.random() * 20}, 100%, 50%)`,
        life: 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.02;
        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      });
      if (particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    animate();
  };

  const addToLeaderboard = (mult: number) => {
    if (mult < 1.5) return;
    const scores = JSON.parse(localStorage.getItem('degen_leaderboard') || '[]');
    scores.push({
      address: publicKey?.toString() || 'Anonymous',
      multiplier: parseFloat(mult.toFixed(1)),
      timestamp: Date.now(),
    });
    scores.sort((a: any, b: any) => b.multiplier - a.multiplier || a.timestamp - b.timestamp);
    const top10 = scores.slice(0, 10);
    localStorage.setItem('degen_leaderboard', JSON.stringify(top10));
    window.dispatchEvent(new Event('leaderboard-update'));
  };

  const getChamberPosition = (index: number) => {
    const angle = (index * 60 - 90) * (Math.PI / 180);
    const x = 100 + 65 * Math.cos(angle);
    const y = 100 + 65 * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-8 relative ${shakeScreen ? 'animate-shake' : ''}`}>
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999 }}
      />

      {/* Flash overlays */}
      {showFlashSuccess && (
        <div className="fixed inset-0 bg-[#00ff88] opacity-20 pointer-events-none" style={{ zIndex: 999 }} />
      )}
      {showFlashDeath && (
        <div className="fixed inset-0 bg-[#ff3b3b] opacity-30 pointer-events-none" style={{ zIndex: 999 }} />
      )}

      {/* Title */}
      <div className="text-center">
        <h1 className="font-pixel text-[1.4rem] text-accent text-glow-strong tracking-wider">
          DEGEN ROULETTE
        </h1>
        <p className="font-pixel text-[0.5rem] text-text-muted mt-2 tracking-wider">
          PULL THE TRIGGER OR CASH OUT
        </p>
      </div>

      {/* Instruction */}
      {instruction && (
        <div className={`font-pixel text-[0.6rem] text-accent animate-pulse ${gamePhase === 'loading' ? 'text-[1rem]' : ''}`}>
          {instruction}
        </div>
      )}
      {gamePhase === 'loading' && !instruction && (
        <div className="font-pixel text-[1rem] text-accent animate-pulse">
          PICK YOUR DOOM
        </div>
      )}
      {gamePhase === 'betting' && !instruction && (
        <div className="font-pixel text-[0.6rem] text-accent">
          &gt;&gt;&gt; SELECT YOUR BET &lt;&lt;&lt;
        </div>
      )}
      {gamePhase === 'spinning' && (
        <div className="font-pixel text-[0.6rem] text-accent">
          &gt;&gt;&gt; MIX IT UP &lt;&lt;&lt;
        </div>
      )}

      {/* Cylinder */}
      <div className="relative w-[280px] h-[280px]">
        {/* Hammer */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 text-3xl animate-pulse">
          🔨
        </div>

        <svg
          className="w-full h-full transition-transform duration-[1500ms] ease-in-out"
          style={{ 
            transform: `rotate(${cylinderRotation}deg)`,
            transition: cylinderRotation === 0 ? 'none' : 'transform 1500ms cubic-bezier(0.25, 0.1, 0.25, 1)'
          }}
          viewBox="0 0 200 200"
        >
          {/* Outer ring */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="#333333" strokeWidth="2" />
          {/* Center */}
          <circle cx="100" cy="100" r="30" fill="#1a1a1a" stroke="#a3e635" strokeWidth="2" />

          {/* Chambers */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const { x, y } = getChamberPosition(i);
            const isActive = activeChamber === i;
            const isFired = firedChambers.includes(i);
            const isSelected = bulletPos === i && gamePhase === 'loading';
            const showBullet = showBulletAt === i;

            return (
              <g
                key={i}
                onClick={() => loadBullet(i)}
                style={{ cursor: gamePhase === 'loading' ? 'pointer' : 'default' }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill={isFired ? 'rgba(239, 68, 68, 0.3)' : '#0a0a0a'}
                  stroke={
                    isActive
                      ? '#ff3b3b'
                      : isSelected
                      ? '#a3e635'
                      : i === currentChamber && gamePhase === 'playing'
                      ? '#a3e635'
                      : '#333333'
                  }
                  strokeWidth={isActive || isSelected || (i === currentChamber && gamePhase === 'playing') ? 3 : 2}
                  className="transition-all duration-300"
                />
                {/* Bullet indicator */}
                {showBullet && (
                  <circle cx={x} cy={y} r="6" fill="#ff3b3b" className="animate-pulse" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats */}
      <div className="flex gap-8 flex-wrap justify-center">
        <div className="text-center min-w-[100px]">
          <div className="font-pixel text-[0.45rem] text-text-muted uppercase mb-1">Bet</div>
          <div className="font-pixel text-[0.9rem] text-text-primary">{betAmount.toFixed(2)} SOL</div>
        </div>
        <div className="text-center min-w-[100px]">
          <div className="font-pixel text-[0.45rem] text-text-muted uppercase mb-1">Multiplier</div>
          <div className="font-pixel text-[0.9rem] text-accent text-glow">{multiplier.toFixed(1)}x</div>
        </div>
        <div className="text-center min-w-[100px]">
          <div className="font-pixel text-[0.45rem] text-text-muted uppercase mb-1">Potential</div>
          <div className="font-pixel text-[0.9rem] text-success text-glow-success">
            {(betAmount * multiplier).toFixed(4)} SOL
          </div>
        </div>
        <div className="text-center min-w-[100px]">
          <div className="font-pixel text-[0.45rem] text-text-muted uppercase mb-1">Odds</div>
          <div className="font-pixel text-[0.9rem] text-text-secondary">1 in {chambers}</div>
        </div>
      </div>

      {/* Betting UI */}
      {gamePhase === 'betting' && (
        <div className={`flex flex-col gap-4 ${shakeBetting ? 'animate-shake' : ''}`}>
          <div className="flex gap-2 flex-wrap justify-center">
            {quickBets.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setBetAmount(amount);
                  setSelectedBet(amount);
                }}
                className={`font-pixel text-[0.55rem] px-4 py-2 border-2 transition-all ${
                  selectedBet === amount
                    ? 'bg-accent text-bg-primary border-accent-dim shadow-[4px_4px_0_#000]'
                    : 'bg-bg-tertiary text-text-secondary border-border hover:border-accent'
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            step="0.1"
            min="0.01"
            className="font-pixel text-[0.7rem] px-6 py-3 bg-bg-tertiary border-[3px] border-border text-accent text-center focus:outline-none focus:border-accent"
            placeholder="Custom amount"
          />
          <button
            onClick={startGame}
            className="font-pixel text-[0.7rem] px-8 py-4 bg-accent border-[4px] border-accent-dim text-bg-primary uppercase tracking-wider shadow-[6px_6px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0_0_0_#000] transition-all"
          >
            START
          </button>
        </div>
      )}

      {/* Spinning phase */}
      {gamePhase === 'spinning' && (
        <button
          onClick={spinCylinder}
          disabled={isAnimating}
          className="font-pixel text-[0.7rem] px-8 py-4 bg-accent border-[4px] border-accent-dim text-bg-primary uppercase tracking-wider shadow-[6px_6px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0_0_0_#000] disabled:opacity-50 transition-all"
        >
          SPIN IT
        </button>
      )}

      {/* Playing phase */}
      {gamePhase === 'playing' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={pullTrigger}
            disabled={isAnimating}
            className={`font-pixel text-[0.7rem] px-8 py-4 uppercase tracking-wider shadow-[6px_6px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0_0_0_#000] disabled:opacity-50 transition-all ${
              chambers <= 2
                ? 'bg-danger border-[4px] border-[#aa0000] text-white animate-pulse'
                : 'bg-accent border-[4px] border-accent-dim text-bg-primary'
            }`}
          >
            SHOT
          </button>
          {showCashout && (
            <button
              onClick={cashout}
              className="font-pixel text-[0.55rem] px-6 py-3 bg-transparent border-[3px] border-success text-success uppercase shadow-[4px_4px_0_#000] text-glow-success hover:bg-success hover:text-bg-primary hover:shadow-[2px_2px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              CASH OUT
            </button>
          )}
        </div>
      )}

      {/* Multiplier popup */}
      {showMultiplierPopup && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
          <div className="font-pixel text-[2rem] text-accent text-glow-strong animate-pulse">
            {multiplier >= 6 ? 'MAX DEGEN' : survived >= 5 ? 'GIGACHAD' : `${multiplier.toFixed(1)}x`}
          </div>
        </div>
      )}

      {/* Load popup */}
      {showLoadPopup && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
          <div className="font-pixel text-[1.5rem] text-accent text-glow animate-pulse">● LOADED</div>
        </div>
      )}

      {/* Death overlay */}
      {showDeathOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center" style={{ zIndex: 2000 }}>
          <div className="text-center">
            <div className="font-pixel text-[2rem] text-danger mb-8">YOU DIED</div>
            <div className="font-pixel text-[1rem] text-text-secondary mb-2">FINAL MULTIPLIER</div>
            <div className="font-pixel text-[1.5rem] text-accent text-glow mb-6">{multiplier.toFixed(1)}x</div>
            <div className="font-pixel text-[0.7rem] text-text-muted mb-8">SURVIVED {survived} ROUNDS</div>
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
            <div className="font-pixel text-[2rem] text-success text-glow-success mb-8">{winTitle}</div>
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
