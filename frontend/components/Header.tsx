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
    <header className="header">
      <div className="stats-badge">
        Total Plays: <span>{totalPlays.toLocaleString()}</span>
      </div>

      {showResult && resultText && showBanner && (
        <div className="result-banner">
          <span className="result-banner-text">RESULT: {resultText}</span>
          <button
            className="result-banner-close"
            onClick={() => setShowBanner(false)}
            aria-label="Close result banner"
          >
            ×
          </button>
        </div>
      )}

      <div className="header-right">
        <a
          href="https://x.com"
          target="_blank"
          rel="noreferrer"
          className="x-link"
          aria-label="Open X"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>

        <WalletMultiButton />
      </div>
    </header>
  );
}
