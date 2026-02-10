# Font System Apply — All Components

## Context
BetPanel is already done. Apply the same 3-font system + padding fixes to the remaining 6 components.

## 3-Font System Rules

### font-display (Chakra Petch) — Impact, big text
- Main title "DEGEN ROULETTE"
- CTA buttons ("PULL TRIGGER", "PLAY AGAIN", "BET X SOL")
- Result amounts in ResultOverlay (the big win/loss number)
- Always add `font-bold` on buttons

### font-pixel (Silkscreen) — Retro identity, labels
- Section headers: "LIVE FEED", "HALL OF DEGENS", "GLOBAL"
- Round labels: "R1", "R2", etc.
- Multiplier values: "1.16x", "2.91x"
- Small labels: "BET", "MULTIPLIER", "DEATH", "PAYOUT", "PROFIT", "ROUNDS"
- Status text: "SETTLING...", "CONNECT WALLET"
- "SELECT WALLET" button
- Survival odds like "5/6", "3/4"

### font-body (Space Mono) — Readable body text
- Addresses, game IDs, seed hashes (also font-mono, same font)
- Descriptive text: "1 BULLET. 6 CHAMBERS."
- Footer links: "How to Play", "Provably Fair"
- Numbers in tables/lists
- "Waiting for blood...", "No degens yet."

## Font Size Rules
- **Desktop minimum: 14px (text-sm)**. No text-2xs (10px), text-3xs (8px), or text-[0.5rem] on desktop.
- Replace `text-2xs` → `text-sm` (or `text-xs` minimum)
- Replace `text-[0.625rem]` → `text-sm`
- Replace `text-[0.5rem]` → `text-xs`
- Mobile can go 1 step smaller via `max-md:text-xs` etc.
- Keep existing responsive prefixes (max-md:, max-sm:, max-[360px]:) but bump them up proportionally.

## Padding Rules
- Tighten padding: text should fill the box, not swim in whitespace
- No h-11+ for small labels/buttons (h-8 or h-9 max)
- CTA buttons can be h-12 desktop, h-14 mobile

## Component-Specific Notes

### Header.tsx
- "Total Plays: 12,847" → font-pixel for "Total Plays:", font-body for number
- "SELECT WALLET" button → font-pixel
- Result text → font-pixel

### StatsBar.tsx
- Labels (BET, MULTIPLIER, POTENTIAL, DEATH) → font-pixel
- Values → font-body
- "SOL" unit → font-pixel

### GameBoard.tsx
- ⚠️ DO NOT modify any game logic, hooks, state, sound, spin mechanics
- ⚠️ Preserve ALL data-testid attributes
- Title "DEGEN ROULETTE" → font-display
- Subtitle → font-body
- Round selector boxes (R1-R5) → font-pixel for label, font-pixel for multiplier value
- Survival odds (5/6, 3/4) → font-body
- "PULL TRIGGER" / "NEXT ROUND" → font-display font-bold
- "CASH OUT" → font-display
- Modal headers → font-pixel
- Modal body/seeds → font-mono (same as font-body)
- Settings buttons → font-pixel

### Leaderboard.tsx
- Section headers "HALL OF DEGENS" → font-pixel
- Addresses → font-mono
- Win amounts → font-body, colored text stays

### LiveFeed.tsx
- "LIVE FEED" / "GLOBAL" → font-pixel
- Player addresses → font-mono
- Win/loss amounts → font-body
- Status badges (WIN/LOSS) → font-pixel
- Timestamps → font-body

### ResultOverlay.tsx
- Big result text ("YOU SURVIVED!" / "YOU DIED!") → font-display font-bold
- Labels (PAYOUT, PROFIT, MULTIPLIER, ROUNDS, DIED AT, LOST) → font-pixel
- Values (+0.019 SOL, 1.94x, etc.) → font-body
- "PLAY AGAIN" button → font-display font-bold
- "View on Solscan" button → font-pixel

## Constraints
- Preserve ALL existing data-testid attributes (8 total across codebase)
- Do NOT modify useGame hook, sound logic, spin animation, or any game state
- Do NOT modify API routes or lib/ files
- Sharp corners only (no rounded on new elements, keep existing rounded where wallet adapter needs it)
- Build must pass: `pnpm build`

## Files to modify
1. components/Header.tsx
2. components/StatsBar.tsx
3. components/GameBoard.tsx
4. components/Leaderboard.tsx
5. components/LiveFeed.tsx
6. components/ResultOverlay.tsx
