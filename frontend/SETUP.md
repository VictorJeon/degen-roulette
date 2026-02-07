# Degen Roulette Frontend Setup Summary

## 완료된 작업

### 1. Next.js 프로젝트 초기화
- Next.js 16 with TypeScript
- Tailwind CSS
- App Router 사용

### 2. Dependencies 설치
```json
{
  "@solana/web3.js": "^1.x",
  "@solana/wallet-adapter-base": "^0.x",
  "@solana/wallet-adapter-react": "^0.x",
  "@solana/wallet-adapter-react-ui": "^0.x",
  "@solana/wallet-adapter-wallets": "^0.x",
  "@coral-xyz/anchor": "^0.x"
}
```

### 3. Tailwind 설정
- **커스텀 색상**: #a3e635 (accent), #0a0a0a (bg-primary), #ff3b3b (danger), #00ff88 (success)
- **폰트**: Press Start 2P (pixel), Space Grotesk (body)
- **커스텀 shadow**: pixel button effects

### 4. 글로벌 스타일 (CRT Effects)
- Scanline overlay (repeating-linear-gradient)
- Vignette effect (radial-gradient)
- Text glow effects
- Custom scrollbar

### 5. 컴포넌트 생성

#### WalletProvider.tsx
- Solana wallet adapter 통합
- Phantom wallet 지원
- Devnet 연결

#### Header.tsx
- 로고 + 타이틀
- Online count badge
- Wallet connect button

#### Leaderboard.tsx
- Top 5 degens 표시
- Rank, address (truncated), multiplier

#### GameArea.tsx
- 게임 상태 관리 (idle, betting, playing, won, lost)
- 6-chamber cylinder SVG
- Pull trigger / Cash out 로직
- Multiplier 계산 (1.2x per survival)

#### RecentPlays.tsx
- 최근 플레이 기록
- Win/Lose 상태 표시

### 6. Anchor 통합
- IDL 파일 복사 (degen_roulette_v2.json)
- Program ID: DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7
- Devnet RPC endpoint

### 7. Layout 구성
- 3-column grid (Leaderboard | Game | Recent Plays)
- 모바일 반응형 (< 1200px → single column)

### 8. 빌드 설정
- Webpack fallback (fs, net, tls)
- Turbopack 활성화
- TypeScript strict mode

## 디자인 충실도

✅ **색상**: index.html과 정확히 일치
✅ **폰트**: Press Start 2P, Space Grotesk
✅ **CRT 효과**: Scanline + Vignette
✅ **레이아웃**: 3-column grid
✅ **버튼 스타일**: Box-shadow offset animation
✅ **Text glow**: 네온 발광 효과
✅ **Cylinder SVG**: 6-chamber rotation

## 실행 방법

```bash
cd /Users/nova/degen-roulette/frontend

# 개발 서버
npm run dev
# → http://localhost:3000

# 프로덕션 빌드
npm run build
npm start
```

## 다음 단계 (선택적)

1. **Anchor 프로그램 실제 연동**
   - `lib/anchor.ts`에서 실제 트랜잭션 호출
   - `GameArea.tsx`에서 on-chain 상태 읽기

2. **Web Audio API**
   - 원본 index.html의 사운드 효과 추가
   - 총알 발사, 승리/패배 효과음

3. **파티클 효과**
   - Canvas API로 승리 시 파티클 애니메이션

4. **Leaderboard 실시간 데이터**
   - On-chain 데이터 fetching
   - WebSocket으로 실시간 업데이트

## 파일 경로

- **Frontend**: `/Users/nova/degen-roulette/frontend`
- **Anchor Program**: `/Users/nova/degen-roulette/anchor-v2`
- **원본 HTML**: `/Users/nova/.openclaw/workspace/degen-roulette/index.html`
