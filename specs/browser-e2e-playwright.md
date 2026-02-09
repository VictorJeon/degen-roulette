# Degen Roulette 브라우저 E2E 테스트 (Playwright)

## 목표
실제 브라우저 환경에서 Phantom wallet mock을 사용한 완전 자동화 E2E 테스트 구축.

## 요구사항

### 1. Playwright 설치 및 설정
- `@playwright/test` 설치
- Chromium 브라우저 설치
- `playwright.config.ts` 생성 (devnet 환경)

### 2. Phantom Wallet Mock
두 가지 접근법 중 선택:

**Option A: Solana Wallet Adapter Mock**
```typescript
// playwright/fixtures/wallet-mock.ts
// window.solana 객체 주입
// signTransaction, signAllTransactions 자동 승인
```

**Option B: Browser Extension Mock**
- Phantom extension 수동 설치 불가 → mock provider 주입

**권장: Option A** (간단하고 안정적)

### 3. 테스트 시나리오

#### 시나리오 1: Happy Path (Win)
1. 페이지 접속: https://frontend-umber-kappa-32.vercel.app/
2. 지갑 연결 (mock wallet auto-connect)
3. 베팅 금액 입력: 0.01 SOL
4. Chamber 선택: 1번
5. Start 버튼 클릭
   - TX 서명 자동 승인
   - "게임 시작됨" 상태 확인
6. Pull Trigger 클릭 (2라운드)
7. 결과 확인:
   - 생존 시: "You survived!" 메시지
   - 승리 금액 표시
   - 잔액 업데이트
8. Provably Fair 모달 확인
   - Server seed 표시
   - Verify 버튼 동작

#### 시나리오 2: Edge Case (Lose)
- 동일하지만 1라운드만 Pull → 사망 확인

#### 시나리오 3: Error Handling
- 잔액 부족 → 에러 메시지 확인
- 중복 start → "Active game already exists" 핸들링

### 4. Mock Wallet 구현 스펙

```typescript
// playwright/fixtures/mock-wallet.ts
export const mockPhantomWallet = {
  publicKey: new PublicKey('5pUv3FqUnY1wWW1NkRgLzPJF3Xvu3HmRHipAZ1T4oQvj'),
  isPhantom: true,
  signTransaction: async (tx) => {
    // 실제 서명 (테스트 키페어 사용)
    return tx;
  },
  signAllTransactions: async (txs) => txs,
  connect: async () => ({ publicKey: mockPhantomWallet.publicKey }),
  disconnect: async () => {},
};

// Playwright에서 주입
await page.addInitScript(() => {
  window.solana = mockPhantomWallet;
});
```

### 5. 파일 구조

```
frontend/
├── playwright.config.ts
├── tests/
│   └── e2e/
│       ├── game-flow.spec.ts          # 메인 테스트
│       ├── error-handling.spec.ts     # 에러 케이스
│       └── provably-fair.spec.ts      # 검증 플로우
├── playwright/
│   ├── fixtures/
│   │   ├── mock-wallet.ts             # Phantom mock
│   │   └── test-keypair.json          # 테스트 지갑 키페어
│   └── utils/
│       └── wallet-utils.ts            # 지갑 헬퍼
└── package.json (scripts 추가)
```

### 6. package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## 기술 고려사항

### Wallet Keypair
- `/Users/nova/projects/degen-roulette/frontend/scripts/e2e-test-v3.mjs`에서 사용 중인 키페어 재사용
- `5pUv3FqUnY1wWW1NkRgLzPJF3Xvu3HmRHipAZ1T4oQvj` (이미 0.05 SOL 충전됨)

### RPC
- Devnet: `https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6`
- Frontend는 이미 devnet으로 설정됨

### TX 확인
- Solana Explorer devnet 링크 자동 생성
- TX signature 로그 출력

## 제약사항

1. **실제 서명 필요**: Mock이지만 유효한 서명 생성해야 함
2. **비동기 처리**: TX 확인 대기 시간 (최대 30초)
3. **House settle**: Pull 후 백그라운드 settle 대기 필요

## 산출물

### 파일
- [ ] `playwright.config.ts`
- [ ] `tests/e2e/game-flow.spec.ts`
- [ ] `playwright/fixtures/mock-wallet.ts`
- [ ] `playwright/fixtures/test-keypair.json` (기존 키 복사)
- [ ] `package.json` scripts 업데이트

### 검증
- [ ] `npm run test:e2e` 실행 → PASS
- [ ] 3개 시나리오 모두 통과
- [ ] 스크린샷/비디오 캡처 (실패 시)

## [검증]

### Playwright 설치 확인
```bash
cd /Users/nova/projects/degen-roulette/frontend
npx playwright --version
```
→ 버전 출력 확인

### 테스트 실행
```bash
cd /Users/nova/projects/degen-roulette/frontend
npm run test:e2e
```
→ 모든 테스트 PASS

### Mock Wallet 동작 확인
```bash
cd /Users/nova/projects/degen-roulette/frontend
npm run test:e2e:debug
```
→ 디버거로 `window.solana` 주입 확인

### TX Signature 검증
- 테스트 실패 시 Solana Explorer 링크로 TX 상태 확인
- 콘솔 로그에 signature 출력 확인

## 참고 자료

- Playwright: https://playwright.dev/
- Solana Wallet Adapter: https://github.com/solana-labs/wallet-adapter
- Solana Web3.js: https://solana-labs.github.io/solana-web3.js/

## 우선순위

**P0 (필수)**:
- Playwright 설치
- Mock wallet 기본 동작 (connect, signTransaction)
- Happy path 1개 시나리오 통과

**P1 (중요)**:
- Error handling 테스트
- 스크린샷/비디오 캡처

**P2 (선택)**:
- Provably Fair 검증 자동화
- 여러 베팅 금액 테스트
