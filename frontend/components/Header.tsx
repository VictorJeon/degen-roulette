'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';

interface HeaderProps {
  resultText?: string;
  showResult?: boolean;
}

export default function Header({ resultText, showResult }: HeaderProps) {
  const [totalPlays] = useState(12847);
  const [showBanner, setShowBanner] = useState(true);

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center h-14 px-5 bg-bg-surface border-b border-border-default relative z-100 max-md:grid-cols-[1fr_auto] max-md:px-2 max-md:h-12" aria-label="Game header">
      <img src="/dg-icon.svg" alt="Degen Roulette" className="w-[33px] h-[33px] mr-auto" />
      <div className="bg-bg-elevated border border-border-default rounded whitespace-nowrap px-2 py-1.5 max-md:hidden">
        <span className="font-display text-sm max-md:text-xs text-gray-100">TOTAL PLAYS:</span> <span className="font-body text-sm max-md:text-xs text-accent ml-1">{totalPlays.toLocaleString()}</span>
      </div>

      {showResult && resultText && showBanner && (
        <div className="flex items-center justify-center gap-3 px-6 py-2 bg-bg-elevated border-2 border-accent rounded-full col-start-2 max-md:hidden">
          <span className="font-pixel text-sm max-md:text-xs text-accent tracking-widest">RESULT: {resultText}</span>
          <button
            className="bg-transparent border-none text-gray-200 cursor-pointer p-0.5 text-lg leading-none hover:text-accent transition-colors"
            onClick={() => setShowBanner(false)}
            aria-label="Close result banner"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 col-start-3 max-md:col-start-2">
        <a
          href="https://x.com"
          target="_blank"
          rel="noreferrer"
          className="font-pixel text-sm max-md:text-xs text-gray-100 no-underline border border-border-default rounded px-2 py-1.5 transition-colors hover:text-accent hover:border-accent"
          aria-label="Open X"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>

        <div className="max-w-[180px] max-md:max-w-[140px] max-sm:max-w-[120px] overflow-hidden">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
