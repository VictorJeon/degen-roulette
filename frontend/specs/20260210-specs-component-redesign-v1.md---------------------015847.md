specs/component-redesign-v1.md 스펙대로 구현.

핵심 토큰: bg-primary=#080C08, bg-surface=#0E130E, bg-elevated=#151A15, accent=#00FF41, accent-muted=#00CC34, white=#F0F0F0, gray-100=#B0B0B0, gray-200=#707070, gray-300=#404040, gray-400=#252525, border-default=#252525, danger=#FF3B3B.

컴포넌트별 수치:
- header: height 56px, border-bottom 1px solid #252525
- panel: bg #0E130E, border 1px solid #252525, border-radius 12px, padding 20px
- CTA btn: border 2px solid #00FF41, box-shadow 0 0 20px rgba(0,255,65,0.15)
- stat-card: bg #0E130E, border 1px solid #252525, border-radius 8px, padding 12px
- font-display for 수치/금액, font-body(Space Grotesk) for 나머지
- text sizes: 2xs=0.625rem, xs=0.75rem, sm=0.875rem, base=1rem, lg=1.25rem, xl=1.5rem, 2xl=2rem

globals.css 2233줄→300줄 목표. vignette/grid/corner-decorations/네온글로우 제거. style jsx→Tailwind 유틸리티.

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
