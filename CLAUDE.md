# CLAUDE.md — Degen Roulette

## WHAT
Solana 러시안 룰렛 게임. 플레이어가 SOL을 베팅하고, 6발 중 1발 실탄이 든 실린더를 라운드마다 돌린다.
살아남을수록 배율 상승 (1.16x → 5.82x). 언제든 cash out 가능.

- **Stack**: Anchor v2 (Rust) + Next.js 16 + React 19 + Tailwind v4
- **Network**: Solana Devnet
- **v3**: VRF 제거, Server Seed Commit-Reveal (death.fun 방식)

## DIRECTORY STRUCTURE
```
degen-roulette/
├── anchor-v2/                    # 온체인 프로그램 (Rust/Anchor)
│   └── programs/degen-roulette-v2/src/
│       ├── lib.rs                # entrypoint
│       ├── error.rs              # custom errors
│       ├── state/                # GameState, HouseConfig accounts
│       └── instructions/
│           ├── admin.rs          # init_house, fund_house, withdraw_house
│           └── game.rs           # start_game, settle_game, force_settle
├── frontend/                     # Next.js 16 앱
│   ├── app/
│   │   ├── page.tsx              # 메인 페이지 (single page app)
│   │   ├── layout.tsx            # root layout + providers
│   │   ├── globals.css           # 전체 스타일 (Tailwind + custom)
│   │   └── api/game/             # Game API routes (아래 상세)
│   ├── components/
│   │   ├── GameBoard.tsx         # 실린더 UI + 게임 상태 표시
│   │   ├── BetPanel.tsx          # 베팅 입력 + START/CASH OUT 버튼
│   │   ├── Header.tsx            # 지갑 연결 버튼 + 로고
│   │   ├── StatsBar.tsx          # 잔액, 라운드, 배율 표시
│   │   ├── ResultOverlay.tsx     # 게임 결과 (WIN/DEAD) 오버레이
│   │   ├── Leaderboard.tsx       # 리더보드 (DB 의존)
│   │   ├── LiveFeed.tsx          # 실시간 게임 피드
│   │   ├── WalletProvider.tsx    # Solana wallet-adapter 설정
│   │   └── TestModeProvider.tsx  # E2E 테스트용 자동 지갑 연결
│   ├── hooks/
│   │   ├── useGame.ts            # 핵심: 게임 로직 상태머신
│   │   ├── useProgram.ts         # Anchor program 인스턴스
│   │   ├── useLeaderboard.ts     # 리더보드 fetch
│   │   └── useLiveFeed.ts        # 실시간 피드 fetch
│   ├── lib/
│   │   ├── game-server.ts        # 서버사이드: PDA derivation, program init
│   │   ├── game-mock.ts          # E2E용 in-memory game state (DB 대체)
│   │   ├── constants.ts          # PROGRAM_ID, MIN_BET, PAYOUT_RATES
│   │   ├── anchor.ts             # AnchorProvider helper
│   │   ├── db.ts                 # Vercel Postgres 연결
│   │   ├── testMode.ts           # testMode publicKey/wallet fallback
│   │   └── test-wallet-adapter.ts # TestWalletAdapter (Playwright용)
│   ├── tests/e2e/                # Playwright E2E 테스트
│   │   ├── smoke.spec.ts         # 기본 페이지 로드
│   │   ├── game-flow.spec.ts     # 전체 게임 플로우
│   │   ├── error-handling.spec.ts # 에러 케이스
│   │   └── provably-fair.spec.ts # 공정성 검증 모달
│   ├── playwright/fixtures/      # 테스트 설정
│   │   ├── test-setup.ts         # setupTestMode() + 지갑 연결
│   │   └── test-keypair.json     # 테스트 지갑 키페어
│   └── idl/                      # Anchor IDL (자동생성)
├── specs/                        # 기능 스펙 아카이브
├── scripts/                      # 유틸리티 스크립트
└── design-reference/             # 디자인 레퍼런스 이미지
```

