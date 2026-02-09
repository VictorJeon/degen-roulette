# EXECUTE: Component Redesign v1

## 지시
기존 플랜 `/home/nova/.claude/plans/vast-churning-fox.md`와 스펙 `specs/component-redesign-v1.md`을 참조하여 **코드를 실제로 작성**하라. 플래닝 모드가 아님 — 모든 파일을 수정하고 빌드 통과까지 확인.

## 실행 순서 (5 Phase)

### Phase 1: globals.css 리라이트
- `frontend/app/globals.css` (2233줄 → ~280줄)
- `@import "tailwindcss"` + 새 `@theme {}` 블록 유지
- 삭제 대상: body::before(grid), body::after(scanlines), .vignette, :root 블록, 모든 glow/sparkle/pulse keyframes, 모든 .header/.panel/.leaderboard-*/.game-*/.multiplier-*/.cylinder-*/.chamber-*/.bullet-*/.trigger-btn/.cashout-btn/.bet-*/.quick-*/.payout-*/.fair-badge/.result-*/.live-feed-*/.feed-*/.stats-*/.stat-* 클래스, 모든 corner decoration pseudo-elements, 모든 @media 블록, #particle-canvas
- 유지 대상: @import + @theme, * reset, body base styles, screenShake/shake/spin/fadeIn keyframes, body.shake + .animate-shake, .flash-overlay, wallet adapter overrides (~40줄 심플화), input[type=number] spinner removal

### Phase 2: 소형 컴포넌트 4개 (병렬)
- Header.tsx: style jsx 제거 → Tailwind (h-14, border-b border-[#252525], bg-[#0E130E])
- StatsBar.tsx: style jsx 132줄 제거 → grid grid-cols-4, bg-[#0E130E] border border-[#252525] rounded-lg p-3
- LiveFeed.tsx: style jsx 77줄 제거 → bg-[#0E130E] border border-[#252525] rounded-xl p-5
- Leaderboard.tsx: style jsx 75줄 제거 → 동일 패턴

### Phase 3: 대형 컴포넌트 2개
- BetPanel.tsx: style jsx 139줄 제거, CTA에만 glow: `border-2 border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.15)]`
- ResultOverlay.tsx: style jsx 420줄 제거, corner div 4개 삭제, .btn-glow span 삭제

### Phase 4: GameBoard.tsx
- style jsx ~690줄 제거 (3블록)
- CornerDecor 컴포넌트 삭제 (dead code)
- .cylinder-sparkles div + 8 span 삭제
- 동적 인라인 스타일(cylinder rotation, chamber positions) 그대로 유지
- 게임 로직(useGame, sound, spin) 절대 수정 금지

### Phase 5: page.tsx
- vignette div 삭제
- 레이아웃: `grid grid-cols-[220px_1fr_300px]` + `max-lg:hidden` sidebar

## 폰트
layout.tsx에 JetBrains_Mono import 추가:
```tsx
import { Press_Start_2P, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })
```
body className에 `${jetbrainsMono.variable}` 추가.

## Design Tokens (@theme)
```css
@theme {
  --color-bg-primary: #080C08;
  --color-bg-surface: #0E130E;
  --color-bg-elevated: #151A15;
  --color-accent: #00FF41;
  --color-accent-muted: #00CC34;
  --color-white: #F0F0F0;
  --color-gray-100: #B0B0B0;
  --color-gray-200: #707070;
  --color-gray-300: #404040;
  --color-gray-400: #252525;
  --color-border-default: #252525;
  --color-danger: #FF3B3B;
  --font-family-display: 'Press Start 2P', monospace;
  --font-family-body: 'Space Grotesk', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  --font-size-2xs: 0.625rem;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
}
```

## 절대 보존
- 모든 `data-testid` 속성 (8개)
- useGame hook 호출, sound 로직, spin 로직
- 동적 인라인 스타일 (cylinder rotation, chamber CSS transform)
- Wallet adapter 연결 플로우

## 검증 (반드시 실행)
1. `cd frontend && npm run build` — 에러 0
2. `npx tsc --noEmit` — 타입 에러 0
3. grep으로 data-testid 8개 전부 존재 확인

## 주의
- `>>> SELECT YOUR BET <<<` 텍스트 삭제
- Press Start 2P는 로고, 배팅금액, 결과 수치에만 사용
- 나머지 모든 텍스트는 Space Grotesk (font-body)
- 네온 글로우는 CTA 버튼 1개에만 허용
