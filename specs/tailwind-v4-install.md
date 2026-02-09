# Tailwind CSS v4 설치 + 토큰 매핑

## 목표
기존 globals.css의 CSS 변수를 Tailwind v4 토큰으로 매핑. 기존 스타일은 아직 마이그레이션하지 않음 — 설치 + 토큰 정의만.

## 작업 범위

### 1. 패키지 설치
```bash
cd frontend
pnpm add tailwindcss @tailwindcss/postcss postcss
```

### 2. PostCSS 설정
`postcss.config.mjs` 생성 (또는 수정):
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### 3. globals.css에 Tailwind import 추가
파일 최상단에:
```css
@import "tailwindcss";
```

**중요**: 기존 CSS 변수 (:root 블록)와 모든 기존 스타일은 그대로 유지. `@import "tailwindcss"` 위에 놓기.

### 4. @theme으로 디자인 토큰 정의
globals.css에서 `@import "tailwindcss";` 바로 아래에 @theme 블록 추가.
CLAUDE.md의 DESIGN SYSTEM 섹션을 참조해서 매핑:

```css
@theme {
  /* Colors — Background */
  --color-bg-primary: #050805;
  --color-bg-secondary: #0a0e0a;
  --color-bg-tertiary: #0d120d;
  --color-bg-panel: rgba(8, 16, 8, 0.92);
  
  /* Colors — Accent (Neon Green) */
  --color-neon: #00FF41;
  --color-neon-bright: #39FF14;
  --color-neon-dim: #00cc34;
  --color-neon-dark: #009922;
  
  /* Colors — Text */
  --color-text-primary: #e8f5e8;
  --color-text-secondary: #8aaa8a;
  --color-text-muted: #4a6a4a;
  
  /* Colors — Semantic */
  --color-danger: #FF0040;
  --color-danger-bright: #FF1A5C;
  --color-success: #00FF41;
  
  /* Colors — Border */
  --color-border-neon: rgba(0, 255, 65, 0.35);
  --color-border-dim: rgba(0, 255, 65, 0.12);
  --color-border-subtle: rgba(255, 255, 255, 0.04);
  
  /* Fonts */
  --font-pixel: 'Press Start 2P', monospace;
  --font-body: 'Space Grotesk', sans-serif;
  
  /* Font Sizes (8-step scale) */
  --text-3xs: 0.38rem;
  --text-2xs: 0.45rem;
  --text-xs: 0.5rem;
  --text-sm: 0.6rem;
  --text-base: 0.75rem;
  --text-md: 0.85rem;
  --text-lg: 1.2rem;
  --text-xl: 1.8rem;
  
  /* Spacing (8px grid) */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 50%;
}
```

### 5. 검증
- `pnpm exec tsc --noEmit` — 타입 에러 없어야 함
- `pnpm build` — 빌드 성공해야 함
- 기존 UI가 깨지지 않아야 함 (기존 CSS 변수는 그대로 유지하므로)
- Tailwind 유틸리티 클래스 (`bg-bg-primary`, `text-neon`, `font-pixel` 등) 사용 가능해야 함

### 6. 기존 postcss.config.mjs가 있으면
파일이 이미 존재하면 플러그인만 추가/교체. 다른 플러그인(autoprefixer 등)은 유지.

## 하지 말 것
- ❌ 기존 CSS 스타일을 Tailwind 클래스로 마이그레이션하지 마라 (다음 단계)
- ❌ 기존 :root CSS 변수 블록을 삭제하지 마라 (아직 기존 스타일이 참조 중)
- ❌ tailwind.config.ts 파일을 만들지 마라 (v4는 CSS-first configuration)
- ❌ 컴포넌트 파일을 수정하지 마라