## GAME FLOW (v3 — Server Seed Commit-Reveal)
```
1. Player: 베팅액 입력 → START 클릭
2. Frontend → POST /api/game/start
   → Server: seed 생성, sha256(seed) = hash, DB 저장
   → Response: { gameId, seedHash }
3. Frontend → TX1: start_game(bet, seed_hash)
   → Player 서명 → bet escrowed on-chain, hash committed
4. Player: 챔버 선택 (시각적) → PULL TRIGGER 클릭
5. Frontend → POST /api/game/pull { gameId, round }
   → Server: seed[0] % 6 으로 bullet position 계산
   → bullet_position >= current_round → SURVIVED / DEAD
   → Response: { survived, canCashOut }
6. SURVIVED → 다음 라운드 or CASH OUT
   DEAD → Server settles on-chain (player loses)
7. CASH OUT or 5라운드 생존:
   Frontend → POST /api/game/confirm { gameId, roundsSurvived }
   → Server → TX2: settle_game(rounds, server_seed) — house 서명
   → On-chain: verify sha256(seed) == hash, pay out
8. Provably Fair: Player can verify seed after game
```

**온체인 TX는 2개뿐**: start_game (Player 서명) + settle_game (House 서명)

## ON-CHAIN DETAILS
- **Program ID (devnet v3)**: `98RABzywqR9v33GmioVFeFrapM1LC5RiwmJbXdEPvx59`
- **HouseConfig PDA**: `5jpT7TR8coEKGqtFsTSZZQtQatKL3Xf2h3Mk5mnDuWuz`
- **HouseVault PDA**: `4g7puLuZGEdHDkb2ecqdCGqfdFNHRLiwMNiMuMSqdhYq`
- **Bullet logic**: `server_seed[0] % 6` → position 0~5
- **배율 (basis points)**: [116, 145, 194, 291, 582] → 1.16x~5.82x
- **settle 판정**: `won = bullet_position >= rounds_survived`
- **force_settle**: 1시간 후 Player가 직접 호출 → 베팅금 환불

## API ROUTES
| Route | Method | 역할 |
|-------|--------|------|
| `/api/game/start` | POST | seed 생성 + gameId 반환 |
| `/api/game/active/[wallet]` | GET | 활성 게임 조회 |
| `/api/game/pull` | POST | 라운드별 생존 판정 |
| `/api/game/confirm` | POST | cash out → on-chain settle |
| `/api/game/settle` | POST | 내부 settle 처리 |
| `/api/game/verify/[tx]` | GET | provably fair 검증 |
| `/api/leaderboard` | GET | 리더보드 (DB 의존) |
| `/api/errors` | POST | 에러 리포트 |

## BUILD & TEST
```bash
# Anchor (온체인)
cd anchor-v2 && anchor build && anchor test

# Frontend
cd frontend
pnpm install
pnpm dev              # localhost:3000
pnpm exec tsc --noEmit   # 타입체크
pnpm build            # 프로덕션 빌드

# E2E 테스트 (DB 불필요 — in-memory mock 자동 사용)
cd frontend
pnpm exec playwright test tests/e2e/ --reporter=list

# Vercel 배포
vercel --prod
```

## E2E TEST MODE
- `?testMode=true` 쿼리로 활성화
- `TestWalletAdapter`: Playwright용 가짜 지갑 (실제 devnet TX 서명)
- `game-mock.ts`: DB 없이 in-memory Map으로 게임 상태 관리
- `testMode.ts`: `useWallet()` context null일 때 `window.solana` fallback
- **wallet-adapter-react 제약**: `adapter.connect()` 직접 호출해도 React context 업데이트 안 됨 → `window.solana` fallback 패턴 필수
- 테스트 지갑: `7sGVDuAUW8g4noZggELMgQrpLQbTeARfpViVWrT7WRbW`

## TAILWIND V4 SETUP

### Installation
- **Version**: Tailwind CSS v4 (CSS-first configuration)
- **PostCSS plugin**: `@tailwindcss/postcss`
- **Config file**: `postcss.config.mjs` (NOT tailwind.config.ts)
- **CSS import**: `@import "tailwindcss";` in `globals.css`

### Design Tokens (@theme)
모든 디자인 토큰은 `globals.css`의 `@theme` 블록에 정의됨.
Tailwind 유틸리티 클래스로 자동 매핑:
- `--color-*` → `bg-`, `text-`, `border-` 클래스
- `--font-*` → `font-` 클래스
- `--text-*` → `text-` 클래스
- `--spacing-*` → `p-`, `m-`, `gap-` 클래스
- `--radius-*` → `rounded-` 클래스

예시:
```tsx
<div className="bg-bg-primary text-text-primary font-pixel text-lg p-4 rounded-md">
  {/* Tailwind v4 토큰 사용 */}
</div>
```

### 기존 CSS 변수 유지
`:root` 블록의 기존 CSS 변수는 그대로 유지 (하위 호환).
마이그레이션은 점진적으로 진행 예정.

