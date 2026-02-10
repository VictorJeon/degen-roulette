Refactor 6 component files to use correct Tailwind font utility classes. This is a mechanical find-and-replace, NOT a design task.

RULES (from specs/font-system-apply.md):
1. Replace font-display with font-pixel on: section headers, labels, badges, round labels, multipliers, status text
2. Keep font-display on: main title, CTA buttons, result amounts (big numbers)  
3. Replace font-display with font-body on: addresses, seeds, descriptive text, footer links
4. Font sizes: text-2xs(10px)→text-sm(14px), text-[0.625rem](10px)→text-sm(14px), text-[0.5rem](8px)→text-xs(12px)
5. Add font-bold to CTA buttons that use font-display
6. DO NOT modify game logic, hooks, state, sound, spin in GameBoard.tsx
7. Preserve ALL data-testid attributes

FILES: components/Header.tsx, components/StatsBar.tsx, components/GameBoard.tsx, components/Leaderboard.tsx, components/LiveFeed.tsx, components/ResultOverlay.tsx

VERIFY: pnpm build must pass

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
