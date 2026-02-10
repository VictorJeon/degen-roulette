# Fixing Accessibility — Degen Roulette

## Goal
Add ARIA labels, keyboard navigation, focus styles, and aria-live regions to all interactive components.

## Constraints
- **DO NOT modify game logic** (useGame, sound, spin) — only add accessibility attributes
- **Preserve all `data-testid` attributes** exactly as they are
- **Do not change visual appearance** — only add focus rings and sr-only text
- **Keep existing aria-labels** — only add missing ones

## 1. Global Focus Styles — `app/globals.css`

Add at the end of the file (before any closing braces):

```css
/* Accessibility: focus-visible rings */
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Screen reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## 2. Header.tsx

Already has aria-labels on close button and X link. Add:
- `role="banner"` on the outer `<header>` element (if it's a div, change to `<header>` or add role)
- `aria-label="Game header"` on the header container

## 3. StatsBar.tsx

- Add `role="region"` and `aria-label="Game statistics"` on the outer `<div>`
- Each stat cell: add `aria-label` combining label + value, e.g. `aria-label={`Bet: ${betAmount.toFixed(3)} SOL`}`

## 4. GameBoard.tsx

### Modals
- HowToPlayModal: add `role="dialog"` and `aria-modal="true"` and `aria-label="How to play"` on the overlay div
- FairModal: add `role="dialog"` and `aria-modal="true"` and `aria-label="Provably fair verification"` on the overlay div
- Both modal Close buttons already have text "Close" which is accessible

### Multiplier Table
- Table container: add `role="group"` and `aria-label="Round multipliers"`
- Each round cell: add `aria-label={`Round ${round}: ${multiplier}x`}`

### Cylinder
- The cylinder image already has `alt="Revolver cylinder"`
- Add `aria-label="Revolver cylinder - click chamber to spin"` on clickable chamber elements if any

### Action Buttons
- PULL TRIGGER button: add `aria-label="Pull trigger - risk current round"`
- CASH OUT button: add `aria-label={`Cash out ${amount} SOL`}` (use the displayed amount)
- How to Play link: add `aria-label="How to play"`
- Provably Fair link: add `aria-label="Provably fair verification"`

### Game State Announcements
- Add an `aria-live="polite"` region that announces game state changes
- After the `actionHint` display element, wrap it with `aria-live="polite"` so screen readers announce "YOU LIVE · R2", "BANG", etc.

## 5. BetPanel.tsx

- Minus button (`-`): add `aria-label="Decrease bet amount"`
- Plus button (`+`): add `aria-label="Increase bet amount"`
- Each quick bet chip (0.001, 0.01, etc.): add `aria-label={`Set bet to ${amount} SOL`}`
- The bet input already has `aria-label="Bet amount in SOL"` ✓
- CONNECT WALLET / START GAME button: add `aria-label` matching the displayed text
- Error message paragraph: add `role="alert"` so screen readers announce errors

## 6. Leaderboard.tsx

- Outer container: add `role="region"` and `aria-label="Leaderboard"`
- "HALL OF DEGENS" section: add `aria-label="Top players"` on the card
- Each leaderboard entry: add `aria-label={`Player ${shortAddress}: ${profit} SOL`}`
- RANK section: add `aria-label="Player rankings"`

## 7. LiveFeed.tsx

- Outer container: add `role="log"` and `aria-label="Live game feed"` and `aria-live="polite"`
- Each feed item: add `aria-label` combining player, result, and amount

## 8. ResultOverlay.tsx

- Read the file first to understand structure
- Overlay container: add `role="dialog"` and `aria-modal="true"` and `aria-label="Game result"`
- Result text: wrap in `aria-live="assertive"` so it's announced immediately
- PLAY AGAIN button: add `aria-label="Play again"`
- Provably Fair button: add `aria-label="View provably fair proof"`

## Verification

After all changes:
1. Run `npx tsc --noEmit` — must pass with no errors
2. Run `grep -c 'aria-\|role=' components/*.tsx` — should show significant increase from current 4
3. Run `grep 'data-testid' components/*.tsx | wc -l` — must equal 8 (unchanged)
4. Check that `sr-only` class is defined in globals.css

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
