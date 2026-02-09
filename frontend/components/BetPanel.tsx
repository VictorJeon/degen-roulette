'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { MIN_BET, MAX_BET } from '@/lib/constants';
import { getPublicKey } from '@/lib/testMode';

interface BetPanelProps {
  startGame: (betAmount: number) => Promise<void>;
  isLoading: boolean;
  onShowFairModal?: () => void;
}

export default function BetPanel({ startGame, isLoading, onShowFairModal }: BetPanelProps) {
  const { publicKey: walletPublicKey } = useWallet();
  const publicKey = getPublicKey(walletPublicKey);
  const [betAmount, setBetAmount] = useState(0.01);
  const [selectedBet, setSelectedBet] = useState(0.01);
  const [shakeBetting, setShakeBetting] = useState(false);
  const [instruction, setInstruction] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('[BetPanel] Wallet publicKey:', publicKey?.toString());
  }, [publicKey]);

  const quickBets = [0.001, 0.01, 0.05, 0.10, 0.25, 0.50];

  const handleStartGame = async () => {
    if (!publicKey) {
      setInstruction('>>> CONNECT WALLET FIRST <<<');
      return;
    }

    if (betAmount < MIN_BET) {
      setInstruction(`>>> MIN BET: ${MIN_BET} SOL <<<`);
      setShakeBetting(true);
      setTimeout(() => setShakeBetting(false), 300);
      return;
    }

    if (betAmount > MAX_BET) {
      setInstruction(`>>> MAX BET: ${MAX_BET} SOL <<<`);
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

  // Calculate potential payout/loss (using R3 multiplier as reference)
  const potentialPayout = (betAmount * 1.94).toFixed(3);
  const potentialLoss = betAmount.toFixed(2);

  return (
    <div className="bet-panel">
      <div className="game-instruction">
        {instruction || '>>> SELECT YOUR BET <<<'}
      </div>

      <div className={`inline-betting ${shakeBetting ? 'animate-shake' : ''}`}>
        <div className="bet-input-wrapper">
          <span className="bet-currency-label">SOL</span>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            step="0.001"
            min={MIN_BET}
            disabled={isLoading}
            aria-label="Bet amount in SOL"
            className="bet-input-inline"
            data-testid="bet-amount-input"
          />
          <button
            className="arrow-btn"
            onClick={() => setBetAmount(prev => Math.max(MIN_BET, prev - 0.001))}
            disabled={isLoading}
          >
            −
          </button>
          <button
            className="arrow-btn"
            onClick={() => setBetAmount(prev => prev + 0.001)}
            disabled={isLoading}
          >
            +
          </button>
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
          <span>Potential Payout: <strong>{potentialPayout}</strong></span>
          <span className="separator">·</span>
          <span>Potential Loss: <strong>{potentialLoss} SOL</strong></span>
        </div>

        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="trigger-btn trigger-btn-start"
          data-testid="start-game-button"
        >
          <span className="btn-inner">
            {isLoading ? 'SIGNING...' : `BET ${betAmount} SOL`}
          </span>
        </button>

        <button className="fair-badge" onClick={onShowFairModal}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          PROVABLY FAIR
        </button>
      </div>

      <style jsx>{`
        .bet-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .bet-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background:
            linear-gradient(180deg, rgba(0, 25, 0, 0.7) 0%, rgba(0, 15, 0, 0.85) 100%);
          border: 2px solid var(--border-neon-bright);
          border-radius: 4px;
          padding: 0.5rem 0.7rem;
          position: relative;
          box-shadow:
            0 0 10px var(--neon-glow-subtle),
            inset 0 0 15px rgba(0, 255, 65, 0.03);
          width: 100%;
          max-width: 300px;
        }

        .bet-input-inline {
          font-family: var(--pixel-font);
          font-size: 0.9rem;
          width: 130px;
          padding: 0.4rem 0.5rem;
          background: transparent;
          border: none;
          color: var(--neon);
          text-align: center;
          flex: 1;
        }

        .bet-input-inline:focus {
          outline: none;
        }

        .bet-input-wrapper:focus-within {
          border-color: var(--neon);
          box-shadow:
            0 0 12px var(--neon-glow),
            0 0 25px var(--neon-glow-soft),
            0 0 40px var(--neon-glow-subtle),
            inset 0 0 20px rgba(0, 255, 65, 0.05);
        }

        .bet-arrows {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .arrow-btn {
          background: rgba(0, 255, 65, 0.1);
          border: 1px solid var(--border-dim);
          border-radius: 2px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s;
          min-width: 20px;
          min-height: 20px;
        }

        .arrow-btn:hover {
          color: var(--neon);
          border-color: var(--neon);
        }

        .bet-currency {
          font-family: var(--pixel-font);
          font-size: 0.5rem;
          color: var(--text-muted);
          margin-left: 0.3rem;
        }

        .payout-info {
          font-family: var(--pixel-font);
          font-size: 0.38rem;
          color: var(--text-muted);
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 0.3rem;
          flex-wrap: wrap;
          text-align: center;
        }

        .payout-info strong {
          color: var(--text-secondary);
          text-shadow: 0 0 4px var(--neon-glow-subtle);
        }

        .separator {
          color: var(--text-dim);
        }

        .btn-inner {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .bet-input-wrapper {
            max-width: 100%;
          }

          .bet-input-inline {
            font-size: 16px; /* Prevent iOS zoom */
            min-height: 44px;
          }

          .arrow-btn {
            min-width: 24px;
            min-height: 24px;
          }

          .payout-info {
            font-size: 0.34rem;
            gap: 0.4rem;
          }
        }

        @media (max-width: 480px) {
          .bet-input-inline {
            font-size: 16px; /* Critical for iOS */
          }

          .payout-info {
            font-size: 0.32rem;
          }
        }
      `}</style>
    </div>
  );
}
