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
          X
        </a>

        <WalletMultiButton />
      </div>
    </header>
  );
}
