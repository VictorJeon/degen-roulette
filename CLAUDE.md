# CLAUDE.md — Degen Roulette

## WHAT
Solana 러시안 룰렛 게임. 플레이어가 SOL을 베팅하고, 6발 중 1발 실탄이 든 실린더를 라운드마다 돌린다.
살아남을수록 배율 상승 (1.16x → 5.82x). 언제든 cash out 가능.

- **Stack**: Anchor v2 (Rust) + Next.js 16 + React 19 + Tailwind
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
