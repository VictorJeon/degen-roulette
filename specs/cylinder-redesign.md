# Spec: 실린더 리디자인 (네온 사이버펑크)

## 레퍼런스
- 이미지: `/Users/nova/.openclaw/media/inbound/file_28---24a96da2-9ef8-4b19-b7d4-e5d933f058e8.jpg`
- 현재 실린더: `GameBoard.tsx` 라인 271~367의 SVG

## 목표
현재 메탈릭 그레이 실린더를 레퍼런스의 네온 그린 사이버펑크 스타일로 교체.

## 변경 대상
- `frontend/components/GameBoard.tsx` 내 실린더 SVG (라인 271~367)
- 관련 CSS (같은 파일 내 `<style>` 태그)

## 디자인 사양

### 1. 실린더 외형
- **배경 프레임**: 둥근 사각형 (rounded-rect, border-radius ~20%), 네온 그린(#BFFF00) 글로우 테두리
  - `filter: drop-shadow(0 0 15px #BFFF00) drop-shadow(0 0 30px rgba(191,255,0,0.3))`
  - 테두리 두께: 3-4px
- **실린더 본체**: 현재 원형 유지, 하지만 엣지에 톱니 디테일 추가 (상단/하단에 노치)
  - 외곽선: #BFFF00 글로우 (현재 #3a3a3a → #BFFF00로 변경)
  - 본체 fill: 어두운 그린 그라데이션 (`#0a1a0a` → `#1a2a1a`)
  - 메탈릭 텍스처 느낌을 유지하되, 컬러를 그린 톤으로

### 2. 챔버 (구멍 6개)
- **기존**: radialGradient `chamberHole` (#111 → #000)
- **변경**: 더 깊은 홀 느낌
  - 외곽 링: #2a3a2a 스트로크 (기존 #3a3a3a)
  - 내부: 더 깊은 검정 (#050505)
  - 미세한 inner shadow 효과: `filter: drop-shadow(inset 0 2px 4px rgba(0,0,0,0.8))`
  - 선택된 챔버: #BFFF00 글로우 링 (기존 로직 유지)

### 3. 중앙 허브
- 기존: #1a1a1a + #555 스트로크
- 변경: 다크 그린 + #BFFF00 십자 아이콘 (레퍼런스의 ⊕ 형태)
  - 중앙 원: fill #0a1a0a, stroke #BFFF00
  - 십자선: #BFFF00, strokeWidth 1.5

### 4. 포인터 (상단 화살표)
- 기존: 네온 그린 삼각형 (이미 맞음)
- 유지하되, 글로우 강화: `filter: drop-shadow(0 0 8px #BFFF00)`

### 5. 글로우/파티클 효과
- 실린더 전체에 미세한 그린 파티클/노이즈 오버레이 (CSS only)
- `box-shadow: 0 0 60px rgba(191,255,0,0.15)` 배경 글로우

### 6. 애니메이션 유지
- spinning 시 blur 효과 유지
- 챔버 선택 시 하이라이트 로직 유지
- 회전 로직/각도 계산 변경 없음

## 제약 조건
- **SVG viewBox 크기 유지** (300x300)
- **챔버 위치/각도 계산 로직 변경 금지** — `chamberPositions`, `handleSelectChamber`, `cylinderRotation` 등
- **기능 로직 변경 금지** — 순수 비주얼만
- TypeScript 에러 없어야 함
- CSS-in-JS 아닌 현재 방식(styled jsx) 유지

## 검증
```bash
cd /Users/nova/projects/degen-roulette/frontend
npx tsc --noEmit
npm run build
```

## 질문 있으면
Nova한테 물어봐. 레퍼런스 이미지 참고하되, 정확히 복제가 아닌 "영감을 받은" 리디자인이야.
