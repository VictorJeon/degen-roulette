# Spec: Pull Trigger Server-Side Check

## 목표
trigger를 당길 때마다 서버에서 즉시 생/사 판정. 죽으면 즉시 REKT, 살면 다음 라운드 진행.

## 현재 문제
- pullTrigger가 프론트에서 roundsSurvived만 +1 (서버 판정 없음)
- settle 시 한꺼번에 판정 → 5번 당기고 갑자기 REKT (UX 불일치)

## 변경 사항

### 1. `/api/game/pull` 엔드포인트 (새로 생성)

파일: `frontend/app/api/game/pull/route.ts`

```typescript
// POST /api/game/pull
// Body: { gameId: string }
// Response: { survived: boolean, round: number, bulletPosition?: number, settleResult?: object }
```

로직:
1. games 테이블에서 gameId로 게임 조회
2. status가 'active'인지 확인
3. current_round 읽기 (0-indexed, 초기값 0)
4. bullet_position 계산: `crypto.createHash('sha256').update(server_seed).digest()[0] % 6`
   - ⚠️ 온체인과 동일해야 함. 온체인은 `server_seed[0] % 6` (raw bytes). 
   - server_seed는 DB에 hex string으로 저장됨 → Buffer.from(server_seed, 'hex')[0] % 6
5. `current_round === bullet_position` 이면:
   - 자동으로 settle 호출 (lost, rounds_survived = current_round)
   - 응답: `{ survived: false, round: current_round, bulletPosition, settleResult: { won: false, ... } }`
6. 아니면:
   - current_round += 1 업데이트
   - 응답: `{ survived: true, round: current_round + 1 }`
7. current_round >= 5 (마지막 칸까지 살았으면):
   - 이 경우는 bullet이 5번 칸인데 아직 안 죽은 거 → 5번 칸 pull 시 위에서 잡힘
   - 실제로 current_round는 0~5, bullet_position도 0~5

### 2. DB 변경

games 테이블에 `current_round` 컬럼 추가 (integer, default 0).

```sql
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0;
```

마이그레이션은 `/api/game/pull` 엔드포인트 내에서 첫 호출 시 자동 추가하거나, 
start 엔드포인트에서 current_round = 0으로 초기화.

### 3. `/api/game/start` 수정

파일: `frontend/app/api/game/start/route.ts`

games INSERT 시 `current_round = 0` 포함.

### 4. `useGame` 훅 수정

파일: `frontend/hooks/useGame.ts`

pullTrigger 함수 변경:
- 기존: 클라이언트에서 roundsSurvived +1
- 변경: `POST /api/game/pull` 호출 → 응답의 survived에 따라:
  - true → roundsSurvived 업데이트, 게임 계속
  - false → REKT 상태로 전환, bulletPosition/settleResult 저장

cashOut 함수:
- 기존 `/api/game/settle` 호출하되, roundsSurvived는 서버의 current_round 사용
- 서버 settle 엔드포인트에서 games.current_round를 rounds_survived로 사용

### 5. `/api/game/settle` 수정 (Cash Out 경로)

파일: `frontend/app/api/game/settle/route.ts`

- 기존 body의 `roundsSurvived` 대신 DB의 `current_round` 사용 (프론트 조작 방지)
- Cash Out 시 won=true 경로만 타게 됨 (lost는 pull에서 이미 처리)

### 6. bullet_position 계산 일치 확인

온체인 (game.rs):
```rust
let bullet_position = server_seed[0] % GameState::CHAMBERS; // CHAMBERS = 6
```

오프체인 (pull API):
```typescript
const seedBuffer = Buffer.from(game.server_seed, 'hex');
const bulletPosition = seedBuffer[0] % 6;
```

⚠️ server_seed 저장 형식 확인 필요:
- start API에서 seed 생성 시 어떤 형식으로 DB에 저장하는지
- 온체인에 넘길 때 어떤 형식인지
- 둘이 같은 raw bytes의 [0] 바이트를 참조해야 함

### 제약 조건
- 온체인 프로그램 수정 없음 (settle_game 인터페이스 동일)
- 기존 Provably Fair 검증 유지
- /api/game/verify 는 그대로 유지
- TypeScript strict mode, 기존 코드 스타일 따르기
- 에러 시 logServerError 사용

### 검증 명령어
```bash
cd /Users/nova/projects/degen-roulette/frontend
npm run build  # 빌드 성공 확인
npm run typecheck  # 타입 체크 (있으면)
```

### 질문 있으면
Nova한테 물어봐. 절대 혼자 판단하지 마.
