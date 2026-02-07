# Degen Roulette — Game Specification v2

> Nova(Opus) 작성. 온체인 + 프론트엔드 + 리더보드 전체 재설계.
> Claude Code는 이 스펙대로 구현만.

---

## 게임 개요

6챔버 러시안 룰렛. 1탄환. 유저가 방아쇠를 당길수록 배율이 올라간다.
언제든 캐시아웃 가능. 결과는 캐시아웃 시점에 VRF로 결정.

**핵심 원칙: TX는 2개만. 중간 플레이는 클라이언트 사이드.**

---

## 게임 플로우

```
[유저]                    [온체인]                  [클라이언트]
  │                         │                         │
  ├── TX1: start_game ──────►  베팅금 전송               │
  │                         │  GameState = Active       │
  │                         │                         │
  │                         │    ◄──── 구독 감지 ────────┤
  │                         │                         │
  │   (TX 없음)              │      방아쇠 애니메이션 ──────►
  │   유저 "PULL" 클릭 ────────────────────────────────►
  │                         │      생존 연출              │
  │   유저 "PULL" 클릭 ────────────────────────────────►
  │                         │      생존 연출              │
  │   유저 "CASH OUT" 클릭 ──────────────────────────────►
  │                         │                         │
  ├── TX2: settle_game(N) ──►  VRF 요청                  │
  │                         │  bullet = VRF % 6         │
  │                         │  bullet < N? → Lost       │
  │                         │  bullet >= N? → Won       │
  │                         │  지급/몰수 처리             │
  │                         │                         │
  │                         │    ◄──── 결과 표시 ─────────┤
```

### 상세 플로우

1. **지갑 연결** → Phantom (devnet)
2. **베팅 금액 선택** → 0.01 ~ (house_vault * max_bet_pct / 10000) SOL
3. **START 클릭** → TX1: `start_game(bet_amount)`
   - 베팅금이 house_vault로 전송
   - GameState PDA 생성 (status = Active, rounds_survived = 0)
4. **플레이 (클라이언트 전용)**
   - "PULL THE TRIGGER" 클릭 → 실린더 회전 애니메이션 → 빈 챔버 연출
   - 클라이언트가 rounds_survived 카운트
   - 각 라운드 후: "PULL AGAIN" or "CASH OUT" 선택지
   - 5라운드 생존 시 자동으로 CASH OUT 단계로
5. **CASH OUT 클릭** → TX2: `settle_game(rounds_survived)`
   - Orao VRF로 랜덤 생성 (같은 TX 내)
   - bullet_position = vrf_result % 6
   - bullet_position < rounds_survived → 유저 사망 (배팅금 하우스 귀속)
   - bullet_position >= rounds_survived → 유저 생존 (배율 * 배팅금 지급)
6. **결과 오버레이**
   - 승리: 실제 지급액 + profit 표시
   - 패배: "REKT" + 몇 라운드에서 죽었는지 표시 (bullet_position + 1)

---

## 확률 & 배율

6챔버, 탄환 1발. 탄환 위치는 0~5 균일 분포.

N라운드 생존 확률: (6 - N) / 6

| 라운드 | 생존 확률 | 공정 배율 | 하우스 엣지 3% 적용 | 온체인 (basis points) |
|--------|-----------|-----------|---------------------|-----------------------|
| 1      | 5/6 (83.3%) | 1.20x   | 1.16x               | 116                   |
| 2      | 4/6 (66.7%) | 1.50x   | 1.45x               | 145                   |
| 3      | 3/6 (50.0%) | 2.00x   | 1.94x               | 194                   |
| 4      | 2/6 (33.3%) | 3.00x   | 2.91x               | 291                   |
| 5      | 1/6 (16.7%) | 6.00x   | 5.82x               | 582                   |

**프론트엔드에서 보여주는 배율도 이 값 그대로.** 온체인과 100% 동기화.

---

## 온체인 프로그램 (Anchor v2)

### Program ID
기존: `DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7`
→ 재배포 필요 (구조 변경)

