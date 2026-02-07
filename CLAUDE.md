# CLAUDE.md

## WHAT
- Solana 러시안 룰렛 게임 (Anchor v2 + Next.js 16 + React 19 + Tailwind)
- Devnet 배포 대상
- 전체 재설계 진행 중 (v2)

## SPEC
- **전체 스펙**: `/Users/nova/projects/degen-roulette/GAME-SPEC.md` (필독)
- 2-TX 모델: start_game(베팅) → 클라이언트 플레이 → settle_game(VRF 판정)
- Orao VRF 통합
- 배율: [116, 145, 194, 291, 582] basis points (1.16x~5.82x)

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
```

## 구조
```
├── anchor-v2/                    # Anchor 프로그램
│   ├── programs/degen-roulette-v2/src/
│   │   ├── lib.rs               # 엔트리포인트
│   │   ├── instructions/        # game.rs, admin.rs
│   │   ├── state/               # game.rs, house.rs
│   │   └── error.rs
│   └── Anchor.toml
├── frontend/                     # Next.js 앱
│   ├── app/page.tsx
│   ├── components/
│   ├── hooks/
│   └── lib/
├── design-reference/             # 디자인 레퍼런스 HTML
└── GAME-SPEC.md                  # 전체 스펙 (필독)
```

## 규칙
- **GAME-SPEC.md를 반드시 먼저 읽고 작업**
- 디자인/UI 판단이 필요하면 → [STATUS:NEEDS_INPUT]으로 질문
- 작업 전환 시 /clear
- 컨텍스트 60% 넘으면 /compact
- 2회 실패 시 /clear 후 재시작
- 온체인 배율과 프론트 배율은 반드시 동일하게 유지
- (Anchor) Account size(LEN) 계산 시 **discriminator 8 bytes 포함**
- (VRF) seed는 **온체인에서 생성 → GameState 조회로 vrf_seed 획득 → settle TX에서 randomness PDA 계산 후 전달** 순서 필수
