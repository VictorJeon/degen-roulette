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

  useEffect(() => {
    console.log('[BetPanel] Wallet publicKey:', publicKey?.toString());
  }, [publicKey]);

  const quickBets = [0.001, 0.01, 0.05, 0.10, 0.25, 0.50];

  const handleStartGame = async () => {
    if (!publicKey) {
      setInstruction('CONNECT WALLET');
      return;
    }
    if (betAmount < MIN_BET) {
      setInstruction(`MIN: ${MIN_BET} SOL`);
      setShakeBetting(true);
      setTimeout(() => setShakeBetting(false), 300);
      return;
    }
    if (betAmount > MAX_BET) {
      setInstruction(`MAX: ${MAX_BET} SOL`);
      setShakeBetting(true);
      setTimeout(() => setShakeBetting(false), 300);
      return;
    }
    setInstruction('');
    try {
      await startGame(betAmount);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ERROR';
      setInstruction(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] mx-auto gap-4 max-md:px-4">
      {/* Error / instruction */}
      {instruction && (
        <p className="font-pixel text-sm text-danger text-center tracking-wide max-md:text-xs">
          {instruction}
        </p>
      )}

      <div className={`flex flex-col w-full gap-3 ${shakeBetting ? 'animate-shake' : ''}`}>

        {/* ── SOL Input: [−] [  0.01 SOL  ] [+] ── */}
        <div className="flex items-stretch h-12 border border-border-active overflow-hidden max-md:h-14">
          <button
            className="flex items-center justify-center w-12 border-r border-border-active font-body text-lg text-gray-100 transition-colors hover:text-white hover:bg-bg-elevated"
            onClick={() => setBetAmount(prev => Math.max(MIN_BET, +(prev - 0.001).toFixed(3)))}
            disabled={isLoading}
          >−</button>
          <div className="flex-1 min-w-0 relative flex items-center justify-center">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
              step="0.001"
              min={MIN_BET}
              disabled={isLoading}
              aria-label="Bet amount in SOL"
              className="w-full h-full bg-bg-primary px-4 pr-14 font-body text-lg text-white text-center outline-none max-md:text-base"
              data-testid="bet-amount-input"
            />
            <span className="absolute right-4 font-pixel text-sm text-gray-300 pointer-events-none max-md:text-xs">
              SOL
            </span>
          </div>
          <button
            className="flex items-center justify-center w-12 border-l border-border-active font-body text-lg text-gray-100 transition-colors hover:text-white hover:bg-bg-elevated"
            onClick={() => setBetAmount(prev => +(prev + 0.001).toFixed(3))}
            disabled={isLoading}
          >+</button>
        </div>

        {/* ── Quick Bets ── */}
        <div className="flex h-11 border border-border-active overflow-hidden max-md:h-12">
          {quickBets.map((amount, i) => (
            <button
              key={amount}
              onClick={() => { setBetAmount(amount); setSelectedBet(amount); }}
              disabled={isLoading}
              className={`flex-1 font-body text-base tracking-wide transition-colors max-md:text-sm ${
                i > 0 ? 'border-l border-border-active' : ''
              } ${
                selectedBet === amount
                  ? 'bg-white text-bg-primary'
                  : 'bg-bg-primary text-gray-100 hover:text-white hover:bg-bg-elevated'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* ── CTA — display font (Bungee) for impact ── */}
        <button
          onClick={handleStartGame}
          disabled={isLoading}
          className="w-full h-14 bg-accent font-display font-bold text-lg text-bg-primary tracking-[0.08em] uppercase transition-all hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 max-md:h-16 max-md:text-base"
          data-testid="start-game-button"
        >
          {isLoading ? 'SIGNING...' : `BET ${betAmount} SOL`}
        </button>
      </div>
    </div>
  );
}
