Execute the component redesign following specs/exec-redesign-v1.md (5 phases).

CONCRETE VALUES — apply these exactly:
- Background: bg-primary=#080C08, bg-surface=#0E130E, bg-elevated=#151A15
- Accent: #00FF41, accent-muted=#00CC34
- Text: white=#F0F0F0, gray-100=#B0B0B0, gray-200=#707070
- Border: #252525 (1px solid everywhere)
- Danger: #FF3B3B
- CTA glow: shadow-[0_0_20px_rgba(0,255,65,0.15)] border-2 border-[#00FF41]
- Card pattern: bg-[#0E130E] border border-[#252525] rounded-xl p-5
- Stat card: bg-[#0E130E] border border-[#252525] rounded-lg p-3
- Header: h-14 border-b border-[#252525] bg-[#0E130E]
- Font sizes: 2xs=0.625rem xs=0.75rem sm=0.875rem base=1rem lg=1.25rem xl=1.5rem 2xl=2rem
- Radius: sm=6px md=10px lg=14px xl=20px
- Modal backdrop: fixed inset-0 bg-black/88 z-[1400]
- Modal card: bg-[#151A15] border border-[#252525] rounded-xl p-6
- Layout grid: grid-cols-[220px_1fr_300px] with max-lg:hidden sidebars

Phase 1: Rewrite globals.css from 2233 to ~280 lines (delete all glow keyframes, grid overlays, scanlines, vignette, :root block, all component classes, all @media blocks).
Phase 2: Convert Header/StatsBar/LiveFeed/Leaderboard — remove all style jsx, use Tailwind utilities.
Phase 3: Convert BetPanel/ResultOverlay — remove style jsx, delete corner divs and btn-glow spans.
Phase 4: Convert GameBoard.tsx — remove ~690 lines style jsx, delete CornerDecor component and sparkles divs. DO NOT touch useGame/sound/spin logic.
Phase 5: Update page.tsx layout, delete vignette div. Add JetBrains_Mono to layout.tsx.

After all phases: cd frontend && npm run build && npx tsc --noEmit && grep -r data-testid components/ | wc -l (must be >= 8).
Commit: 'feat: component redesign v1 - clean dark gambling UI'

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