### Dependencies
- anchor-lang 0.31+
- orao-solana-vrf (Orao Network VRF)

### Accounts

#### HouseConfig (PDA: seeds = [b"house_config"])
```rust
pub struct HouseConfig {
    pub authority: Pubkey,
    pub min_bet: u64,           // 최소 베팅 (lamports)
    pub max_bet_pct: u16,       // 하우스 대비 최대 베팅 % (basis points)
    pub house_edge_bps: u16,    // 하우스 엣지 (basis points, 300 = 3%)
    pub paused: bool,
    pub total_games: u64,       // 누적 게임 수
    pub total_volume: u64,      // 누적 베팅 볼륨 (lamports)
    pub bump: u8,
}
```

#### HouseVault (PDA: seeds = [b"house_vault"])
```rust
pub struct HouseVault {}  // lamports만 보유
```

#### GameState (PDA: seeds = [b"game", player.key()])
```rust
pub struct GameState {
    pub player: Pubkey,
    pub bet_amount: u64,
    pub rounds_survived: u8,     // settle 시 유저가 제출한 값
    pub bullet_position: u8,     // VRF 결과 (settle 후 채워짐)
    pub status: GameStatus,
    pub result_multiplier: u16,  // 실제 적용 배율 (basis points, settle 후)
    pub payout: u64,             // 실제 지급액 (settle 후)
    pub created_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

pub enum GameStatus {
    Active,        // 게임 진행 중 (TX1 후)
    Won,           // VRF 결과 생존 (TX2 후)
    Lost,          // VRF 결과 사망 (TX2 후)
}
```

#### PlayerStats (PDA: seeds = [b"player_stats", player.key()])
```rust
pub struct PlayerStats {
    pub player: Pubkey,
    pub total_games: u64,
    pub total_wagered: u64,      // 누적 베팅 (lamports)
    pub total_won: u64,          // 누적 수령 (lamports)
    pub total_profit: i64,       // 누적 순이익 (lamports, 음수 가능)
    pub best_streak: u8,         // 최고 생존 라운드
    pub bump: u8,
}
```

### Instructions

#### 1. `initialize_house` (관리자 전용)
- HouseConfig 초기화
- HouseVault 생성
- 기본값: min_bet=10_000_000 (0.01 SOL), max_bet_pct=1000 (10%), house_edge=300 (3%)

#### 2. `fund_house(amount)` (누구나)
- house_vault에 SOL 입금

#### 3. `withdraw_house(amount)` (관리자 전용)
- house_vault에서 SOL 출금

#### 4. `update_config(min_bet, max_bet_pct, house_edge_bps)` (관리자 전용)

#### 5. `start_game(bet_amount)` ★
- 검증:
  - house_config.paused == false
  - bet_amount >= min_bet
  - bet_amount <= house_vault * max_bet_pct / 10000
  - house_vault >= max_payout (5라운드 배율 기준)
  - game.status != Active (이미 진행 중인 게임 없어야)
- 처리:
  - 베팅금을 player → house_vault로 transfer
  - GameState 초기화 (status = Active)
  - PlayerStats init_if_needed
- **이전 게임 PDA 재사용**: Active가 아닌 상태면 덮어쓰기 OK

#### 6. `settle_game(rounds_survived)` ★
- 검증:
  - game.status == Active
  - game.player == signer
  - 1 <= rounds_survived <= 5
- 처리:
  - Orao VRF 요청 & 소비 (같은 TX)
  - bullet_position = vrf_randomness[0] % 6
  - 판정:
    - bullet_position < rounds_survived → Lost
      - 베팅금은 이미 하우스에 있으므로 추가 처리 없음
      - game.status = Lost
    - bullet_position >= rounds_survived → Won
      - payout = bet_amount * MULTIPLIERS[rounds_survived - 1] / 100
      - house_vault → player로 payout transfer
      - game.status = Won
  - PlayerStats 업데이트:
    - total_games += 1
    - total_wagered += bet_amount
    - total_won += payout (0 if lost)
    - total_profit += (payout as i64 - bet_amount as i64)
    - best_streak = max(best_streak, rounds_survived) (won인 경우만)
  - HouseConfig 업데이트:
    - total_games += 1
    - total_volume += bet_amount
  - game.settled_at = clock.unix_timestamp
  - game.bullet_position = bullet_position
  - game.result_multiplier = applied multiplier
  - game.payout = actual payout

