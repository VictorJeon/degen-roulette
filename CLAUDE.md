# CLAUDE.md

## WHAT
- Solana 룰렛 게임 (Anchor v2 + Next.js 15 + Tailwind)
- Program ID: `DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7`
- Devnet 배포됨

## WHY
- 프론트엔드 완전 리팩토링 필요
- 디자인 레퍼런스: `design-reference/DEGEN ROULETTE.html`
- CRT 스캔라인, 레트로 픽셀 폰트, 다크 테마 + 라임 액센트

## HOW
```bash
# Anchor
anchor build
anchor test

# Frontend
cd frontend
npm install
npm run dev
```

## 구조
```
├── anchor-v2/          # Anchor 프로그램
├── frontend/           # Next.js 앱
└── design-reference/   # 디자인 레퍼런스 HTML
```

## 규칙
- 디자인 판단 → Nova(Opus)한테 물어보기
- 작업 전환 시 `/clear`
- 컨텍스트 60% 넘으면 `/compact`
- 2회 실패 시 `/clear` 후 재시작
