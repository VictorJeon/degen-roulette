# Fix E2E Test Wallet Adapter Connection

## 문제
7/13 테스트 통과, 6개 실패. 원인: TestWalletAdapter 연결이 게임 시작 시점에 끊겨 `useAnchorWallet()` → null publicKey.

## 근본 원인: 레이스 컨디션 + autoConnect 미동작

### 현재 흐름
1. `WalletProvider.tsx` → `autoConnect` 활성, `TestWalletAdapter` 추가
2. `TestModeProvider.tsx` → `useEffect`에서 비동기 `import()` → `window.solana` 설정 → `__TEST_WALLET_READY__` = true
3. `TestWalletAdapter` 생성자 → `__TEST_WALLET_READY__` 체크 → 없으면 `test-wallet-ready` 이벤트 대기
4. 이벤트 수신 → `readyState` 변경 + `connect()` 호출

### 문제점
- **타이밍**: `WalletProvider` useMemo가 먼저 실행 → adapter 생성 → 생성자에서 `__TEST_WALLET_READY__` 아직 false
- **autoConnect 조건**: wallet-adapter-react의 autoConnect는 `localStorage`에 이전 연결 기록(`walletName`)이 있어야 작동. 첫 실행에는 기록 없음.
- **connect() 실패**: 이벤트 리스너로 `connect()` 호출하지만, wallet-adapter-react의 내부 state와 동기화 안 됨. adapter가 자체적으로 `connect()` 호출해도 React context의 `wallet`/`publicKey` state가 업데이트 안 될 수 있음.
- **결과**: `useWallet().publicKey` = null, `useAnchorWallet()` = null → 게임 시작 실패

## 해결 방안

### 방법 1: TestWalletAdapter를 동기적으로 초기화 (권장)

keypair를 TestWalletAdapter 내부에 하드코딩하거나 동기적으로 로드하여, adapter 생성 시점에 이미 publicKey가 세팅되어 있게 함.

**변경 파일:**

#### 1. `lib/test-wallet-adapter.ts`
- 생성자에서 keypair를 직접 로드 (test-keypair.json을 inline하거나 동기 import)
- 생성 시점에 `publicKey` 세팅
- `readyState = Installed` 즉시 세팅
- `connect()`에서 window.solana 의존 제거 → 자체 keypair로 서명

#### 2. `lib/test-wallet.ts` (수정 불필요하지만 참고)
- `createTestWallet()`은 `window.solana`에 주입하는 용도로 남겨두되, TestWalletAdapter가 직접 keypair를 갖도록

#### 3. `components/TestModeProvider.tsx`
- `window.solana` 주입은 유지 (smoke 테스트 등에서 사용)
- TestWalletAdapter는 이제 window.solana에 의존하지 않음

#### 4. `components/WalletProvider.tsx`
- autoConnect 관련: `wallets` 배열에 TestWalletAdapter가 있으면 localStorage에 `walletName: "Test Wallet"` 세팅
- 또는 `autoConnect` prop 대신 TestWalletAdapter의 readyState를 Loadable → Installed로 즉시 세팅하여 autoConnect 트리거

### 구체적 구현

```typescript
// lib/test-wallet-adapter.ts - 핵심 변경

import { Keypair } from '@solana/web3.js';
import testKeypairData from '../playwright/fixtures/test-keypair.json';

export class TestWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = 'Test Wallet' as WalletName;
  // ...

  private _keypair: Keypair;
  private _publicKey: PublicKey | null;

  constructor() {
    super();
    // 동기적으로 keypair 로드
    this._keypair = Keypair.fromSecretKey(Uint8Array.from(testKeypairData));
    this._publicKey = this._keypair.publicKey;
    this._readyState = WalletReadyState.Installed;
  }

  get publicKey() { return this._publicKey; }
  get connected() { return !!this._publicKey; }

  async connect(): Promise<void> {
    if (this.connected) return;
    this._publicKey = this._keypair.publicKey;
    this.emit('connect', this._publicKey);
  }

  async signTransaction<T>(tx: T): Promise<T> {
    // 자체 keypair로 직접 서명 (window.solana 불필요)
    if (tx instanceof VersionedTransaction) {
      tx.sign([this._keypair]);
    } else {
      (tx as Transaction).sign(this._keypair);
    }
    return tx;
  }
}
```

```typescript
// components/WalletProvider.tsx - autoConnect 보장

if (isTestMode && typeof window !== 'undefined') {
  // wallet-adapter가 autoConnect할 수 있도록 localStorage에 기록
  localStorage.setItem('walletName', '"Test Wallet"');
}
```

### 방법 2: Playwright 테스트에서 수동 connect 트리거 (보조)

테스트 코드에서 wallet button 클릭 → Test Wallet 선택 → 연결. 하지만 UI가 변할 수 있어 깨지기 쉬움. 방법 1이 더 안정적.

## 테스트 수정

테스트 파일들의 `setupTestMode()` 후 추가 대기:
```typescript
// 기존: await setupTestMode(page);
// 추가: wallet-adapter context가 publicKey를 인식할 때까지 대기
await page.waitForFunction(
  () => {
    // wallet-adapter-react가 publicKey를 세팅했는지 확인
    // BetPanel의 start 버튼이 활성화되는 것으로 확인 가능
    const btn = document.querySelector('[data-testid="start-game-button"]');
    return btn && !btn.textContent?.includes('CONNECT');
  },
  { timeout: 15000 }
);
```

## 프로젝트 정보
- 경로: `/Users/nova/projects/degen-roulette/frontend/`
- 테스트: `npx playwright test --reporter=line`
- 테스트 키페어: `playwright/fixtures/test-keypair.json` (배열[64])
- 테스트 지갑: `7sGVDuAUW8g4noZggELMgQrpLQbTeARfpViVWrT7WRbW`
- Node/pnpm으로 빌드 (ARM64 호환)

## 검증
1. `npx playwright test tests/e2e/smoke.spec.ts` — smoke 먼저 확인
2. `npx playwright test` — 전체 통과 확인
3. 실패하는 테스트 로그에서 `useAnchorWallet` / `publicKey: null` 확인

## 주의사항
- test-keypair.json을 번들에 포함하면 보안 이슈 → testMode=true일 때만 로드되도록 dynamic import 유지하되, TestWalletAdapter 내부에서는 동기 import 사용
- `resolveJsonModule: true`가 tsconfig에 있어야 JSON import 가능
- wallet-adapter-react의 `autoConnect`는 `localStorage.getItem('walletName')`을 체크 — 정확한 key name은 `@solana/wallet-adapter-react` 소스 확인 필요

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