#### 7. `force_settle` (관리자 전용)
- 24시간+ 경과한 Active 게임 강제 정산 (rounds_survived = 0 → 무조건 Lost)
- 악성 유저가 게임 열어놓고 안 닫는 경우 대비

#### 8. `pause` / `unpause` (관리자 전용)

### 배율 상수
```rust
pub const MULTIPLIERS: [u16; 5] = [116, 145, 194, 291, 582];
// index 0 = 1라운드 생존 = 1.16x
// index 4 = 5라운드 생존 = 5.82x
```

### Orao VRF 통합
```rust
// Cargo.toml
orao-solana-vrf = "0.5"

// settle_game에서:
let randomness = orao_solana_vrf::cpi::request_and_consume(ctx, seed)?;
let bullet_position = randomness[0] % 6;
```
※ Orao VRF는 devnet에서 무료. 메인넷에서는 ORAO 토큰 필요.

### 이벤트 (Anchor events)
```rust
#[event]
pub struct GameStarted {
    pub player: Pubkey,
    pub bet_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct GameSettled {
    pub player: Pubkey,
    pub bet_amount: u64,
    pub rounds_survived: u8,
    pub bullet_position: u8,
    pub won: bool,
    pub payout: u64,
    pub multiplier: u16,
    pub timestamp: i64,
}
```

---

## 프론트엔드

### 기술 스택
- Next.js 16 + React 19 + Turbopack
- Tailwind CSS (globals.css에서 커스텀 속성)
- @solana/wallet-adapter
- @coral-xyz/anchor
- Vercel Postgres (리더보드)

### 디자인 시스템

#### 색상
```css
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-tertiary: #1a1a1a;
--accent: #a3e635;
--accent-dim: #65a30d;
--danger: #ef4444;
--success: #00ff88;
--text-primary: #ffffff;
--text-secondary: #a1a1aa;
--text-muted: #52525b;
```

#### 폰트
- 'Press Start 2P' — 타이틀, 숫자, 버튼
- 'Space Grotesk' — 본문

#### 효과
- CRT 스캔라인 (body::before)
- 비네트 (body::after)
- 글로우 (text-shadow with accent color)

### 컴포넌트 구조

```
app/
├── layout.tsx              # 폰트, WalletProvider, globals
├── page.tsx                # 메인 페이지
├── globals.css             # CSS 변수, CRT 효과, 컴포넌트 스타일
├── api/
│   └── leaderboard/
│       └── route.ts        # GET/POST 리더보드 API
components/
├── Header.tsx              # 로고 + Total Plays + 지갑 버튼
├── GameBoard.tsx           # 실린더 + 게임 상태 + 액션 버튼
├── BetPanel.tsx            # 베팅 UI (게임 미진행 시만)
├── StatsBar.tsx            # Bet / Multiplier / Potential / Death Odds
├── Leaderboard.tsx         # 누적 profit 리더보드
├── LiveFeed.tsx            # 실시간 킬 피드 (온체인 이벤트)
├── ResultOverlay.tsx       # 승리/패배 오버레이
├── WalletProvider.tsx      # Solana 지갑 컨텍스트
hooks/
├── useProgram.ts           # Anchor 프로그램
├── useGame.ts              # 게임 로직 통합 (start, settle, state)
├── useLiveFeed.ts          # 온체인 이벤트 구독
├── useLeaderboard.ts       # 리더보드 fetch
├── useSound.ts             # 사운드 엔진
lib/
├── constants.ts            # Program ID, RPC, multipliers
├── idl.ts                  # IDL 타입
├── sound.ts                # SoundEngine 클래스
├── multipliers.ts          # 배율 계산 유틸
```