### Build 주의사항
- `.next` 디렉토리 오류 시: `rm -rf .next && pnpm build`
- TypeScript 체크: `pnpm exec tsc --noEmit` (항상 통과해야 함)
- v4는 JIT 컴파일 — 빌드 시간 개선

## DESIGN SYSTEM

### Identity
**"Degen Roulette"의 미학: 다크 + 네온 그린 + 픽셀 = 크립토 디젠 감성.**
깔끔한 SaaS가 아니다. 위험하고 짜릿한, 하지만 읽기 쉬운 UI.

### Color Palette
```
/* === Background (다크, 미세 그린 틴트) === */
--bg-primary:      #050805     /* 메인 배경 */
--bg-secondary:    #0a0e0a     /* 카드/패널 배경 */
--bg-tertiary:     #0d120d     /* 호버/활성 상태 */
--bg-panel:        rgba(8, 16, 8, 0.92)  /* 반투명 패널 */

/* === Accent (네온 그린) === */
--neon:            #00FF41     /* 핵심 악센트 — 아래 "네온 사용 규칙" 참고 */
--neon-bright:     #39FF14     /* 호버/강조 */
--neon-dim:        #00cc34     /* 비활성 */
--neon-dark:       #009922     /* 매우 약한 힌트 */

/* === Text === */
--text-primary:    #e8f5e8     /* 주요 텍스트 (밝은 그린 틴트 화이트) */
--text-secondary:  #8aaa8a     /* 보조 텍스트 */
--text-muted:      #4a6a4a     /* 비활성/힌트 */

/* === Semantic === */
--danger:          #FF0040     /* 에러, DEAD, 패배 */
--success:         #00FF41     /* = neon (승리) */

/* === Border === */
--border-neon:     rgba(0,255,65,0.35)   /* 활성 패널 */
--border-dim:      rgba(0,255,65,0.12)   /* 기본 패널 */
--border-subtle:   rgba(255,255,255,0.04) /* 거의 안 보임 */
```

### 네온 사용 규칙 (⚠️ 중요)
네온 글로우가 모든 곳에 있으면 위계가 사라진다. **아래 우선순위로만 사용:**
1. **CTA 버튼** (BET/PULL TRIGGER) — `box-shadow` 글로우 허용, 가장 강렬
2. **승리 금액/배율** — `text-shadow` 글로우 허용
3. **활성 상태 보더** — `border-color: var(--border-neon)` (글로우 없이 색상만)
4. **나머지 패널/카드** — `border-color: var(--border-dim)` (약한 네온) 또는 `var(--border-subtle)` (그레이)

**금지:**
- 모든 패널에 `box-shadow` 글로우 때리기
- 텍스트 전체에 `text-shadow` 네온
- 배경 요소에 네온 글로우

### Typography
```
/* === Fonts === */
--pixel-font:  'Press Start 2P', monospace   /* 로고, 배팅금액, 결과, 라운드 숫자 */
--body-font:   'Space Grotesk', sans-serif    /* 나머지 전부 */
```

| 용도 | 폰트 | 사이즈 | 비고 |
|------|-------|--------|------|
| 로고 "DEGEN ROULETTE" | pixel | 0.8rem | 헤더 |
| 배팅 금액 (인풋) | pixel | 1.2-1.5rem | 중앙 강조 |
| 결과 금액 "+0.5 SOL" | pixel | 1.8-2.5rem | 가장 큰 텍스트 |
| 라운드 카운터 "R3" | pixel | 0.7-0.8rem | |
| 배율 "2.91x" | pixel | 0.6-0.8rem | |
| 프리셋 버튼 "0.1" | body (semibold) | 0.65-0.75rem | |
| 설명/라벨 | body | 0.5-0.6rem | |
| 지갑 주소 | body (mono fallback) | 0.4-0.5rem | truncated |

**font-size 정리 원칙**: 현재 20종+ → **8단계 스케일**로 통합
```
--text-3xs:  0.38rem   /* 6px  — 극소 라벨 */
--text-2xs:  0.45rem   /* 7px  — 미세 텍스트 */
--text-xs:   0.5rem    /* 8px  — 보조 정보, 지갑주소 */
--text-sm:   0.6rem    /* 10px — 라벨, 설명 */
--text-base: 0.75rem   /* 12px — 본문 기본 */
--text-md:   0.85rem   /* 14px — 강조 본문 */
--text-lg:   1.2rem    /* 19px — 배팅 금액, 섹션 타이틀 */
--text-xl:   1.8rem    /* 29px — 결과 금액, 히어로 */
```

