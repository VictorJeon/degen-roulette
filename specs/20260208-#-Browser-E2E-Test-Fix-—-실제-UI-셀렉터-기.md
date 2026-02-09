# Browser E2E Test Fix — 실제 UI 셀렉터 기반 재작성

## 목표
기존 Playwright E2E 테스트 3개 파일의 셀렉터를 실제 UI에 맞게 수정.
fixture(mock-wallet.ts, wallet-utils.ts)는 그대로 유지. 테스트 시나리오만 수정.

## 수정 대상
- `frontend/tests/e2e/game-flow.spec.ts`
- `frontend/tests/e2e/provably-fair.spec.ts`
- `frontend/tests/e2e/error-handling.spec.ts`

## 실제 UI 구조 (반드시 이 셀렉터 사용)

### 페이지 URL
- `https://frontend-umber-kappa-32.vercel.app/`

### 지갑 연결
- Header의 `WalletMultiButton` 컴포넌트 (`@solana/wallet-adapter-react-ui`)
- 클래스: `.wallet-adapter-button` (지갑 미연결 시)
- Mock wallet이 주입되면 자동 연결되므로, mock fixture에서 `window.solana` 주입 후 페이지 리로드 필요할 수 있음

### BetPanel (components/BetPanel.tsx)
- **베팅 입력**: `<input type="number">` (className 없음, type으로 선택)
- **퀵 베팅 버튼**: `.quick-btn-inline` (0.01, 0.05, 0.1, 0.5 SOL)
- **메인 액션 버튼**: `.trigger-btn.trigger-btn-start`
  - 텍스트: `PLAY AGAIN` (idle/active), `SIGNING...` (loading)
  - **"START" 텍스트는 없음!**
- **안내 메시지**: `.game-instruction`
  - idle: `>>> SELECT YOUR BET <<<`
  - 지갑 미연결: `>>> CONNECT WALLET FIRST <<<`
  - 최소 베팅 미달: `>>> MIN BET: 0.001 SOL <<<`
  - 게임 시작됨: `>>> GAME STARTED <<<`
  - 에러: `>>> {errorMessage} <<<`

### GameBoard (components/GameBoard.tsx)
- **제목**: `h1.game-title` → "DEGEN ROULETTE"
- **부제**: `p.game-subtitle` → "1 BULLET. 6 CHAMBERS. HOW DEGEN ARE YOU?"
- **결과 제목**: `h1.game-result-title` (.safe / .dead)
- **에러 메시지**: `p.game-error`
- **힌트 메시지**: `p.game-hint`
- **배율 테이블**: `.multiplier-table` → `.m-row` (각 라운드)
- **Provably Fair 모달**: `.modal-card` with `h3` "PROVABLY FAIR"
  - 서버 시드: `.mono.seed`
  - Game ID: `.mono` with "Game ID:" 텍스트

### Header (components/Header.tsx)
- **결과 배너**: `.result-banner` → `.result-banner-text` ("RESULT: ...")

### GameState 흐름
```
idle → waiting_start (TX 서명 중) → active (PULL 가능) → settling (cashout 중) → won/lost
                                   → lost (총알 맞음)
```

### PULL 트리거
- 게임이 active 상태일 때 `/api/game/pull` POST로 서버에서 처리
- 프론트에서는 `handlePull` 함수로 호출
- PULL 버튼은 BetPanel에는 없음 — GameBoard 쪽에서 클릭 이벤트나 별도 UI로 처리될 수 있음
- `components/GameBoard.tsx`의 `onPullTrigger` prop 확인 필요

### 중요: 게임 플로우
1. 지갑 연결 (mock wallet 자동)
2. 베팅 금액 선택 (quick-btn-inline 클릭 or input 입력)
3. "PLAY AGAIN" 버튼 클릭 → TX 서명 → start_game 온체인
4. active 상태 → PULL trigger → 서버가 settle
5. 결과: won (safe) / lost (dead)

## 검증 기준
- `npx playwright test --reporter=list` 실행
- 최소 error-handling 테스트 3개 중 2개 통과
- game-flow 테스트가 페이지 로드 + 지갑 연결까지 성공

## 참고 파일 (읽어볼 것)
- `frontend/components/BetPanel.tsx` — 베팅 UI
- `frontend/components/GameBoard.tsx` — 게임 보드 UI
- `frontend/hooks/useGame.ts` — 게임 상태 관리
- `frontend/playwright/fixtures/mock-wallet.ts` — mock wallet fixture
- `frontend/tests/e2e/*.spec.ts` — 수정 대상