### 삭제 대상
- `GameArea.tsx` — 중복 컴포넌트
- `BufferPolyfill.tsx` — 불필요하면 제거 (테스트 후)

### 레이아웃 (3컬럼, ≥1200px)
```
┌─────────────────────────────────────────────────────┐
│                     HEADER                           │
│  [로고] DEGEN ROULETTE     Total Plays: XX  [지갑]    │
├─────────┬───────────────────────────┬───────────────┤
│         │                           │               │
│  LEADER │      GAME AREA            │  LIVE FEED    │
│  BOARD  │                           │               │
│         │  [실린더 SVG]              │  킬 피드       │
│  누적    │                           │  실시간        │
│  profit │  [Stats Bar]              │               │
│  순위    │  Bet|Multi|Potential|Odds │               │
│         │                           │               │
│         │  [BetPanel or ActionBtns] │               │
│         │                           │               │
└─────────┴───────────────────────────┴───────────────┘
```

### 모바일 (< 768px)
- 단일 컬럼
- 실린더 → Stats → 버튼 → 리더보드 → 피드

### 게임 상태 UI

#### 1. 대기 상태 (게임 미진행)
- 실린더: 정적, 모든 챔버 비어있음
- BetPanel 표시: 금액 입력 + 퀵 버튼 + START
- 하단: ">>> SELECT YOUR BET <<<"

#### 2. 플레이 상태 (Active)
- BetPanel 숨김
- "PULL THE TRIGGER" 버튼 (큼, 초록)
- 라운드 1+ 이후: "CASH OUT" 버튼 추가 (작음, 보더만)
- Stats Bar: 현재 배율, 잠재 수익, 생존 확률 실시간 업데이트
- 방아쇠 클릭 시:
  1. 실린더 회전 애니메이션 (0.8s)
  2. 트리거 소리
  3. 빈 챔버 소리
  4. 해당 챔버 "fired" 표시 (빨간 반투명)
  5. 다음 챔버로 포인터 이동
  6. 배율 팝업 (1.5s)
  7. 화면 초록 플래시

#### 3. 정산 대기 (settle TX 전송 후)
- "SETTLING..." 표시 + 스피너
- VRF 대기 중

#### 4. 결과 — 승리
- 초록 플래시
- ResultOverlay: "ESCAPED" + 지급액 + profit + 배율
- "NEW GAME" 버튼
- 리더보드 자동 업데이트

#### 5. 결과 — 패배
- 빨간 플래시 + 화면 흔들림
- 총소리 사운드
- 탄환 챔버에 빨간 점 표시
- ResultOverlay: "REKT" + "Round X에서 사망" + 생존 라운드
- "RUN IT BACK" 버튼

### 실린더 SVG
```
- viewBox 300x300
- 6챔버, 원형 배치 (60도 간격)
- 챔버 반지름: 28px
- 중앙: 이중 원 (35px 외곽 + 15px 내부, accent 테두리)
- 현재 챔버: accent 테두리 3px
- fired 챔버: rgba(239, 68, 68, 0.3) 채움
- 해머: ▼ 마크, 실린더 위 고정 위치
- 회전 애니메이션: rotate, cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## 리더보드 (Vercel Postgres)

### DB 스키마
```sql
CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL UNIQUE,
    total_games INTEGER DEFAULT 0,
    total_wagered BIGINT DEFAULT 0,        -- lamports
    total_won BIGINT DEFAULT 0,            -- lamports
    total_profit BIGINT DEFAULT 0,         -- lamports (음수 가능)
    best_streak INTEGER DEFAULT 0,
    last_played_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_profit ON leaderboard (total_profit DESC);
```

### API Routes

#### GET /api/leaderboard
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "wallet": "ABC...XYZ",
      "totalGames": 42,
      "totalProfit": 1500000000,  // 1.5 SOL in lamports
      "profitSol": 1.5,
      "bestStreak": 4
    }
  ]
}
```
- 정렬: total_profit DESC
- 상위 20명

