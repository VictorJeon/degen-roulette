'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface BetPanelProps {
  startGame: (betAmount: number) => Promise<void>;
  isLoading: boolean;
}

export default function BetPanel({ startGame, isLoading }: BetPanelProps) {
  const { publicKey } = useWallet();
  const [betAmount, setBetAmount] = useState(0.01);
  const [selectedBet, setSelectedBet] = useState(0.01);
  const [shakeBetting, setShakeBetting] = useState(false);
  const [instruction, setInstruction] = useState('');

  const quickBets = [0.005, 0.001, 0.013, 0.015, 0.03];

  const handleStartGame = async () => {
    if (!publicKey) {
      setInstruction('>>> CONNECT WALLET FIRST <<<');
      return;
    }

    if (betAmount < 0.001) {
      setInstruction('>>> SELECT YOUR BET <<<');
      setShakeBetting(true);
      setTimeout(() => setShakeBetting(false), 300);
      return;
    }

    setInstruction('');

    try {
      await startGame(betAmount);
      setInstruction('>>> GAME STARTED <<<');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ERROR';
      setInstruction(`>>> ${errorMessage} <<<`);
    }
  };

  // Calculate potential payout/loss
  const potentialPayout = (betAmount * 1.94).toFixed(3);
  const potentialLoss = betAmount.toFixed(2);

  return (
    <>
      <div className="game-instruction">
        {instruction || '>>> SELECT YOUR BET <<<'}
      </div>

      <div className={`inline-betting ${shakeBetting ? 'animate-shake' : ''}`}>
        <div className="bet-row">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            step="0.001"
            min="0.001"
            disabled={isLoading}
            aria-label="Bet amount in SOL"
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
              disabled={isLoading}
              className={`quick-btn-inline ${selectedBet === amount ? 'selected' : ''}`}
            >
              {amount}
            </button>
          ))}
        </div>

        <div className="payout-info">
          <span>Potential Payout: {potentialPayout}</span>
          <span className="separator">·</span>
          <span>Potential Loss: {potentialLoss} SOL</span>
        </div>

        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="trigger-btn trigger-btn-start"
        >
          {isLoading ? 'SIGNING...' : 'PLAY AGAIN'}
        </button>

        <div className="fair-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          Provably Fair
        </div>
      </div>

      <style jsx>{`
        .payout-info {
          font-family: var(--pixel-font);
          font-size: 0.4rem;
          color: var(--text-muted);
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 0.3rem;
        }

        .separator {
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
