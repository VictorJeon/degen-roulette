# Mobile Redesign v2

## 레퍼런스
코인플립 앱 (스크린샷 참조). 핵심: 요소 크기 균일, 여백 일정, compact한 bet input.

## 변경사항

### 1. 헤더
- 좌측에 작은 로고/아이콘 추가 (DEGEN ROULETTE 텍스트 or 총 아이콘)
- X 아이콘 + CONNECT 버튼 우측 유지
- 전체 높이 compact하게

### 2. 라운드 선택 (R1~R5)
- 카드 크기 키우기 — 현재 너무 작음
- 선택된 라운드: **배경색 채움** (filled) + border 강조. 미선택: border only
- 해머(총구) 화살표가 라운드 카드와 겹치지 않도록 위치 조정
  - 화살표를 리볼버 위에만 표시하거나, 라운드 카드와 간격 확보

### 3. 베팅 금액 입력
- **레퍼런스 스타일로 변경**: `[SOL] [0.01          ] [−] [+]`
  - 좌측: "SOL" 라벨 (배경 회색 박스)
  - 중앙: 금액 input
  - 우측: −/+ 버튼 (44px 이상, 터치 친화적)
- 전체 높이 줄이기 — 현재 너무 큼
- border 얇게 (1px), 현재 두꺼운 네온 border 제거

### 4. 프리셋 금액 버튼
- 값 변경: `0.001`, `0.01`, `0.05`, `0.10`, `0.25`, `0.50`
- 선택된 프리셋: **filled 배경** (레퍼런스처럼)
- 미선택: border only
- 크기 균일, 간격 균일

### 5. CTA 버튼
- 텍스트: `BET {amount} SOL` (예: "BET 0.01 SOL")
- "PLAY AGAIN" 제거
- 항상 현재 베팅 금액 반영

### 6. Provably Fair 중복 제거
- 인라인 "✅ PROVABLY FAIR" 텍스트 유지
- 하단 "Provably Fair" 버튼 제거 (How to Play 버튼만 남기거나, 둘 다 제거하고 인라인에 클릭 가능하게)

### 7. 리볼버 크기
- 현재 대비 ~15% 축소
- 빈 공간을 줄여서 베팅 영역이 스크롤 없이 보이도록

### 8. Potential Payout/Loss
- 폰트 크기 키우기 (현재 12px? → 16px)
- Payout은 초록색, Loss는 빨간색으로 색상 강조
- CTA 버튼 바로 위에 위치

### 9. 전체 조화
- 네온 그린 border를 최소화. 핵심 요소(CTA, 선택된 라운드)에만 사용
- 나머지 border는 subtle한 회색 or 반투명 그린
- 요소 간 여백 통일 (12px or 16px)
- 레퍼런스처럼 "자연스러운 위계": 비주얼(리볼버) → 선택(라운드) → 금액 → 액션

## 수정 파일
- `frontend/components/BetPanel.tsx` — 입력, 프리셋, CTA
- `frontend/components/GameBoard.tsx` — 라운드 선택, 리볼버 크기
- `frontend/components/Header.tsx` — 로고 추가
- `frontend/components/StatsBar.tsx` — 라운드 카드 스타일
- `frontend/app/globals.css` — 반응형 스타일
- `frontend/lib/constants.ts` — 프리셋 금액 값

## 규칙
- 데스크톱 레이아웃 깨뜨리지 말 것
- 모바일 breakpoint: 768px 이하
- 44px 최소 터치 타겟 유지
- iOS input zoom 방지 (font-size: 16px)
- TSC + Build 통과 필수
