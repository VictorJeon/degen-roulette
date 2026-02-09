# Fix E2E Wallet - Phase 2

## 배경
Phase 1에서 TestWalletAdapter를 동기적으로 keypair 로드하도록 수정했으나, WalletProvider.tsx의 SSR 문제로 TestWalletAdapter가 wallets 배열에 포함 안 됨. 7/13 통과 (변화 없음).

## 근본 원인
`WalletProvider.tsx`에서 `isTestMode`를 `typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('testMode') === 'true'`로 체크하지만, SSR 시 window 없어서 false → wallets에 TestWalletAdapter 안 들어감 → hydration 후에도 useMemo가 재실행 안 됨.

## 수정 사항 (전부 구현할 것, 질문하지 말 것)

### 1. `components/WalletProvider.tsx`
useState + useEffect 패턴으로 변경:

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import type { Adapter } from '@solana/wallet-adapter-base';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('testMode') === 'true') {
      setIsTestMode(true);
    }
  }, []);

  const wallets = useMemo(() => {
    const adapters: Adapter[] = [new PhantomWalletAdapter()];
    if (isTestMode) {
      // Dynamic import 불필요 — TestWalletAdapter는 testMode일 때만 로드
      const { TestWalletAdapter } = require('@/lib/test-wallet-adapter');
      console.log('[WalletProvider] Test mode detected, adding TestWalletAdapter');
      adapters.unshift(new TestWalletAdapter());
      // autoConnect를 위해 localStorage에 wallet name 기록
      try {
        localStorage.setItem('walletName', '"Test Wallet"');
      } catch {}
    }
    return adapters;
  }, [isTestMode]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
```

### 2. `lib/test-wallet-adapter.ts`
Phase 1에서 이미 동기적 keypair 로드로 수정됨. 그대로 유지. 단, connect() 호출 시 `_connected = true` 세팅 + emit 확인.

### 3. `playwright/fixtures/test-setup.ts`
setupTestMode에서 wallet adapter가 연결될 때까지 대기 보강:

```typescript
// 기존 __TEST_WALLET_READY__ 대기 후 추가:
// wallet-adapter-react가 publicKey를 인식할 때까지 대기
await page.waitForFunction(
  () => {
    // BetPanel의 wallet button이 connected 상태인지 확인
    const walletBtn = document.querySelector('.wallet-adapter-button');
    const text = walletBtn?.textContent || '';
    // "Select Wallet" 이 아닌 주소 형태(7sGV...)가 보이면 연결 완료
    return text.length > 0 && !text.includes('Select') && !text.includes('Connect');
  },
  { timeout: 15000 }
);
```

### 4. 테스트 실행 & 검증
수정 후 반드시 실행:
```bash
npx playwright test --reporter=line 2>&1 | tee /tmp/playwright-results.log
```
결과를 `/tmp/playwright-results.log`에 저장하고, 마지막에 pass/fail 수치 보고.

## 프로젝트 정보
- 경로: 현재 디렉토리 (frontend/)
- 테스트 키페어: `playwright/fixtures/test-keypair.json` (배열[64])
- 테스트 지갑: `7sGVDuAUW8g4noZggELMgQrpLQbTeARfpViVWrT7WRbW`

## 주의사항
- 질문하지 말고 전부 구현할 것
- tsc --noEmit으로 타입 체크도 할 것
- wallet-adapter의 autoConnect localStorage key가 `walletName`인지 소스 확인 후 정확한 key 사용
