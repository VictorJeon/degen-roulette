# Degen Roulette - Next.js Frontend

솔라나 기반 러시안 룰렛 스타일 베팅 게임의 Next.js 프론트엔드입니다.

## 기능

### 게임 UX 플로우

**Phase 1: Betting**
- 인라인 베팅 입력 + 퀵 베팅 버튼 (0.1, 0.5, 1, 5, 10 SOL)
- START 버튼으로 게임 시작
- 안내: ">>> SELECT YOUR BET <<<"

**Phase 2: Chamber Selection**
- 베팅 UI 숨김
- 큰 텍스트로 안내: "PICK YOUR DOOM" (pulsing 애니메이션)
- 6개 챔버 클릭 가능
- 챔버 클릭 시: 총알 표시 + 로딩 애니메이션 + 사운드

**Phase 3: Spinning**
- "SPIN IT" 버튼 표시
- 안내: ">>> MIX IT UP <<<"
- 클릭 시: 실린더 회전, 총알 숨김, "● LOADED" 팝업

**Phase 4: Playing**
- "SHOT" 버튼 표시 (라운드 2 이후 빨간색/위험 상태)
- 트리거 당기기: 챔버 하이라이트, 사운드, 생존/사망 체크
- 생존 시: 배당률 팝업, CASH OUT 버튼 활성화
- 사망 시: 화면 흔들림, 파티클 폭발, 사망 오버레이

### 주요 기능

1. **사운드 엔진** (Web Audio API)
   - 실린더 회전 사운드
   - 트리거 딸깍 소리
   - 빈 챔버 소리
   - 총알 장전 소리
   - 총성

2. **화면 효과**
   - 사망 시 화면 흔들림
   - 파티클 캔버스 (사망 효과)
   - 플래시 오버레이 (성공 녹색, 사망 빨간색)
   - 결과 오버레이 (사망/승리 통계 표시)

3. **UI 요소**
   - 배당률 팝업 (생존 시)
   - 리더보드 (localStorage 기반)
   - 최근 플레이 피드 (페이크 데이터)

### 디자인

- **색상**: #a3e635 (accent), #0a0a0a (bg)
- **폰트**: Press Start 2P (픽셀), Space Grotesk (본문)
- **효과**: CRT 스캔라인 + 비네트
- **버튼**: 그림자 오프셋 애니메이션
- **실린더**: SVG, 6개 챔버 정확한 위치
- **해머**: 상단 중앙에 이모지

## 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 빌드

```bash
npm run build
npm start
```

## 기술 스택

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Solana Web3.js
- Wallet Adapter (Phantom)
- Web Audio API

## 주의사항

- 현재 스마트 컨트랙트 연동은 mock 상태
- Phantom 지갑 연결 기능만 실제 작동
- 실제 SOL 트랜잭션 없음 (데모 단계)
