'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBet } from '@/hooks/useBet';
import { useGameState } from '@/hooks/useGameState';

export default function BetPanel() {
  const { publicKey } = useWallet();
  const { initGame, loading } = useBet();
  const { gameState } = useGameState();
  const [betAmount, setBetAmount] = useState(0.01);
  const [selectedBet, setSelectedBet] = useState(0.01);
  const [shakeBetting, setShakeBetting] = useState(false);
  const [instruction, setInstruction] = useState('');

  // House vault ~0.16 SOL, maxBetPct 10% = max 0.016 SOL
  const quickBets = [0.005, 0.01, 0.015];

  const handleStartGame = async () => {
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

    try {
      await initGame(betAmount);
      setInstruction('>>> GAME STARTED <<<');
    } catch (err: any) {
      setInstruction(`>>> ERROR: ${err.message} <<<`);
    }
  };

  const isGameActive = gameState && 'active' in gameState.status;

  // Hide bet panel if game is active
  if (isGameActive) {
    return null;
  }

  return (
    <>
      {instruction && (
        <div className="game-instruction">
          {instruction}
        </div>
      )}

      {!instruction && !gameState && (
        <div className="game-instruction">
          &gt;&gt;&gt; SELECT YOUR BET &lt;&lt;&lt;
        </div>
      )}

      <div className={`inline-betting ${shakeBetting ? 'animate-shake' : ''}`}>
        <div className="bet-row">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            step="0.1"
            min="0.01"
            disabled={loading}
            className="bet-input-inline"
          />
          <span className="bet-currency">SOL</span>
        </div>

        <div className="quick-amounts-inline">
          {quickBets.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setBetAmount(amount);
                setSelectedBet(amount);
              }}
              disabled={loading}
              className={`quick-btn-inline ${selectedBet === amount ? 'selected' : ''}`}
            >
              {amount}
            </button>
          ))}
        </div>

        <button
          onClick={handleStartGame}
          disabled={loading}
          className="trigger-btn"
        >
          {loading ? 'LOADING...' : 'START'}
        </button>

        {/* Provably Fair Badge */}
        <div className="fair-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          Provably Fair
        </div>
      </div>
    </>
  );
}
