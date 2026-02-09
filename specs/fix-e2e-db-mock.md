# Fix E2E Tests — DB Mock for Missing Postgres

## 문제
E2E 테스트 4개 실패: `/api/game/start` → 500 (`VercelPostgresError: missing_connection_string`). 테스트 환경에 `POSTGRES_URL` 없음.

## 현재 상태
- `lib/db.ts`: `POSTGRES_URL` 없으면 skip하는 패턴 있음
- `lib/game-server.ts`: DB 체크 없음 → `@vercel/postgres`의 `sql` 호출 시 에러
- `app/api/game/start/route.ts`: DB 체크 없음

## 해결: game-server.ts에 DB 없을 때 mock 응답

`lib/game-server.ts`의 모든 DB 호출 함수에 `POSTGRES_URL` 체크 추가. DB 없으면 메모리 기반 mock으로 게임 상태 관리.

### 구현

`lib/game-server.ts` 상단에:
```typescript
const HAS_DB = !!process.env.POSTGRES_URL;
```

DB 호출하는 모든 함수에서:
```typescript
if (!HAS_DB) {
  // 메모리 기반 mock 사용
  return mockResponse;
}
// 기존 DB 로직
```

### Mock 구현 (`lib/game-mock.ts` 신규)

인메모리 Map으로 게임 상태 관리:
```typescript
const games = new Map<string, GameState>();

interface GameState {
  id: string;
  player_wallet: string;
  bet_amount: number;
  status: 'pending' | 'active' | 'completed';
  bullet_position: number;
  current_round: number;
  created_at: Date;
  server_seed: string;
  seed_hash: string;
}
```

필요한 함수들:
- `createGame(wallet, betAmount)` → 게임 생성, bullet_position 랜덤 (1-6)
- `getActiveGame(wallet)` → 활성 게임 조회
- `confirmRound(gameId)` → 현재 라운드가 bullet이면 dead, 아니면 survive
- `cashOut(gameId)` → 게임 완료 처리
- `cleanupPending(wallet)` → pending 게임 삭제

### API 라우트 수정

각 route.ts에서 game-server.ts 호출 시 이미 mock이 적용되므로 추가 수정 불필요. game-server.ts 내부에서 분기.

또는 더 간단하게: `@vercel/postgres`의 `sql` 함수를 래핑해서 DB 없을 때 mock 반환.

### 더 간단한 접근 (권장)

game-server.ts를 수정하는 대신, `.env.test` 또는 `.env.local`에 mock DB 대신 **game API 자체에서 DB 없으면 인메모리 처리**:

각 API route에서:
```typescript
// app/api/game/start/route.ts 상단
if (!process.env.POSTGRES_URL) {
  // Mock: 바로 성공 응답 반환
  const gameId = crypto.randomUUID();
  const bulletPosition = Math.floor(Math.random() * 6) + 1;
  return NextResponse.json({
    success: true,
    gameId,
    seedHash: crypto.randomBytes(32).toString('hex'),
    message: 'Game started (mock mode)',
  });
}
```

이 패턴을 `/api/game/start`, `/api/game/confirm`, `/api/game/pull`, `/api/game/active/[wallet]` 모든 game 라우트에 적용.

## 테스트
```bash
npx tsc --noEmit 2>&1 | head -20
npx playwright test --reporter=line 2>&1 | tee /tmp/playwright-results-db-mock.log
```

결과를 반드시 `/tmp/playwright-results-db-mock.log`에 저장.

## 프로젝트
- 경로: 현재 디렉토리 (frontend/)
- 관련 파일: `lib/game-server.ts`, `app/api/game/*/route.ts`
- DB: `@vercel/postgres`, 환경변수 `POSTGRES_URL`

## 주의
- 질문하지 말고 전부 구현
- 프로덕션 코드에 영향 없어야 함 (POSTGRES_URL 있으면 기존 동작)
- mock 모드에서도 게임 상태(bullet position, rounds)가 일관되어야 E2E 테스트 통과 가능
- 인메모리 상태는 서버 프로세스 내 유지 (dev server 재시작 시 초기화 OK)
