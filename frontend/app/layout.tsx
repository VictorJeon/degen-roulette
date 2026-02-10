import type { Metadata } from "next";
import { Silkscreen, Bungee, Space_Mono } from "next/font/google";
import "./globals.css";
import { WalletProviderWrapper } from "@/components/WalletProviderWrapper";
import { BufferPolyfill } from "@/components/BufferPolyfill";
import { ErrorReporterInit } from "@/components/ErrorReporterInit";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--nf-pixel",
});

const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
  variable: "--nf-heading",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--nf-body",
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
      <body className={`${silkscreen.variable} ${bungee.variable} ${spaceMono.variable}`}>
        <BufferPolyfill />
        <WalletProviderWrapper>
          <ErrorReporterInit />
          {children}
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
