# Degen Roulette — Design Specification

> Nova(Opus)가 작성. Claude Code는 이 스펙대로 구현만.

---

## 디자인 시스템

### 색상 (CSS Variables)
```css
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-tertiary: #1a1a1a;
--accent: #a3e635;           /* 라임 그린 */
--accent-dim: #65a30d;
--accent-glow: rgba(163, 230, 53, 0.4);
--text-primary: #ffffff;
--text-secondary: #a1a1aa;
--text-muted: #52525b;
--danger: #ff3b3b;
--success: #00ff88;
--border: #333333;
```

### 폰트
- **픽셀 폰트**: 'Press Start 2P' — 로고, 타이틀, 숫자
- **본문**: 'Space Grotesk' — 일반 텍스트

### 효과
- **CRT 스캔라인**: body::before에 repeating-linear-gradient
- **비네트**: body::after에 radial-gradient
- **글로우**: text-shadow, box-shadow with accent-glow

---

## 컴포넌트 구조

```
app/
├── layout.tsx          # 폰트 로드, 글로벌 스타일
├── page.tsx            # 메인 페이지
├── globals.css         # CSS 변수, CRT 효과
components/
├── Header.tsx          # 로고 + 지갑 연결
├── GameBoard.tsx       # 룰렛 휠 + 결과 표시
├── BetPanel.tsx        # 베팅 금액 + 색상 선택 + 베팅 버튼
├── RecentPlays.tsx     # 최근 플레이 목록
├── Leaderboard.tsx     # 리더보드
├── WalletProvider.tsx  # Solana 지갑 컨텍스트
hooks/
├── useProgram.ts       # Anchor 프로그램 인스턴스
├── useBet.ts           # 베팅 로직 (placeBet, claim)
├── useGameState.ts     # 게임 상태 구독
lib/
├── anchor.ts           # Anchor 클라이언트 설정
├── constants.ts        # Program ID, RPC 등
├── idl.ts              # IDL 타입
```

---

## 핵심 기능 흐름

### 1. 지갑 연결
- Phantom, Solflare 지원
- 연결 시 잔액 표시 (SOL)

### 2. 베팅
- 금액 입력 (0.01 ~ 1 SOL)
- 색상 선택 (Red/Black/Green)
- "PLACE BET" 버튼 → TX 서명 → 전송

### 3. 결과
- TX 확인 후 결과 표시
- 승리: 잔액 증가 애니메이션
- 패배: 패배 표시

### 4. 리더보드
- 상위 플레이어 표시 (온체인 데이터)

---

## Anchor 연동

### Program ID
```
DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7
```

### 주요 Instructions
- `initialize_game` — 게임 초기화 (관리자)
- `place_bet` — 베팅 실행
- `resolve_bet` — 결과 결정 (VRF 또는 슬롯 해시)

### Accounts
- `GameState` — 게임 전역 상태
- `PlayerBet` — 플레이어별 베팅 정보

---

## 검증 체크리스트

- [ ] 지갑 연결 동작
- [ ] 잔액 표시 정확
- [ ] 베팅 TX 서명 및 전송
- [ ] TX 확인 후 결과 표시
- [ ] 잔액 업데이트
- [ ] CRT 효과 렌더링
- [ ] 모바일 반응형

---

_이 스펙을 기반으로 Claude Code가 구현한다._
