'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useBet } from '@/hooks/useBet';
import { useGameState } from '@/hooks/useGameState';

export default function BetPanel() {
  const { publicKey } = useWallet();
  const { initGame, loading } = useBet();
  const { gameState } = useGameState();
  const [betAmount, setBetAmount] = useState(1);
  const [selectedBet, setSelectedBet] = useState(1);
  const [shakeBetting, setShakeBetting] = useState(false);
  const [instruction, setInstruction] = useState('');

  const quickBets = [0.1, 0.5, 1, 5, 10];

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
    <div className="flex flex-col items-center gap-4">
      {instruction && (
        <div className="font-pixel text-[0.6rem] text-accent animate-pulse">
          {instruction}
        </div>
      )}

      {!instruction && !gameState && (
        <div className="font-pixel text-[0.6rem] text-accent">
          &gt;&gt;&gt; SELECT YOUR BET &lt;&lt;&lt;
        </div>
      )}

      <div className={`flex flex-col gap-4 ${shakeBetting ? 'animate-shake' : ''}`}>
        <div className="flex gap-2 flex-wrap justify-center">
          {quickBets.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setBetAmount(amount);
                setSelectedBet(amount);
              }}
              disabled={loading}
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
          disabled={loading}
          className="font-pixel text-[0.7rem] px-6 py-3 bg-bg-tertiary border-[3px] border-border text-accent text-center focus:outline-none focus:border-accent"
          placeholder="Custom amount"
        />

        <button
          onClick={handleStartGame}
          disabled={loading}
          className="font-pixel text-[0.7rem] px-8 py-4 bg-accent border-[4px] border-accent-dim text-bg-primary uppercase tracking-wider shadow-[6px_6px_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#000] active:translate-x-1.5 active:translate-y-1.5 active:shadow-[0_0_0_#000] disabled:opacity-50 transition-all"
        >
          {loading ? 'LOADING...' : 'START'}
        </button>
      </div>
    </div>
  );
}
