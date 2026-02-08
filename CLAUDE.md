# CLAUDE.md

## WHAT
- Solana 러시안 룰렛 게임 (Anchor v2 + Next.js 16 + React 19 + Tailwind)
- Devnet 배포 완료
- **v3**: VRF 제거, Server Seed Commit-Reveal 방식

## ARCHITECTURE (v3)
```
Player → POST /api/game/start → Server generates seed, returns hash
Player → TX1: start_game(bet, seed_hash) → bet escrowed + hash committed
Player → POST /api/game/pull → Server checks bullet per round (off-chain)
Player → POST /api/game/settle(rounds) → Server settles on-chain
Server → TX2: settle_game(rounds, server_seed) → verify hash, pay out
Player → POST /api/game/verify → provably fair 검증
```

- **온체인 TX는 2개뿐**: start_game (플레이어 서명) + settle_game (house 서명)
- **VRF 없음** → server seed commit-reveal (death.fun 방식)
- **force_settle** → 1시간 후 플레이어가 직접 호출 (베팅금 환불)
- **Provably Fair**: sha256(server_seed) == on-chain committed hash

## KEY FILES
```
├── anchor-v2/programs/degen-roulette-v2/src/
│   ├── instructions/game.rs      # start_game, settle_game, force_settle
│   ├── instructions/admin.rs     # init_house, fund_house
│   ├── state/                    # GameState, HouseConfig
│   └── error.rs
├── frontend/
│   ├── app/api/game/             # start/settle/verify/active/pull endpoints
│   ├── hooks/useGame.ts          # 게임 로직 훅
│   ├── lib/game-server.ts        # getHouseProgram(), derivePDAs()
│   ├── components/               # UI 컴포넌트
│   └── app/page.tsx
└── specs/                        # 기능 스펙 (아카이브)
```

## BUILD & TEST
```bash
# Anchor (온체인 프로그램)
cd anchor-v2
anchor build
anchor test   # 로컬 밸리데이터 자동 시작

# Frontend
cd frontend
npm install
npm run dev   # localhost:3000
npx tsc --noEmit  # 타입체크
npm run build  # 프로덕션 빌드
```

## ON-CHAIN DETAILS
- **Program ID (devnet v3)**: `98RABzywqR9v33GmioVFeFrapM1LC5RiwmJbXdEPvx59`
- **HouseConfig PDA**: `5jpT7TR8coEKGqtFsTSZZQtQatKL3Xf2h3Mk5mnDuWuz`
- **HouseVault PDA**: `4g7puLuZGEdHDkb2ecqdCGqfdFNHRLiwMNiMuMSqdhYq`
- **Bullet logic**: `server_seed[0] % 6` (0~5)
- **배율**: [116, 145, 194, 291, 582] basis points (1.16x~5.82x)
- **settle**: `won = bullet_position >= rounds_survived`

## 규칙
- **specs/ 폴더의 스펙 파일을 반드시 먼저 읽고 작업**
- 디자인/UI 판단이 필요하면 → [STATUS:NEEDS_INPUT]으로 질문
- 스펙에 없는 것은 임의로 판단하지 말고 질문
- 온체인 배율과 프론트 배율은 반드시 동일하게 유지
- (Anchor) Account size(LEN) 계산 시 **discriminator 8 bytes 포함**
- (Next API + Vercel Postgres) API route에서 `@vercel/postgres` 쓸 때는 **반드시** `export const runtime = 'nodejs'` (edge 금지) + `sql\`...\`` 태그드 템플릿 사용
- Postgres BIGINT는 JS에서 **string**으로 돌아오니 변환 로직 주의
- server_seed는 DB에 hex string으로 저장 → `Buffer.from(server_seed, 'hex')[0] % 6` = 온체인 `server_seed[0] % 6`
- current_round는 0-indexed, 온체인 settle_game은 rounds_survived 1-5만 허용
