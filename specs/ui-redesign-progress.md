# UI Redesign Progress — Checkpoint 2026-02-10 14:47 KST

## 완료된 작업

### Phase 1: Tailwind v4 Migration ✅
- `@import "tailwindcss"` + `@theme` block, `tailwind.config.ts` 삭제
- CSS-first configuration, `:root` 변수 호환 유지

### Phase 2: Component Redesign v1 ✅
- 5-phase 실행 (bg-20260210-020648, $2.13)
- 모든 컴포넌트 style jsx → Tailwind 유틸리티 전환
- Git: 13474aa

### Phase 3: BetPanel Iterations ✅
- Card wrapper 제거 (Mason: "looks weird")
- "WAGER" 라벨 제거 (Mason: "confusing")
- 중복 Provably Fair 버튼 제거, WIN/LOSS payout 제거
- Quick bet chips + custom input with −/+ buttons + CTA hover glow

### Phase 4: Font System ✅
- **최종 3-font (Mason 2026-02-10 확정)**:
  - **Tier 1 Silkscreen (font-pixel)**: "DEGEN ROULETTE" 타이틀 + "YOU LIVE."/"YOU DIED." — 극소수 브랜드만
  - **Tier 2 Chakra Petch (font-display)**: CTA 버튼 + R1-R5 라벨 + 섹션 헤더 (HALL OF DEGENS, LIVE FEED, RANK 등)
  - **Tier 3 Space Mono (font-body)**: 나머지 전부 (배수값, 금액, 본문, 주소)
- 최소 폰트: 데스크탑 14px (text-sm), 모바일 12px (text-xs)
- layout.tsx: Silkscreen(400,700) + Chakra_Petch(400-700) + Space_Mono(400,700)
- CSS vars: --nf-pixel, --nf-heading, --nf-body
- globals.css @theme: --font-display(Chakra Petch), --font-pixel(Silkscreen), --font-body(Space Mono), --font-mono(Space Mono)

### Phase 5: UI Polish v2 ✅
- **CONNECT WALLET**: 지갑 미연결 시 BET → CONNECT WALLET 전환 (useWallet + useWalletModal)
- **확률 분수 제거**: ROUND_ODDS 삭제
- **실린더 dim 효과**: idle=brightness-[0.35] saturate-[0.3], active=full brightness
- **Footer 링크 이동**: "How to Play · Provably Fair" 게임 카드 밖 텍스트 링크로
- **간격 개선**: gap-5, 실린더 mt-4 mb-4, 데스크탑 실린더 280px
- **모바일 패딩**: px-5, max-w-[360px] (좌우 꽉 차는 문제 해결)
- **그리드 갭**: gap-6, px-6 (데스크탑)

## 현재 상태 (Git: 8731482)

### 컴포넌트별 font-display 사용 (의도적 — CTA/헤더만):
- BetPanel.tsx: 1 (CTA 버튼)
- GameBoard.tsx: 4 (타이틀 영역은 font-pixel, 나머지 CTA)
- ResultOverlay.tsx: 2 (PLAY AGAIN, YOU LIVE/DIED 관련)

### data-testid 보존 (8개):
- BetPanel: 2 (bet-input, start-game-button)  
- GameBoard: 4 (chamber-0~5 중 선택, pull-trigger-button, cashout-button, provably-fair-button)
- ResultOverlay: 2 (play-again-button, result-provably-fair-button)

### 알려진 이슈:
1. **사이드바 잘림** — HALL OF DEGENS 좌측, GLOBAL 우측 텍스트 클리핑. 3-col 레이아웃 리팩토링에서 해결 예정.
2. **실린더 PNG 글로우** — 이미지 자체에 네온 baked-in. Mason: "수용 가능"

## Mason 피드백 요약 (2026-02-10)

### 동의한 것:
- 사이드바 잘림 수정 필요
- 간격 빡빡 → 해결됨
- 배수 테이블 idle 위계 부족 → 부분 해결 (dim 실린더로 시선 유도)
- 지갑 미연결 안내 → CONNECT WALLET로 해결
- 확률 분수 제거 → 삭제
- HOW TO PLAY/PROVABLY FAIR → 푸터로 이동
- 게임 상태: 명시적 인디케이터 대신 게임스러운 시각 전환 (dim→bright)

### 미동의:
- 배수 테이블 위치 이동 (유지)
- 퀵벳 0.001 제거 (유지 — 실제로 많이 사용)
- HOW TO PLAY 위치 변경 (하단 유지, 대신 게임 자체를 직관적으로)

## 다음 파이프라인

1. **baseline-ui** — 일관성 검증 + 토큰 준수 체크
   - 모든 컴포넌트에서 남은 font-display/font-sans/text-2xs 위반 검사
   - 컬러 토큰 준수 (하드코딩 hex 없는지)
   - 간격/패딩 일관성
2. **fixing-accessibility** — ARIA labels, contrast ratios, keyboard navigation
3. **desktop 3-col + mobile layout** — 반응형 그리드 시스템 (사이드바 잘림 해결 포함)

## 파일 위치
- 프론트엔드: `/Users/nova/projects/degen-roulette/frontend/`
- 스펙: `/Users/nova/projects/degen-roulette/specs/`
- 디자인 시스템: `/Users/nova/projects/degen-roulette/specs/design-system-v3.md`
- Dev server: `cd frontend && npx next dev --turbopack -p 3000`
