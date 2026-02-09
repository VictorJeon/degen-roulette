# Mobile Optimization — Degen Roulette

## 목표
모바일 (320px~430px) 에서 완벽하게 플레이 가능한 UI. 터치 친화적, 한 화면에 핵심 요소 모두 보이게.

## 현재 문제
- `grid-template-columns: 220px 1fr 300px` → 모바일에서 사이드바만 숨기고 게임 영역 미최적화
- 768px 미디어쿼리에서 sidebar 숨김 + revolver 240px 고정뿐
- BetPanel, StatsBar, Header 모바일 미대응
- 터치 타겟 크기 미확보 (최소 44px 필요)
- 텍스트 오버플로우 처리 없음

## 레이아웃 구조
```
현재 (desktop): [sidebar 220px] [game-area 1fr] [sidebar 300px]
모바일 목표:     [game-area 100%] — 풀폭 단일 컬럼
```

## 파일 목록
- `app/globals.css` — 메인 스타일 (미디어쿼리 추가/수정)
- `components/Header.tsx` — 모바일 헤더 최적화
- `components/BetPanel.tsx` — 베팅 패널 모바일 레이아웃
- `components/StatsBar.tsx` — 통계 바 모바일
- `components/GameBoard.tsx` — 실린더/게임보드 모바일
- `components/ResultOverlay.tsx` — 결과 오버레이 모바일
- `components/Leaderboard.tsx` — 리더보드 (모바일에서 컴팩트)
- `components/LiveFeed.tsx` — 라이브피드 (모바일에서 컴팩트)

## 브레이크포인트
```css
/* 이미 존재 */
@media (max-width: 1200px) { /* 태블릿 — 단일 컬럼 */ }
@media (max-width: 768px) { /* 모바일 기본 */ }

/* 추가 필요 */
@media (max-width: 480px) { /* 소형 모바일 */ }
```

## 구체적 수정사항

### 1. globals.css — @media (max-width: 768px)

```css
@media (max-width: 768px) {
    /* 기존 유지 + 추가 */
    
    .main {
        grid-template-columns: 1fr;
        padding: 0.5rem;
        gap: 0.5rem;
        min-height: auto;
    }
    
    .sidebar {
        display: none;  /* 기존 유지 */
    }
    
    /* Header: 로고 작게, 지갑 버튼 우측 */
    .header {
        padding: 0.5rem;
        height: auto;
        min-height: 48px;
    }
    
    .game-title {
        font-size: 1rem;
    }
    
    /* Revolver: 화면 너비 기준 반응형 */
    .revolver-frame {
        width: min(280px, 70vw);
        height: min(280px, 70vw);
    }
    
    /* Chamber buttons: 터치 친화적 */
    .chamber-overlay {
        min-width: 44px;
        min-height: 44px;
    }
    
    /* BetPanel: 가로 배치 → 세로 스택 */
    .bet-panel {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .bet-input {
        width: 100%;
        font-size: 16px;  /* iOS 줌 방지 */
        height: 48px;
    }
    
    /* Action buttons: 풀폭, 큰 터치 타겟 */
    .action-button,
    .start-button,
    .pull-button,
    .cashout-button {
        width: 100%;
        min-height: 48px;
        font-size: 0.8rem;
    }
    
    /* Stats: 컴팩트 가로 배치 */
    .stats-bar {
        flex-wrap: wrap;
        gap: 0.3rem;
        font-size: 0.6rem;
    }
    
    .stats-badge {
        display: flex;  /* 다시 표시하되 작게 */
        font-size: 0.5rem;
        padding: 0.2rem 0.4rem;
    }
    
    /* Result overlay: 모바일 전체 화면 */
    .result-overlay {
        padding: 1rem;
    }
    
    .game-result-title {
        font-size: 1.5rem;
    }
    
    /* Modal: 풀폭 */
    .modal-card {
        width: calc(100vw - 2rem);
        max-width: none;
        margin: 1rem;
    }
    
    /* Game instruction text */
    .game-instruction {
        font-size: 0.7rem;
        padding: 0.5rem;
    }
    
    /* Sub-actions row */
    .sub-actions {
        flex-wrap: wrap;
        gap: 0.3rem;
    }
    
    .mini-btn {
        min-height: 36px;
        padding: 0.3rem 0.6rem;
    }
    
    /* Wallet button: 축약 표시 */
    .wallet-adapter-button {
        font-size: 0.45rem !important;
        padding: 0 0.5rem !important;
        max-width: 140px;
    }
}

@media (max-width: 480px) {
    .revolver-frame {
        width: min(240px, 65vw);
        height: min(240px, 65vw);
    }
    
    .game-title {
        font-size: 0.85rem;
    }
    
    .bet-input {
        font-size: 16px;  /* iOS 줌 방지 필수 유지 */
    }
    
    .panel {
        padding: 10px;
        border-radius: 4px;
    }
}
```

### 2. 컴포넌트 수정

#### Header.tsx
- 모바일에서 로고 텍스트 축약 ("DEGEN ROULETTE" → "DR" 또는 아이콘만)
- 지갑 버튼 잘림 방지: overflow-hidden + text-ellipsis

#### BetPanel.tsx
- 모바일 input font-size 16px (iOS auto-zoom 방지)
- 배팅 금액 프리셋 버튼 (0.01, 0.05, 0.1) 가로 배치

#### GameBoard.tsx  
- cylinder 크기 viewport 기준 반응형 (vw 단위)
- chamber 클릭 영역 확대 (44px 최소)

#### ResultOverlay.tsx
- 풀스크린 모달 스타일
- 큰 텍스트 + 명확한 CTA 버튼

### 3. 메타 태그 확인
`app/layout.tsx`에 viewport meta 있는지 확인:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
```

## 검증
```bash
# 타입체크
pnpm exec tsc --noEmit

# 빌드 확인  
pnpm build

# Playwright (기존 13개 깨지면 안 됨)
pnpm exec playwright test tests/e2e/ --reporter=list
```

## 제약
- 기존 데스크탑 레이아웃 깨뜨리지 말 것
- 기존 E2E 테스트 13/13 유지
- CSS 변수 (--neon, --bg-primary 등) 기존 것 사용
- 픽셀 폰트 (Press Start 2P) 유지 — 크기만 조정
- `user-scalable=no`로 핀치 줌 방지 (게임 UX)
