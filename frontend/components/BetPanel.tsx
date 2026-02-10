'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { MIN_BET, MAX_BET } from '@/lib/constants';
import { getPublicKey } from '@/lib/testMode';

interface BetPanelProps {
  startGame: (betAmount: number) => Promise<void>;
  isLoading: boolean;
  onShowFairModal?: () => void;
}

export default function BetPanel({ startGame, isLoading, onShowFairModal }: BetPanelProps) {
  const { publicKey: walletPublicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const publicKey = getPublicKey(walletPublicKey);
  const [betAmount, setBetAmount] = useState(0.05);
  const [selectedBet, setSelectedBet] = useState(0.05);
  const [shakeBetting, setShakeBetting] = useState(false);
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    console.log('[BetPanel] Wallet publicKey:', publicKey?.toString());
  }, [publicKey]);

  const quickBets = [0.001, 0.01, 0.05, 0.10, 0.25, 0.50];

  const handleStartGame = async () => {
    // If wallet not connected, open wallet modal
    if (!connected) {
      setVisible(true);
      return;
    }

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
    <div className={`flex flex-col items-center w-full max-w-[460px] mx-auto gap-3 max-md:px-4 ${shakeBetting ? 'animate-shake' : ''}`}>
      {/* Error / instruction */}
      {instruction && (
        <p className="font-body text-sm text-danger text-center tracking-wide max-md:text-xs">
          {instruction}
        </p>
      )}

      {/* ── Custom Amount (input first) ── */}
      <div className="flex items-stretch h-10 w-full border border-border-active bg-bg-primary overflow-hidden max-md:h-12">
        <button
          className="flex items-center justify-center w-10 border-r border-border-active font-body text-lg text-gray-100 transition-colors hover:text-accent hover:bg-bg-elevated max-md:w-11"
          onClick={() => setBetAmount(prev => Math.max(MIN_BET, +(prev - 0.001).toFixed(3)))}
          disabled={isLoading}
        >−</button>
        <div className="flex-1 min-w-0 relative flex items-center justify-center">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setBetAmount(val);
              setSelectedBet(val);
            }}
            step="0.001"
            min={MIN_BET}
            disabled={isLoading}
            aria-label="Bet amount in SOL"
            className="w-full h-full bg-transparent px-4 pr-14 font-body text-lg text-white text-center outline-none max-md:text-base"
            data-testid="bet-amount-input"
          />
          <span className="absolute right-4 font-body text-xs text-gray-300 pointer-events-none">
            SOL
          </span>
        </div>
        <button
          className="flex items-center justify-center w-10 border-l border-border-active font-body text-lg text-gray-100 transition-colors hover:text-accent hover:bg-bg-elevated max-md:w-11"
          onClick={() => setBetAmount(prev => +(prev + 0.001).toFixed(3))}
          disabled={isLoading}
        >+</button>
      </div>

      {/* ── Quick Bets ── */}
      <div className="flex gap-2 w-full max-md:gap-1.5">
        {quickBets.map((amount) => (
          <button
            key={amount}
            onClick={() => { setBetAmount(amount); setSelectedBet(amount); }}
            disabled={isLoading}
            className={`flex-1 h-9 font-body text-base tracking-wide transition-all max-md:h-10 max-md:text-sm ${
              selectedBet === amount
                ? 'bg-accent text-bg-primary font-bold border border-accent'
                : 'bg-bg-elevated text-gray-100 border border-border-default hover:border-gray-300 hover:text-white'
            }`}
          >
            {amount}
          </button>
        ))}
      </div>

      {/* ── CTA ── */}
      <button
        onClick={handleStartGame}
        disabled={isLoading}
        className="w-full h-12 bg-accent font-display font-bold text-xl text-bg-primary tracking-[0.08em] uppercase transition-all hover:brightness-110 hover:-translate-y-px hover:shadow-[0_0_20px_rgba(0,255,65,0.25)] active:translate-y-0 active:brightness-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none max-md:h-14 max-md:text-lg"
        data-testid="start-game-button"
      >
        {isLoading ? 'SIGNING...' : connected ? `BET ${betAmount} SOL` : 'CONNECT WALLET'}
      </button>
    </div>
  );
}
