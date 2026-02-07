'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Header() {
  return (
    <header className="border-b-[3px] border-border bg-bg-secondary">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="font-pixel text-[0.8rem] text-accent text-glow tracking-wider">
            DEGEN ROULETTE
          </div>
          <div className="font-pixel text-[0.4rem] text-text-muted hidden sm:block">
            v1.0 ALPHA
          </div>
        </div>
        
        <WalletMultiButton className="!bg-accent !border-[3px] !border-accent-dim !font-pixel !text-[0.55rem] !text-bg-primary !px-4 !py-2 !shadow-[4px_4px_0_#000] hover:!translate-x-0.5 hover:!translate-y-0.5 hover:!shadow-[2px_2px_0_#000] !transition-all" />
      </div>
    </header>
  );
}
