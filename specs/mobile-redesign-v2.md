# Mobile Redesign v2 — Concrete Implementation

## 목표
모바일 UI를 레퍼런스(코인플립 앱) 수준으로 조화롭게. 핵심: 요소 크기 균일, 여백 일정, compact bet input.

---

## 1. BetPanel.tsx — 프리셋 금액 변경

**파일**: `frontend/components/BetPanel.tsx`

```tsx
// Line 26: 변경
const quickBets = [0.001, 0.01, 0.05, 0.10, 0.25, 0.50];
```

## 2. BetPanel.tsx — CTA 버튼 텍스트

```tsx
// trigger-btn의 텍스트를 동적으로 변경
// "PLAY AGAIN" → "BET {betAmount} SOL"
// gameState.status === 'idle' 이든 다른 상태든 동일
<span className="btn-inner">BET {betAmount} SOL</span>
```

## 3. BetPanel.tsx — bet-input-wrapper 레이아웃 변경

현재 구조: `[input] [arrows(−/+)] [SOL]`
변경 구조: `[SOL label] [input] [−] [+]`

```tsx
<div className="bet-input-wrapper">
  <span className="bet-currency-label">SOL</span>
  <input ... className="bet-input-inline" />
  <button className="arrow-btn" onClick={decrement}>−</button>
  <button className="arrow-btn" onClick={increment}>+</button>
</div>
```

## 4. BetPanel.tsx — Provably Fair 중복 제거

현재: `fair-badge` 인라인 + 하단 "How to Play" / "Provably Fair" 버튼 2개
변경: `fair-badge` 인라인만 유지, 클릭 가능하게. 하단 버튼 영역 제거.

```tsx
// fair-badge를 button으로 감싸서 클릭 시 모달 열기
<button className="fair-badge" onClick={() => setShowFairModal(true)}>
  <CheckCircle ... /> PROVABLY FAIR
</button>

// 하단의 info-buttons div 전체 제거
```

## 5. globals.css — 모바일 bet-input-wrapper 스타일

```css
/* @media (max-width: 768px) 안에 추가/수정 */

.bet-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0;
    width: 100%;
    max-width: 380px;
    height: 48px;
    border: 1px solid rgba(0, 255, 65, 0.25);
    border-radius: 6px;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(0, 20, 0, 0.6) 0%, rgba(0, 12, 0, 0.8) 100%);
}

.bet-currency-label {
    font-family: var(--pixel-font);
    font-size: 0.5rem;
    color: var(--text-muted);
    padding: 0 12px;
    background: rgba(0, 255, 65, 0.08);
    height: 100%;
    display: flex;
    align-items: center;
    border-right: 1px solid rgba(0, 255, 65, 0.15);
}

.bet-input-inline {
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
    font-family: var(--pixel-font);
    font-size: 0.8rem;
    color: var(--neon);
    padding: 0 12px;
    text-align: left;
}

.arrow-btn {
    width: 48px;
    height: 100%;
    border: none;
    border-left: 1px solid rgba(0, 255, 65, 0.15);
    background: rgba(0, 255, 65, 0.05);
    color: var(--neon);
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.arrow-btn:active {
    background: rgba(0, 255, 65, 0.15);
}
```

## 6. globals.css — 프리셋 버튼 스타일 수정

```css
/* @media (max-width: 768px) */

.quick-amounts-inline {
    display: flex;
    gap: 6px;
    justify-content: center;
    width: 100%;
    max-width: 380px;
}

.quick-btn-inline {
    flex: 1;
    font-family: var(--pixel-font);
    font-size: 0.42rem;
    padding: 8px 4px;
    border: 1px solid rgba(0, 255, 65, 0.25);
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted);
    text-align: center;
}

.quick-btn-inline.selected {
    background: rgba(0, 255, 65, 0.15);
    border-color: var(--neon);
    color: var(--neon);
}
```

## 7. globals.css — payout-info 크기 키우기

```css
/* @media (max-width: 768px) */

.payout-info {
    font-size: 0.48rem;  /* 현재 0.34rem → 0.48rem */
    color: var(--text-primary);
    margin: 4px 0;
}

.payout-info .value.win {
    color: var(--neon);
    text-shadow: 0 0 6px var(--neon-glow-subtle);
}

.payout-info .value.loss {
    color: var(--danger);
}
```

## 8. globals.css — 리볼버 크기 축소 (모바일)

```css
/* @media (max-width: 768px) */

.cylinder-container {
    width: min(240px, 60vw);  /* 현재 min(280px, 70vw) → 축소 */
    height: min(240px, 60vw);
}
```

## 9. globals.css — m-row (라운드 카드) 크기 확대

```css
/* @media (max-width: 768px) */

.m-row {
    padding: 14px 10px;  /* 현재보다 약간 키움 */
}

.m-row span:first-child {
    font-size: 0.55rem;  /* R1, R2 등 라벨 */
}

.m-row span:last-child {
    font-size: 0.7rem;  /* 1.16x 등 배율 */
}

.multiplier-row {
    gap: 6px;  /* 카드 간격 살짝 넓힘 */
}
```

## 10. globals.css — 전체 여백 통일

```css
/* @media (max-width: 768px) */

.inline-betting {
    gap: 10px;  /* 현재 0.6rem → 10px로 통일 */
    margin-top: 8px;
}

.game-subtitle {
    margin-bottom: 6px;
}

.multiplier-table {
    margin-bottom: 6px;  /* 현재 8px → 6px */
}
```

## 11. globals.css — 네온 border 최소화

```css
/* @media (max-width: 768px) */

/* CTA 버튼만 강한 네온 유지 */
.trigger-btn-start {
    border: 2px solid var(--neon);
}

/* 나머지 요소는 subtle border */
.m-row:not(.active) {
    border: 1px solid rgba(0, 255, 65, 0.2);  /* 현재 2px → 1px, 투명도 낮춤 */
}

.inline-betting {
    /* 기존 네온 박스 border가 있다면 제거 또는 얇게 */
}
```

## 12. Header.tsx — 좌측 로고 텍스트

현재 헤더 좌측이 비어있음. "🎯" 또는 "DR" 텍스트 로고 추가.

```tsx
// Header.tsx 좌측에 추가
<span className="header-logo">🎯</span>
```

```css
.header-logo {
    font-size: 1.2rem;
    margin-right: auto;
}
```

---

## 수정 파일 목록
1. `frontend/components/BetPanel.tsx` — quickBets 값, CTA 텍스트, input 구조, fair-badge
2. `frontend/app/globals.css` — 위 CSS 전부
3. `frontend/components/Header.tsx` — 로고 추가
4. `frontend/components/GameBoard.tsx` — 하단 info-buttons 제거 (if there)

## 검증
- `npx tsc --noEmit` — 0 errors
- `pnpm build` — 0 errors
- 데스크톱 레이아웃 깨지지 않을 것 (모바일 미디어쿼리 안에서만 수정)
