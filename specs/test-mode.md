# Test Mode for Browser E2E

## 목적
Playwright E2E 테스트에서 Phantom 팝업 없이 실제 devnet TX를 실행하는 테스트 모드

## 트리거
- URL에 `?testMode=true` 쿼리 파라미터

## 동작

### 1. 테스트 지갑 주입
```typescript
// testMode일 때 window.solana를 테스트 지갑으로 대체
if (isTestMode) {
  window.solana = createTestWallet(TEST_KEYPAIR);
}
```

### 2. 테스트 지갑 구현
- `connect()`: 즉시 publicKey 반환 (팝업 없음)
- `signTransaction(tx)`: 테스트 키페어로 실제 서명
- `signAllTransactions(txs)`: 동일
- `signMessage(msg)`: 테스트 키페어로 서명
- `disconnect()`: 상태 초기화

### 3. 테스트 키페어
- 위치: `frontend/tests/e2e/test-keypair.json` (이미 존재)
- 주소: `7sGVDuAUW8g4noZggELMgQrpLQbTeARfpViVWrT7WRbW`
- devnet SOL 충전 필요 (airdrop 또는 수동)

## 구현 위치

### `frontend/lib/test-wallet.ts` (신규)
```typescript
import { Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';

export function createTestWallet(keypairBytes: number[]) {
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairBytes));
  
  return {
    isPhantom: true,
    isConnected: true,
    publicKey: keypair.publicKey,
    
    connect: async () => ({ publicKey: keypair.publicKey }),
    disconnect: async () => {},
    
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      if (tx instanceof Transaction) {
        tx.sign(keypair);
      } else {
        tx.sign([keypair]);
      }
      return tx;
    },
    
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      return Promise.all(txs.map(tx => this.signTransaction(tx)));
    },
    
    signMessage: async (message: Uint8Array) => {
      return { signature: nacl.sign.detached(message, keypair.secretKey) };
    },
  };
}
```

### `frontend/app/layout.tsx` 또는 `providers.tsx`
```typescript
'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { createTestWallet } from '@/lib/test-wallet';
import testKeypair from '@/tests/e2e/test-keypair.json';

function TestModeProvider({ children }) {
  const searchParams = useSearchParams();
  const isTestMode = searchParams.get('testMode') === 'true';
  
  useEffect(() => {
    if (isTestMode && typeof window !== 'undefined') {
      (window as any).solana = createTestWallet(testKeypair);
      console.log('[TEST MODE] Test wallet injected');
    }
  }, [isTestMode]);
  
  return children;
}
```

## E2E 테스트 수정

### `tests/e2e/helpers/test-setup.ts`
```typescript
export async function setupTestMode(page: Page) {
  // testMode=true로 접속
  await page.goto('http://localhost:3000?testMode=true');
  
  // 테스트 지갑이 주입될 때까지 대기
  await page.waitForFunction(() => (window as any).solana?.isConnected);
}
```

### 테스트 시나리오
1. `setupTestMode(page)` 호출
2. Connect 버튼 클릭 → 즉시 연결 (팝업 없음)
3. Bet 설정 → Start Game 클릭
4. 실제 devnet TX 서명 및 전송
5. TX 확인 후 UI 상태 검증

## 보안 고려
- `testMode`는 devnet에서만 동작
- 프로덕션 빌드에서는 테스트 키페어 번들링 제외 (`.gitignore` 또는 조건부 import)
- 실제 자금이 있는 키페어 사용 금지

## 검증 기준
1. `pnpm test:e2e` 실행 시 모든 시나리오 통과
2. 실제 devnet TX가 explorer에서 확인 가능
3. 테스트 완료 후 테스트 지갑 잔액 정상 (gas fee만 소모)

## 의존성
- `tweetnacl`, `@types/tweetnacl` 설치 필요
- 설치 명령: `pnpm add tweetnacl && pnpm add -D @types/tweetnacl`
