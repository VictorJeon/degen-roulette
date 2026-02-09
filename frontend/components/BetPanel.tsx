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

  const potentialPayout = (betAmount * 1.94).toFixed(3);
  const potentialLoss = betAmount.toFixed(2);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="font-display text-2xs text-gray-200 text-center tracking-wide">
        {instruction || '>>> SELECT YOUR BET <<<'}
      </div>

      <div className={`flex flex-col items-center gap-2.5 mt-2.5 w-full max-w-[360px] ${shakeBetting ? 'animate-shake' : ''}`}>
        <div className="flex items-center gap-1.5 bg-bg-surface border border-border-default rounded-xl px-3 py-2 w-full max-w-[300px] max-md:max-w-full focus-within:border-accent transition-colors">
          <span className="font-display text-2xs text-gray-200">SOL</span>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            step="0.001"
            min={MIN_BET}
            disabled={isLoading}
            aria-label="Bet amount in SOL"
            className="font-display text-sm w-[130px] flex-1 px-2 py-1.5 bg-transparent border-none text-accent text-center outline-none max-md:text-[16px] max-md:min-h-[44px]"
            data-testid="bet-amount-input"
          />
          <button
            className="bg-accent/10 border border-border-default rounded-sm text-gray-200 cursor-pointer p-0.5 flex items-center justify-center transition-colors min-w-5 min-h-5 max-md:min-w-6 max-md:min-h-6 hover:text-accent hover:border-accent"
            onClick={() => setBetAmount(prev => Math.max(MIN_BET, prev - 0.001))}
            disabled={isLoading}
          >
            −
          </button>
          <button
            className="bg-accent/10 border border-border-default rounded-sm text-gray-200 cursor-pointer p-0.5 flex items-center justify-center transition-colors min-w-5 min-h-5 max-md:min-w-6 max-md:min-h-6 hover:text-accent hover:border-accent"
            onClick={() => setBetAmount(prev => prev + 0.001)}
            disabled={isLoading}
          >
            +
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap justify-center">
          {quickBets.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setBetAmount(amount);
                setSelectedBet(amount);
              }}
              disabled={isLoading}
              className={`font-display text-[0.625rem] px-2.5 py-2 border rounded cursor-pointer transition-colors ${
                selectedBet === amount
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border-default text-gray-200 bg-transparent hover:border-accent hover:text-accent'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>

        <div className="font-display text-[0.5rem] text-gray-200 flex gap-2 justify-center mt-1 flex-wrap text-center max-md:text-[0.5rem]">
          <span>Potential Payout: <strong className="text-gray-100">{potentialPayout}</strong></span>
          <span className="text-gray-300">·</span>
          <span>Potential Loss: <strong className="text-gray-100">{potentialLoss} SOL</strong></span>
        </div>

        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="w-full max-w-[420px] font-display text-lg px-8 py-5 border-2 border-accent rounded bg-bg-surface text-accent cursor-pointer transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,65,0.15)] hover:bg-bg-elevated hover:shadow-[0_0_30px_rgba(0,255,65,0.25)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
          data-testid="start-game-button"
        >
          {isLoading ? 'SIGNING...' : `BET ${betAmount} SOL`}
        </button>

        <button className="flex items-center gap-1.5 font-display text-[0.5rem] text-gray-200 uppercase bg-transparent border border-border-default rounded px-3 py-1.5 cursor-pointer transition-colors hover:border-accent hover:text-accent" onClick={onShowFairModal}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px] opacity-70">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          PROVABLY FAIR
        </button>
      </div>
    </div>
  );
}
