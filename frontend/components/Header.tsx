'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export default function Header() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();

    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  return (
    <header className="border-b-[3px] border-border bg-bg-secondary">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="font-pixel text-[0.9rem] text-accent text-glow tracking-wider flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="filter drop-shadow-[0_0_6px_var(--accent-glow)]">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            DEGEN ROULETTE
          </div>
        </div>

        <div className="flex items-center gap-4">
          {publicKey && balance !== null && (
            <div className="font-pixel text-[0.6rem] text-text-secondary px-4 py-2 bg-bg-tertiary border-2 border-border">
              <span className="text-accent">{balance.toFixed(2)}</span> SOL
            </div>
          )}

          <WalletMultiButton className="!bg-accent !border-[3px] !border-accent-dim !font-pixel !text-[0.55rem] !text-bg-primary !px-4 !py-2 !shadow-[4px_4px_0_#000] hover:!translate-x-0.5 hover:!translate-y-0.5 hover:!shadow-[2px_2px_0_#000] !transition-all !rounded-none" />
        </div>
      </div>
    </header>
  );
}
