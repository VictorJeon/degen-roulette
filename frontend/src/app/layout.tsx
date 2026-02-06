import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';

export const metadata: Metadata = {
  title: 'Degen Roulette V2',
  description: 'Provably Fair Russian Roulette on Solana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cyber-darker min-h-screen">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
