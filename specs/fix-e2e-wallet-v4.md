# Fix E2E Wallet - Phase 4 (WalletContext 직접 주입)

## 배경
Phase 1~3에서 wallet-adapter-react의 WalletProvider가 adapter.connect()를 useWallet() context에 반영하지 않는 설계 제약 확인. WalletProvider를 우회하는 방법으로 전환.

## 핵심 발견
`WalletContext`가 `@solana/wallet-adapter-react`에서 export됨:
```typescript
import { WalletContext } from '@solana/wallet-adapter-react';
```

## 해결 방법: testMode일 때 WalletProvider 대신 mock WalletContext 사용

### 1. `components/TestWalletProvider.tsx` (신규)

testMode일 때 WalletProvider를 대체하는 컴포넌트. WalletContext.Provider에 직접 mock value 주입.

```typescript
'use client';

import { useMemo, useCallback, useState } from 'react';
import { WalletContext } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import nacl from 'tweetnacl';
import testKeypairData from '../playwright/fixtures/test-keypair.json';

export function TestWalletProvider({ children }: { children: React.ReactNode }) {
  const keypair = useMemo(() => Keypair.fromSecretKey(Uint8Array.from(testKeypairData)), []);
  const [connected, setConnected] = useState(true); // 시작부터 연결

  const signTransaction = useCallback(async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
    if (tx instanceof VersionedTransaction) {
      tx.sign([keypair]);
    } else {
      (tx as Transaction).sign(keypair);
    }
    return tx;
  }, [keypair]);

  const signAllTransactions = useCallback(async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
    return Promise.all(txs.map(tx => signTransaction(tx)));
  }, [signTransaction]);

  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    return nacl.sign.detached(message, keypair.secretKey);
  }, [keypair]);

  const contextValue = useMemo(() => ({
    autoConnect: true,
    wallets: [],
    wallet: null,
    publicKey: keypair.publicKey,
    connecting: false,
    connected: true,
    disconnecting: false,

    select: () => {},
    connect: async () => {},
    disconnect: async () => { setConnected(false); },
    sendTransaction: async () => { throw new Error('Use signTransaction instead'); },

    signTransaction,
    signAllTransactions,
    signMessage,
  }), [keypair, signTransaction, signAllTransactions, signMessage]);

  return (
    <WalletContext.Provider value={contextValue as any}>
      {children}
    </WalletContext.Provider>
  );
}
```

### 2. `components/WalletProvider.tsx` 수정

testMode 감지 → TestWalletProvider 사용, 아니면 기존 WalletProvider 사용.

```typescript
'use client';

import { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { TestWalletProvider } from './TestWalletProvider';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const [isTestMode, setIsTestMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    setIsTestMode(params.get('testMode') === 'true');
  }, []);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // SSR 중에는 아무것도 렌더하지 않음 (hydration mismatch 방지)
  if (!mounted) return null;

  return (
    <ConnectionProvider endpoint={endpoint}>
      {isTestMode ? (
        <TestWalletProvider>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </TestWalletProvider>
      ) : (
        <SolanaWalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </SolanaWalletProvider>
      )}
    </ConnectionProvider>
  );
}
```

### 3. `playwright/fixtures/test-setup.ts` 수정

WalletContext에서 직접 publicKey가 세팅되므로, useWallet().publicKey가 즉시 사용 가능.

```typescript
export async function setupTestMode(page: Page): Promise<void> {
  await page.goto('/?testMode=true', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // TestWalletProvider가 WalletContext에 publicKey를 직접 주입하므로,
  // wallet button에 주소가 표시될 때까지 대기
  await page.waitForFunction(
    () => {
      // window.solana 또는 wallet button 상태 확인
      const btn = document.querySelector('.wallet-adapter-button');
      if (!btn) return false;
      const text = btn.textContent || '';
      return text.length > 4 && !text.includes('Select') && !text.includes('Connect');
    },
    { timeout: 15000, polling: 200 }
  );

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  console.log('[Test Setup] Test mode setup complete');
}
```

### 4. `components/TestModeProvider.tsx`
더 이상 wallet injection 안 함. window.solana는 TestWalletProvider에서 세팅 (optional, smoke 테스트 호환):

TestWalletProvider의 useEffect에 추가:
```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    (window as any).solana = {
      isPhantom: true,
      isConnected: true,
      publicKey: keypair.publicKey,
      connect: async () => ({ publicKey: keypair.publicKey }),
      disconnect: async () => {},
      signTransaction,
      signAllTransactions,
      signMessage: async (msg: Uint8Array) => ({ signature: nacl.sign.detached(msg, keypair.secretKey) }),
    };
    (window as any).__TEST_WALLET_READY__ = true;
    window.dispatchEvent(new CustomEvent('test-wallet-ready'));
  }
}, [keypair]);
```

### 5. 타입 체크 & 테스트 실행

```bash
npx tsc --noEmit 2>&1 | head -20
npx playwright test --reporter=line 2>&1 | tee /tmp/playwright-results-v4.log
```

## 주의사항
- **질문하지 말고 전부 구현할 것**
- WalletContext의 value 타입이 정확히 맞아야 함 — `@solana/wallet-adapter-react`의 `WalletContextState` 타입 import해서 확인
- `useAnchorWallet()` 훅은 `useWallet()`에서 `publicKey`, `signTransaction`, `signAllTransactions`를 가져옴 → 이 3개가 contextValue에 있으면 동작
- `sendTransaction`은 Connection 필요 → ConnectionProvider가 감싸고 있으므로 OK. 하지만 useGame 등에서 직접 사용할 수 있으니 stub이 아니라 실제 구현 필요할 수 있음 — 에러 발생 시 확인
- `resolveJsonModule: true` 확인됨 (tsconfig)
- Playwright 테스트 180초 timeout 설정 (playwright.config.ts)
- 테스트 실행 결과를 반드시 `/tmp/playwright-results-v4.log`에 저장