### Spacing (8px grid)
```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
```
**원칙**: 컴포넌트 내부 패딩은 최소 `--space-3` (12px). 카드 간 갭은 `--space-2~4`.

### Border Radius
```
--radius-sm:   4px    /* 버튼, 배지, 인풋 */
--radius-md:   6px    /* 카드, 패널 */
--radius-lg:   8px    /* 모달, 오버레이 */
--radius-full: 50%    /* 실린더, 챔버 */
```
현재 4px~30px 혼재 → **4단계**로 통합. `30px` 같은 pill shape는 `--radius-lg` 또는 명시적 `rounded-full`.

### Layout
**Desktop (≥1024px)**: 3 columns
- Left (240px sticky): Hall of Degens (Leaderboard)
- Center (flex-1, max-width 600px): Game Area
- Right (240px sticky): Live Feed (Recent Plays)

**Tablet (768-1023px)**: 2 columns
- Center: Game Area
- Right (200px): Live Feed (compact)
- Leaderboard: 하단 수평 스크롤

**Mobile (<768px)**: Game Always Visible
- Game Area: 항상 최상단 (탭 전환 없음!)
- Recent Plays: 게임 아래 컴팩트 3-4줄
- Leaderboard: 헤더 🏆 버튼 → 바텀시트/모달

### Revolver Visual
- **기존 이미지 에셋 유지**: `cylinder-512.png` (Mason 제작 + 챔버 오버레이)
- 데스크탑: 현재 크기 유지
- 모바일: 현재보다 약간 축소 (화면의 ~30% 이하)
- CSS 회전 애니메이션 기존 로직 유지
- **교체하지 마라** — 이 이미지가 브랜드 아이덴티티

### Component Patterns
**CTA 버튼 (BET/PULL TRIGGER)**:
- `border: 2-3px solid var(--neon)`
- `box-shadow: 0 0 15-20px var(--neon-glow-soft)` — 유일한 강한 글로우
- `:hover` → 글로우 강화
- `:disabled` → `border-color: var(--text-muted)`, 글로우 제거

**일반 패널/카드**:
- `background: var(--bg-secondary)` 또는 `var(--bg-panel)`
- `border: 1px solid var(--border-dim)` — 약한 네온, 글로우 없음
- `border-radius: var(--radius-md)` (6px)
- `padding: var(--space-3)~var(--space-4)`

**프리셋 베팅 버튼**:
- `background: var(--bg-tertiary)`
- `border: 1px solid var(--border-dim)`
- `.active` → `border-color: var(--neon)`, `color: var(--neon)`, 배경 미세 틴트

**인풋 필드**:
- `background: var(--bg-primary)`
- `border: 1px solid var(--border-dim)`
- `:focus` → `border-color: var(--neon)`, outline 제거

### 배경 정리
- `body::before` 그리드 패턴 → 제거 또는 극히 미세하게
- `.vignette` → 유지 가능 (미세 비네팅은 분위기에 도움)
- 파티클/스캔라인 → 제거
- 배경은 **단색 `var(--bg-primary)`** 기본

### 금지사항
- ❌ 새로운 네온 색상 추가 (그린 계열 이외)
- ❌ font-size 새 값 임의 추가 (8단계 스케일 내에서만)
- ❌ `!important` 남발 (현재 있는 것도 Tailwind 전환 시 제거)
- ❌ 인라인 스타일에 하드코딩 색상값 (CSS 변수 사용)
- ❌ 리볼버 이미지 교체 또는 CSS-only 리볼버로 변경
- ❌ 모바일에서 Game을 탭 전환으로 숨기기

## 규칙
- **specs/ 먼저 읽고 작업** — 스펙에 없는 건 임의 판단 금지
- 온체인 배율 ↔ 프론트 배율 반드시 동일 유지
- Anchor Account size(LEN): **discriminator 8 bytes 포함**
- API route: `export const runtime = 'nodejs'` (edge 금지)
- Postgres BIGINT → JS string 변환 주의
- server_seed: DB에 hex → `Buffer.from(seed, 'hex')[0] % 6`
- current_round: 0-indexed, settle_game: rounds_survived 1-5
- `!process.env.POSTGRES_URL` → game-mock 자동 사용 (E2E 호환)
- `.env.local` 커밋 금지. `.env.example` 참고

## DEPLOYMENT
- **Frontend**: Vercel (https://frontend-umber-kappa-32.vercel.app/)
- **On-chain**: Solana Devnet (`anchor deploy --provider.cluster devnet`)
- **DB**: Vercel Postgres (프로덕션만, E2E는 mock)
