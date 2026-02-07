'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';

export default function Header() {
  const [totalPlays] = useState(12847);

  return (
    <header className="border-b border-border bg-bg-secondary">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-accent filter drop-shadow-[0_0_6px_var(--accent-glow)]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
          </svg>
          <span className="font-pixel text-[0.9rem] text-accent text-glow tracking-[0.1em]">
            DEGEN ROULETTE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-pixel text-[0.6rem] text-text-secondary px-4 py-[0.6rem] bg-bg-tertiary border-2 border-border">
            Total Plays: <span className="text-accent">{totalPlays.toLocaleString()}</span>
          </div>

          <WalletMultiButton className="!bg-accent !border-[3px] !border-accent-dim !font-pixel !text-[0.55rem] !text-bg-primary !px-4 !py-[0.7rem] !shadow-[4px_4px_0_#000] hover:!translate-x-0.5 hover:!translate-y-0.5 hover:!shadow-[2px_2px_0_#000] active:!translate-x-1 active:!translate-y-1 active:!shadow-[0_0_0_#000] !transition-all !rounded-none !uppercase" />
        </div>
      </div>
    </header>
  );
}
