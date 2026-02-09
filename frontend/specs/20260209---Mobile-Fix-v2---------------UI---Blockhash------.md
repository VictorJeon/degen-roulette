# Mobile Fix v2 — 모바일 UI + Blockhash 에러 수정

## 목표
1. 모바일 레이아웃 개선 (리볼버 사각형 문제 해결)
2. blockhash 에러 방지 (RPC 연결 안정화)
3. E2E 13/13 유지

## 문제 1: 모바일 레이아웃

### 현재 문제
- `.game-card` 패널의 네온 보더가 리볼버를 "사각형 안에 갇힌" 느낌을 줌
- R1-R5 배율 테이블이 리볼버와 너무 가까움/겹침
- 전체적으로 모바일에서 여백이 부족

### 수정 사항

**`app/globals.css` — 768px media query 수정:**

```css
@media (max-width: 768px) {
  /* game-card: 모바일에서 보더/배경 제거 → 풀스크린 느낌 */
  .game-card {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 8px 12px !important;
  }

  /* game-card의 corner accent pseudo-elements 제거 */
  .game-card::before,
  .game-card::after {
    display: none !important;
  }

  /* 배율 테이블: 더 컴팩트하게 */
  .multiplier-table {
    margin-bottom: 4px;
  }

  .multiplier-row {
    gap: 3px !important;
  }

  .m-row {
    padding: 6px 4px;
    font-size: 0.55rem;
    gap: 3px;
  }

  .m-row span:first-child {
    font-size: 0.45rem;
  }

  .m-row span:last-child {
    font-size: 0.58rem;
  }

  .m-row.active {
    transform: scaleY(1.1) scaleX(1.03);
  }

  /* 리볼버: 좀 더 크게, 여유있게 */
  .revolver-frame {
    width: min(300px, 75vw);
    height: min(300px, 75vw);
    margin: 8px auto 12px;
  }

  /* 게임 메인 간격 조정 */
  .game-main {
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  /* 타이틀 간격 */
  .game-title {
    margin-bottom: 0.15rem;
  }

  .game-subtitle {
    margin-bottom: 0.3rem;
  }
}

@media (max-width: 480px) {
  .revolver-frame {
    width: min(260px, 70vw);
    height: min(260px, 70vw);
  }

  .m-row {
    padding: 5px 3px;
    font-size: 0.5rem;
  }
}
```

**`components/GameBoard.tsx` — 모바일 media query 수정:**

GameBoard의 style jsx 내 768px media query에 추가:
```css
@media (max-width: 768px) {
  .game-card {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 8px 12px;
  }

  .game-card::before,
  .game-card::after {
    display: none;
  }
}
```

## 문제 2: Blockhash 에러

### 현재 구조
- `lib/constants.ts`에 Helius devnet RPC URL이 하드코딩
- `lib/anchor.ts`에서 `new Connection(DEVNET_ENDPOINT, 'confirmed')`
- 클라이언트(브라우저)에서 직접 RPC 호출
- 모바일 브라우저에서 `TypeError: Load failed` 발생 (네트워크 불안정/CORS)

### 수정 사항

**`lib/anchor.ts` — Connection에 retry/commitment 옵션 추가:**

```typescript
export function getConnection() {
  return new Connection(DEVNET_ENDPOINT, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    wsEndpoint: undefined, // WebSocket 비활성화 (모바일 안정성)
  });
}
```

**`hooks/useGame.ts` — startGame에서 blockhash fetch에 retry 추가:**

startGame 함수 내 sendTransaction 또는 .rpc() 호출 전에:
```typescript
// Retry blockhash fetch up to 3 times
let blockhash;
for (let i = 0; i < 3; i++) {
  try {
    const bh = await connection.getLatestBlockhash('confirmed');
    blockhash = bh;
    break;
  } catch (err) {
    console.warn(`[useGame] Blockhash fetch attempt ${i + 1} failed:`, err);
    if (i === 2) throw new Error('Network error: Could not connect to Solana. Please check your connection and try again.');
    await new Promise(r => setTimeout(r, 1000));
  }
}
```

**`hooks/useGame.ts`의 에러 메시지 개선:**

catch 블록에서 `TypeError: Load failed` 같은 네트워크 에러를 사용자 친화적 메시지로 변환:
```typescript
if (err instanceof TypeError && err.message.includes('Load failed')) {
  throw new Error('Network error: Please check your connection and try again.');
}
```

## 검증

```bash
cd /home/nova/projects/degen-roulette/frontend
pnpm exec tsc --noEmit
pnpm build
pnpm exec playwright test tests/e2e/ --reporter=line --workers=1 --timeout=60000
```

## 제약
- 데스크톱 레이아웃 깨지면 안 됨
- E2E 13/13 유지 필수
- 기존 CSS 변수 사용
- `game-card` 보더 제거는 768px 이하에서만

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
