# Component Redesign v1 — Clean Dark Gambling

## 목표
design-system-v3.md 기반으로 전체 UI 리디자인. "네온 과다"에서 "절제된 다크 겜블링"으로.

## 핵심 원칙 (반드시 준수)
1. **네온 그린(#00FF41)은 CTA 버튼 + 승리 금액 + 핵심 수치에만** — 나머지는 그레이스케일
2. **글로우는 CTA 하나에만** — 패널/카드/배지에 글로우 없음
3. **Press Start 2P는 로고, 배팅금액, 결과 수치에만** — 나머지는 Space Grotesk
4. **배경: 단색 다크** — 그리드 패턴, 파티클, vignette, 스캔라인 전부 제거
5. **카드/패널: 1px solid #252525 보더** — 네온 보더 아님
6. **간격 넓히기** — 카드 내부 패딩 20px, 카드 간 갭 16-24px

## Design Tokens (이미 @theme에 정의됨, 업데이트 필요)

### @theme 블록 교체 (globals.css)

```css
@theme {
  /* Background */
  --color-bg-primary: #080C08;
  --color-bg-surface: #0E130E;
  --color-bg-elevated: #151A15;
  --color-bg-overlay: rgba(0, 0, 0, 0.7);

  /* Accent — 사용 범위 제한! */
  --color-accent: #00FF41;
  --color-accent-muted: #00CC34;
  --color-accent-subtle: rgba(0, 255, 65, 0.08);

  /* Neutral */
  --color-white: #F0F0F0;
  --color-gray-100: #B0B0B0;
  --color-gray-200: #707070;
  --color-gray-300: #404040;
  --color-gray-400: #252525;

  /* Semantic */
  --color-danger: #FF3B3B;
  --color-warning: #FFB020;
  --color-success: #00FF41;

  /* Border */
  --color-border-default: #252525;
  --color-border-active: rgba(0, 255, 65, 0.3);

  /* Fonts */
  --font-display: 'Press Start 2P', monospace;
  --font-body: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font Sizes */
  --text-2xs: 0.625rem;    /* 10px */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.25rem;      /* 20px */
  --text-xl: 1.5rem;       /* 24px */
  --text-2xl: 2rem;        /* 32px */

  /* Spacing (8px grid) */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### :root 호환 블록 (기존 컴포넌트 지원)
기존 :root CSS 변수도 새 팔레트로 업데이트. 점진적으로 제거.

```css
:root {
  --bg-primary: #080C08;
  --bg-secondary: #0E130E;
  --bg-tertiary: #151A15;
  --neon: #00FF41;
  --neon-dim: #00CC34;
  --neon-glow: rgba(0, 255, 65, 0.6);
  --neon-glow-soft: rgba(0, 255, 65, 0.25);
  --neon-glow-subtle: rgba(0, 255, 65, 0.1);
  --text-primary: #F0F0F0;
  --text-secondary: #B0B0B0;
  --text-muted: #707070;
  --text-dim: #404040;
  --danger: #FF3B3B;
  --danger-glow: rgba(255, 59, 59, 0.5);
  --success: #00FF41;
  --success-glow: rgba(0, 255, 65, 0.5);
  --border-default: #252525;
  --border-dim: rgba(0, 255, 65, 0.12);
  --border-neon: rgba(0, 255, 65, 0.35);
  --border-neon-bright: rgba(0, 255, 65, 0.5);
  --pixel-font: 'Press Start 2P', monospace;
  --body-font: 'Space Grotesk', sans-serif;
}
```

## globals.css 구조 (목표: ~300줄)

```
1. @import "tailwindcss"
2. @theme { ... }
3. :root { ... }  (호환성)
4. * { margin:0; padding:0; box-sizing:border-box }
5. body { background: var(--bg-primary); color: var(--text-primary); font-family: var(--body-font) }
6. .main { display:flex; gap:24px; max-width:1200px; margin:0 auto; padding:24px }
7. .sidebar { width:240px; flex-shrink:0 }
8. .game-area { flex:1; max-width:600px; margin:0 auto }
9. .header { height:56px; border-bottom:1px solid var(--border-default); ... }
10. .panel { background:var(--bg-secondary); border:1px solid var(--border-default); border-radius:12px; padding:20px }
11. .panel-title { font-family:var(--body-font); font-size:0.75rem; font-weight:600; color:var(--gray-100); letter-spacing:1px }
12. 반응형 미디어쿼리 (1024/768px)
13. 키프레임 애니메이션 (fadeIn, shake, spin — 최소한만)
```

### 삭제할 것
- `body::before` 그리드 패턴
- `.vignette`
- `@keyframes borderGlow` (패널용)
- 모든 `::before`, `::after` corner decorations (패널/카드)
- 네온 보더/글로우가 있는 `.panel`, `.game-card` 스타일
- `>>> SELECT YOUR BET <<<` 텍스트
- 중복 미디어쿼리 (1200/768/500/480/380px → 1024/768px 2단계로)

## 컴포넌트별 리디자인

### 1. Header.tsx
**현재 문제**: 높이 과다, 로고 없음 (이모지만), stats-badge 불필요
**변경**:
- 높이: 56px
- 좌: "🎯 DEGEN ROULETTE" (font-display, text-lg, accent color)
- 우: X 링크 + Connect Wallet 버튼
- 배경: bg-primary + border-bottom 1px solid border-default
- Total Plays badge 제거 (StatsBar로 이동)
- result-banner 제거 (ResultOverlay가 담당)
- `style jsx` 제거 → Tailwind 유틸리티 클래스로

### 2. BetPanel.tsx
**현재 문제**: `>>> SELECT YOUR BET <<<` 촌스러움, 네온 과다, font 혼용
**변경**:
- instruction 텍스트: 제거하거나 "Enter bet amount" 미니멀 플레이스홀더
- bet-input-wrapper: bg-primary, border 1px solid border-default, focus시 border-accent
  - 글로우/그라데이션 배경 전부 제거
- 인풋: font-display, text-xl, white color (네온 아님), 중앙 정렬
- currency label "SOL": font-body, text-xs, gray-200
- quick-btn: bg-elevated, border 1px border-default, font-body semibold, text-sm
  - selected: border-accent, color accent, bg accent-subtle
- payout-info: font-body (pixel font 아님!), text-xs, gray-100
- trigger-btn (CTA): **유일한 글로우 요소**
  - border 2px solid accent, color accent, font-display
  - box-shadow: 0 0 20px rgba(0,255,65,0.15)
  - hover: bg accent-subtle, shadow 강화
- fair-badge: font-body, text-xs, gray-200, border-default
- `style jsx` 제거 → Tailwind 유틸리티

### 3. StatsBar.tsx
**현재 문제**: corner decorations, 네온 보더, 과도한 text-shadow
**변경**:
- stat-card: bg-surface, border 1px border-default, radius-md, padding 12px
  - `::before` corner 제거
  - 네온 보더 제거
- label: font-body, text-xs, gray-200
- value: font-display, text-lg, white
  - accent value: color accent (text-shadow 제거 또는 매우 미세하게)
  - danger value: color danger
- unit: font-body, text-2xs, gray-200
- 반응형: 4col → 2col (500px 이하)
- `style jsx` 제거 → Tailwind

### 4. Leaderboard.tsx
**현재 문제**: corner decorations, 네온 보더, 2개 패널로 불필요하게 분리
**변경**:
- 단일 패널: "HALL OF DEGENS" 하나로 통합 (rank-panel 제거)
- panel-title: font-body, semibold, text-xs, gray-100, letter-spacing 1px
  - `::before` 제거
- leaderboard-item: padding 12px 8px, border-bottom 1px border-default
  - hover: bg-elevated (네온 아님)
  - current-user: border-left 2px accent, bg accent-subtle
- address: font-mono, text-xs, gray-100
- profit positive: color accent (text-shadow 제거)
- profit negative: color danger
- rank-icon 애니메이션 제거
- `style jsx` 제거 → Tailwind

### 5. LiveFeed.tsx
**현재 문제**: corner decorations, 네온 글로우 과다
**변경**:
- live-feed-panel: bg-surface, border 1px border-default, radius-lg, padding 20px
  - `::before/::after` corner 제거
- feed-header: flex, justify-between
  - feed-title: font-body, semibold, text-xs, gray-100
  - feed-scope: font-body, text-2xs, gray-200, bg-elevated, padding 2px 8px, radius-sm
- feed-item: padding 10px 0, border-bottom 1px border-default
  - hover: bg-elevated
- player: font-body (pixel 아님!), text-sm, white
- round: font-body, text-xs, gray-200
- result badge:
  - safe: color accent, bg accent-subtle, border 1px border-active, font-body text-xs
    - text-shadow 제거
  - bang: color danger, bg rgba(255,59,59,0.08), border 1px rgba(255,59,59,0.3)
- profit positive: font-mono, text-sm, accent
- profit negative: font-mono, text-sm, danger
- `style jsx` 제거 → Tailwind

### 6. ResultOverlay.tsx
**현재 문제**: 과도한 글로우 레이어, corner decorations
**변경**:
- overlay: bg rgba(0,0,0,0.92), fixed, center
- result-content: bg-surface, border 2px (won→accent, lost→danger), radius-lg, padding 32px
  - corner decorations 전부 제거
  - box-shadow: won → 0 0 30px rgba(0,255,65,0.2) (1레이어만)
  - box-shadow: lost → 0 0 30px rgba(255,59,59,0.2)
- title: font-display
  - won "YOU LIVE.": color accent, text-shadow 0 0 20px rgba(0,255,65,0.3) (1레이어)
  - lost "YOU DIED.": color danger, text-shadow 0 0 20px rgba(255,59,59,0.3)
- stat cards: bg-elevated, border 1px border-default, radius-md
  - 네온 그라데이션 배경 제거
- play-again-btn: 유일한 글로우 CTA (BetPanel과 동일 스타일)
  - 현재의 과도한 다중 box-shadow → 2레이어로 축소
- fair-btn: font-body, text-xs, gray-200, 미니멀
- `style jsx` 제거 → Tailwind

### 7. GameBoard.tsx
**게임 로직은 건드리지 않는다.** UI 클래스만 변경.
- game-card: bg-surface, border 1px border-default, radius-lg, padding 20px
  - corner decorations 제거
  - 네온 글로우 제거
- multiplier-table: 현재 스타일 유지하되 font을 body로
- revolver 이미지: 크기 유지
- chamber 선택 UI: 네온 줄이고 accent를 선택된 것에만

## 실행 순서
1. globals.css 완전 재작성 (@theme 업데이트 + :root 호환 + 레이아웃 + 삭제 항목 제거)
2. Header.tsx → Tailwind 유틸리티로 전환
3. BetPanel.tsx → Tailwind 유틸리티로 전환
4. StatsBar.tsx → Tailwind 유틸리티로 전환
5. Leaderboard.tsx → Tailwind 유틸리티로 전환
6. LiveFeed.tsx → Tailwind 유틸리티로 전환
7. ResultOverlay.tsx → Tailwind 유틸리티로 전환
8. GameBoard.tsx → UI 클래스만 Tailwind로 (게임 로직 미변경)
9. page.tsx → vignette div 제거, 레이아웃 클래스 Tailwind로

## 검증
- `pnpm build` 성공
- `tsc --noEmit` 통과
- 기존 기능 동작 (게임 로직 미변경 확인)

## 주의사항
- GameBoard.tsx의 게임 로직(useGame, sound, spin 로직)은 절대 변경하지 말 것
- data-testid 속성 유지 (E2E 테스트)
- WalletMultiButton 스타일은 globals.css에서 오버라이드 (컴포넌트 내부 변경 불가)
- JetBrains Mono 폰트 import 추가 필요:
  ```tsx
  // layout.tsx에 추가
  import { JetBrains_Mono } from "next/font/google";
  const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
  // body className에 추가: `${jetBrainsMono.variable}`
  ```
- `style jsx` 를 전부 제거하고 Tailwind 유틸리티 클래스로 전환
- Tailwind v4 CSS-first config: `tailwind.config.ts` 없음, `postcss.config.mjs`에 `@tailwindcss/postcss` 플러그인
- `@theme` 블록의 커스텀 프로퍼티는 Tailwind 유틸리티로 자동 매핑됨 (예: `--color-accent` → `text-accent`, `bg-accent`)
- font-family 변수명: `--font-display`, `--font-body`, `--font-mono` → `font-display`, `font-body`, `font-mono` 유틸리티
- Tailwind v4에서 커스텀 spacing: `--spacing-*` → 유틸리티 자동 생성 (p-6 = 24px 등)