#### POST /api/leaderboard
- settle_game TX 확인 후 프론트에서 호출
- Body: `{ wallet, betAmount, payout, roundsSurvived, won, txSignature }`
- 서버에서 TX signature 검증 (온체인 확인) → 조작 방지
- PlayerStats 업데이트

### 프론트 표시
```
HALL OF DEGENS
━━━━━━━━━━━━━━━━━━━━━━━━━
#1  ABC...XYZ    +1.50 SOL
#2  DEF...UVW    +0.82 SOL
#3  GHI...RST    +0.34 SOL
...
#10 JKL...OPQ   -0.45 SOL
```
- 양수: 초록색
- 음수: 빨간색
- 유저 본인 행은 하이라이트

---

## 킬 피드 (LiveFeed)

### 데이터 소스
- Anchor 이벤트 구독 (`program.addEventListener('GameSettled', ...)`)
- 최근 20건 표시

### 표시 형식
```
LIVE FEED
━━━━━━━━━━━━━━━━━━━━━━━━━
ABC...XYZ  +0.42 SOL  2s ago   (승리)
DEF...UVW  -0.10 SOL  15s ago  (패배)
GHI...RST  REKT @R3   32s ago  (패배, 3라운드에서)
```
- 승리: 초록, +profit
- 패배: 빨간, -bet 또는 "REKT @R{N}"

---

## 사운드

### 현재 (Web Audio API 합성음) → 유지하되 개선
- cylinder_spin: 연속 클릭 (12회, 점진적 피치 상승)
- trigger_pull: 짧은 square wave (150Hz, 0.05s)
- empty_chamber: 중저음 클릭 (200Hz, 0.08s)
- gunshot: 노이즈 + low boom (bandpass 500Hz + osc 80→20Hz)
- bullet_load: 금속 클릭 2회

### 추가
- win_jingle: 상승 아르페지오 (짧고 8비트풍)
- cashout_coin: 코인 소리
- tension_loop: 라운드 3+ 에서 저음 드론 (생존 확률 낮아질수록)

---

## 구현 순서

### Step 1: 온체인 프로그램 (Claude Code)
1. Anchor v2 프로젝트 재구성
2. HouseConfig, HouseVault, GameState, PlayerStats 구현
3. start_game, settle_game (Orao VRF) 구현
4. force_settle, admin instructions 구현
5. 이벤트 emit
6. anchor test (로컬 밸리데이터)
7. devnet 배포

### Step 2: 프론트엔드 (Claude Code)
1. 기존 코드 정리 (GameArea.tsx 삭제, 중복 제거)
2. 새 hooks (useGame, useLiveFeed, useLeaderboard)
3. GameBoard 리팩토링 (2-TX 플로우)
4. BetPanel 정리
5. StatsBar 분리
6. ResultOverlay 컴포넌트화
7. LiveFeed (이벤트 구독)
8. Leaderboard (API 연동)
9. 사운드 개선

### Step 3: 리더보드 API
1. Vercel Postgres 설정
2. /api/leaderboard route (GET/POST)
3. TX signature 검증 로직

### Step 4: 통합 + 배포
1. 프론트 ↔ 새 프로그램 연동
2. devnet 테스트
3. Vercel 배포

---

## 검증 체크리스트

- [ ] start_game TX 정상 (베팅금 전송)
- [ ] settle_game TX 정상 (VRF + 판정 + 지급)
- [ ] 프론트 배율 == 온체인 배율
- [ ] 클라이언트 사이드 플레이 (TX 없이 방아쇠)
- [ ] 결과 오버레이 (승리/패배)
- [ ] 리더보드 누적 profit 정렬
- [ ] 킬 피드 실시간 업데이트
- [ ] 모바일 반응형
- [ ] force_settle 동작
- [ ] VRF 무결성 (결과 조작 불가)

---

_이 스펙을 기반으로 Claude Code가 구현한다. 디자인 판단이 필요한 변경은 Nova에게 확인._
