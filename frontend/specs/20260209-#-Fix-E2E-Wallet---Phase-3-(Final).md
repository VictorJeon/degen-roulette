# Fix E2E Wallet - Phase 3 (Final)

## 핵심 문제
wallet-adapter-react의 WalletProvider는 `wallets` prop이 렌더 후 변경되어도 내부 state를 업데이트 안 함. 동적으로 TestWalletAdapter를 추가하면 useWallet() context에 반영 안 됨.

## 해결 방법: 항상 포함, 조건부 활성화

TestWalletAdapter를 **항상** wallets 배열에 넣되, `testMode=true`일 때만 `WalletReadyState.Installed`로 전환.

## 구현 (전부 구현, 질문 금지)

### 1. `lib/test-wallet-adapter.ts` 수정

```typescript
import {
  BaseMessageSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from '@solana/wallet-adapter-base';
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';

// Keypair를 동기적으로 로드 (빌드 타임)
import testKeypairData from '../playwright/fixtures/test-keypair.json';

export class TestWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = 'Test Wallet' as WalletName;
  url = 'https://test.wallet';
  icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkwyIDdWMTNDMiAxOC41NSA1Ljg0IDE5Ljc0IDkgMjAiIHN0cm9rZT0iIzAwRkY0MSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
  supportedTransactionVersions = new Set(['legacy', 0] as const);

  private _keypair: Keypair;
  private _publicKey: PublicKey | null = null;
  private _connecting = false;
  private _connected = false;
  private _readyState: WalletReadyState = WalletReadyState.NotDetected;

  constructor() {
    super();
    this._keypair = Keypair.fromSecretKey(Uint8Array.from(testKeypairData));

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('testMode') === 'true') {
        this._readyState = WalletReadyState.Installed;
        // autoConnect을 위해 localStorage 세팅
        try {
          localStorage.setItem('walletName', JSON.stringify(this.name));
        } catch {}
      }
    }
  }

  get publicKey() { return this._publicKey; }
  get connecting() { return this._connecting; }
  get connected() { return this._connected; }
  get readyState() { return this._readyState; }

  async connect(): Promise<void> {
    if (this._connected || this._connecting) return;
    this._connecting = true;
    try {
      this._publicKey = this._keypair.publicKey;
      this._connected = true;
      // window.solana도 세팅 (smoke 테스트용)
      if (typeof window !== 'undefined') {
        (window as any).solana = {
          isPhantom: true,
          isConnected: true,
          publicKey: this._publicKey,
          connect: async () => ({ publicKey: this._publicKey }),
          disconnect: async () => {},
          signTransaction: (tx: any) => this.signTransaction(tx),
          signAllTransactions: (txs: any) => this.signAllTransactions(txs),
          signMessage: async (msg: Uint8Array) => ({ signature: nacl.sign.detached(msg, this._keypair.secretKey) }),
        };
        (window as any).__TEST_WALLET_READY__ = true;
        window.dispatchEvent(new CustomEvent('test-wallet-ready'));
      }
      this.emit('connect', this._publicKey);
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    this._publicKey = null;
    this._connected = false;
    this.emit('disconnect');
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (!this._connected) throw new Error('Wallet not connected');
    if (tx instanceof VersionedTransaction) {
      tx.sign([this._keypair]);
    } else {
      (tx as Transaction).sign(this._keypair);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return Promise.all(txs.map(tx => this.signTransaction(tx)));
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._connected) throw new Error('Wallet not connected');
    return nacl.sign.detached(message, this._keypair.secretKey);
  }
}
```

### 2. `components/WalletProvider.tsx` 수정

```typescript
'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { TestWalletAdapter } from '@/lib/test-wallet-adapter';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // TestWalletAdapter를 항상 포함 (testMode 아니면 NotDetected 상태)
  const wallets = useMemo(() => [
    new TestWalletAdapter(),
    new PhantomWalletAdapter(),
  ], []);

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

### 3. `components/TestModeProvider.tsx` 수정
TestWalletAdapter가 window.solana 세팅을 직접 하므로, TestModeProvider의 useEffect에서 하던 window.solana 세팅 로직은 **제거하거나 no-op으로 변경**. TestModeProvider는 남겨두되, wallet injection 로직은 삭제.

```typescript
'use client';
import { useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

export function TestModeProvider({ children }: { children: ReactNode }) {
  // TestWalletAdapter가 모든 것을 처리하므로 여기서는 아무것도 안 함
  return <>{children}</>;
}
```

### 4. `playwright/fixtures/test-setup.ts` 수정
window.solana 대기 대신 wallet-adapter의 connect 완료를 대기:

```typescript
export async function setupTestMode(page: Page): Promise<void> {
  await page.goto('/?testMode=true', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // wallet-adapter autoConnect 완료 대기
  await page.waitForFunction(
    () => {
      const w = window as any;
      return w.__TEST_WALLET_READY__ === true && w.solana?.isConnected === true;
    },
    { timeout: 30000, polling: 100 }
  );

  // useWallet() context 반영 대기 — wallet button 텍스트로 확인
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('.wallet-adapter-button');
      if (!btn) return false;
      const text = btn.textContent || '';
      // 주소의 첫 4자가 보이면 연결 완료 (예: "7sGV...WRbW")
      return text.length > 0 && !text.includes('Select') && !text.includes('Connect');
    },
    { timeout: 15000, polling: 200 }
  );

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}
```

### 5. 타입 체크 & 테스트 실행

```bash
npx tsc --noEmit 2>&1 | head -20
npx playwright test --reporter=line 2>&1 | tee /tmp/playwright-results-v3.log
```

## 프로젝트
- 경로: 현재 디렉토리 (frontend/)
- 테스트 키페어: `playwright/fixtures/test-keypair.json`
- wallet 주소: `7sGVDuAUW8g4noZggELMgQrpLQbTeARfpViVWrT7WRbW`

## 주의
- 질문하지 말고 전부 구현
- `test-keypair.json`은 `resolveJsonModule: true`로 import 가능 (tsconfig 확인됨)
- wallet-adapter-react의 autoConnect localStorage key 정확히 확인: `@solana/wallet-adapter-react` 패키지의 useLocalStorage 참고. key가 `walletName`이 아닐 수 있음 — 소스 확인 필수.
- 프로덕션에서 TestWalletAdapter는 NotDetected 상태라 모달에 안 보이고, autoConnect도 안 됨 → 영향 없음

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
