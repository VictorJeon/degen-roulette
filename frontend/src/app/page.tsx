'use client';

import { GameBoard } from '@/components/GameBoard';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  return (
    <main className="min-h-screen scanline">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-cyber-pink text-glow">
            DEGEN ROULETTE V2
          </h1>
          <WalletMultiButton className="!bg-cyber-cyan !text-cyber-dark hover:!bg-opacity-80 transition-all" />
        </div>

        {/* Game Board */}
        <GameBoard />

        {/* Footer */}
        <div className="mt-12 text-center text-cyber-cyan text-sm opacity-60">
          <p>Provably Fair Russian Roulette on Solana Devnet</p>
          <p className="mt-2">6 Chambers • 1 Bullet • Progressive Multipliers</p>
        </div>
      </div>
    </main>
  );
}
