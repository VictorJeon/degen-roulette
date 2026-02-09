# E2E Fix Phase 7: DB Mock + 전체 테스트 실행

## 배경
Phase 5-6에서 wallet fallback 완료. 그러나 game API routes가 POSTGRES_URL 필요.
E2E 테스트에서는 DB 없이 돌려야 함.

## 수정 사항

### 1. Game API routes에 DB-optional fallback 추가
다음 파일들에서 `POSTGRES_URL` 없을 때 in-memory mock 사용:
- `app/api/game/start/route.ts`
- `app/api/game/active/[wallet]/route.ts`
- `app/api/game/pull/route.ts`  
- `app/api/game/settle/route.ts` (있다면)
- `app/api/game/confirm/route.ts`

패턴:
```typescript
// DB가 없으면 in-memory mock 사용
const db = process.env.POSTGRES_URL ? await getRealDb() : getInMemoryMock();
```

### 2. In-memory game mock (`lib/game-mock.ts`)
- Map 기반 in-memory 게임 상태 관리
- createGame, getGame, getActiveGame, updateGame, deleteGame
- 랜덤 bullet position 생성
- DB schema와 동일한 인터페이스

### 3. 검증
- `npx playwright test` 전체 13개 실행
- 결과 리포트 (pass/fail 개수, 실패한 테스트명)

## 하지 말 것
- 실제 DB 연결 코드 수정 금지 (mock은 별도 경로)
- testMode 아닌 프로덕션 경로 변경 금지
- 이미 작동하는 wallet fallback 코드 건드리지 말 것

## 성공 기준
- 전체 13개 테스트 중 11개 이상 pass
- game-flow 테스트가 게임 시작까지 도달
