# E2E Wallet Fix Phase 6: AnchorWallet testMode fallback

## 문제
`startGame()`에서 `useAnchorWallet()`이 null 반환 → TX 서명 불가.
wallet-adapter-react context가 업데이트 안 되기 때문.
window.solana는 signTransaction/signAllTransactions 모두 지원함.

## 해결
testMode일 때 useAnchorWallet() 대신 window.solana를 AnchorWallet 인터페이스로 wrapping.

### 수정 1: `lib/testMode.ts`에 함수 추가
```typescript
export function getAnchorWallet(walletFromHook: AnchorWallet | undefined): AnchorWallet | undefined {
  if (walletFromHook) return walletFromHook;
  if (!isTestMode()) return undefined;
  const solana = (window as any).solana;
  if (!solana?.publicKey || !solana?.isConnected) return undefined;
  return {
    publicKey: solana.publicKey,
    signTransaction: (tx) => solana.signTransaction(tx),
    signAllTransactions: (txs) => solana.signAllTransactions(txs),
  };
}
```

### 수정 2: `hooks/useGame.ts` (또는 anchorWallet 사용하는 곳)
- `useAnchorWallet()` 결과를 `getAnchorWallet()`으로 감싸기
- grep으로 `useAnchorWallet` 사용처 전부 확인하고 동일 패턴 적용

### 검증
- 실패한 game-flow 테스트만 실행: `npx playwright test tests/e2e/game-flow.spec.ts`
- 통과하면 전체 13개도 한 번 돌려서 regression 없는지 확인

## 하지 말 것
- testMode 아닌 경로 변경 금지
- wallet-adapter-react 내부 수정 금지
- 이미 통과하는 8개 테스트 깨뜨리지 말 것

## 성공 기준
- game-flow 테스트 최소 3/5 pass
- 기존 8개 pass 유지 (총 11+/13)
