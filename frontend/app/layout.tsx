import type { Metadata } from "next";
import { Press_Start_2P, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WalletProviderWrapper } from "@/components/WalletProviderWrapper";
import { BufferPolyfill } from "@/components/BufferPolyfill";
import { ErrorReporterInit } from "@/components/ErrorReporterInit";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "DEGEN ROULETTE",
  description: "Russian Roulette on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(new URLSearchParams(window.location.search).get('testMode')==='true'){window.__TEST_MODE_ENABLED__=true;try{localStorage.setItem('walletName','"Test Wallet"');}catch(e){}}`,
          }}
        />
      </head>
      <body className={`${pressStart2P.variable} ${spaceGrotesk.variable}`}>
        <BufferPolyfill />
        <WalletProviderWrapper>
          <ErrorReporterInit />
          {children}
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
