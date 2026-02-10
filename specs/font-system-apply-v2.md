# Font System Application v2 — All 6 Components

## Goal
Replace all `font-display` classes in 6 components with role-specific font classes based on the 3-font system. Also enforce minimum font sizes.

## 3-Font System
- **font-display** (Chakra Petch): ONLY for CTA buttons and major impact text (PULL TRIGGER, CASH OUT, PLAY AGAIN, YOU LIVE, YOU DIED, main h1 title)
- **font-pixel** (Silkscreen): Round labels, multiplier values, section headers, status badges, settings buttons, small labels (BET, MULTIPLIER, POTENTIAL, DEATH, SETTLING, HOW TO PLAY, PROVABLY FAIR, HALL OF DEGENS, LIVE FEED, SAFE, BANG)
- **font-body** (Space Mono): Body text, explanatory paragraphs, numerical values (amounts, odds), empty state messages
- **font-mono** (Space Mono): Wallet addresses, hash values, transaction data

## Minimum Font Sizes
Desktop (default): `text-sm` (14px) minimum — replace any `text-2xs`, `text-[0.625rem]`, `text-[0.5rem]`, `text-[0.45rem]`, `text-[0.42rem]`
Mobile (max-md:/max-sm:): `text-xs` (12px) minimum — replace any mobile-specific sizes below 12px

Use breakpoint prefixes for responsive: `text-sm max-md:text-xs` NOT fluid clamp().

## Files to Modify
1. `frontend/components/Header.tsx`
2. `frontend/components/StatsBar.tsx`
3. `frontend/components/GameBoard.tsx`
4. `frontend/components/Leaderboard.tsx`
5. `frontend/components/LiveFeed.tsx`
6. `frontend/components/ResultOverlay.tsx`

## Mapping Rules Per Component

### Header.tsx
- "Total Plays:" label → font-pixel
- Play count number → font-body
- Result banner text → font-pixel
- Social icon buttons → font-pixel

### StatsBar.tsx
- Labels (BET, MULTIPLIER, POTENTIAL, DEATH) → font-pixel
- SOL unit text → font-pixel
- Numeric values (bet amount, multiplier value, potential payout) → font-body
- DEATH CHANCE multiplier → font-pixel

### GameBoard.tsx
- Main h1 title (DEGEN ROULETTE) → font-display (keep)
- Subtitle (tagline) → font-body
- Action hints text → font-pixel
- Round labels (R1-R5) in multiplier table → font-pixel
- Multiplier values (1.16x, 1.33x, etc.) → font-pixel
- Survival odds (5/6, 3/4, etc.) → font-body
- Instruction text below cylinder → font-pixel
- PULL TRIGGER button → font-display font-bold (keep as CTA)
- CASH OUT button → font-display (keep as CTA)
- Settings buttons (sound, provably fair) → font-pixel
- SETTLING text → font-pixel
- Modal headers (HOW TO PLAY, PROVABLY FAIR) → font-pixel
- Modal body text → font-body
- Modal close buttons → font-pixel

### Leaderboard.tsx
- "HALL OF DEGENS" header → font-pixel
- Tab labels → font-pixel
- "RANK" column header → font-pixel
- Wallet addresses → font-mono
- Win/loss amounts → font-body
- Empty state text → font-body

### LiveFeed.tsx
- "LIVE FEED" header → font-pixel
- "GLOBAL" tab → font-pixel
- Player addresses → font-mono
- Game info (round number, bet amount) → font-body
- Status badges (SAFE/BANG) → font-pixel
- Win/loss amounts → font-body
- Empty state text → font-body

### ResultOverlay.tsx
- "YOU LIVE." / "YOU DIED." → font-display font-bold (keep as impact text)
- Labels (PAYOUT, PROFIT, MULTIPLIER, ROUNDS, DIED AT, LOST) → font-pixel
- Values (amounts, numbers) → font-body
- "PLAY AGAIN" button → font-display font-bold (keep as CTA)
- "Provably Fair" verification button → font-pixel

## Constraints
- DO NOT modify any game logic, hooks (useGame), sound effects, or spin mechanics in GameBoard.tsx
- Preserve ALL `data-testid` attributes (there are 8 across components)
- Only change className strings — no structural changes
- Build must pass: `pnpm build`

## Verification
After all changes:
1. `pnpm build` must succeed
2. `grep -c "data-testid" frontend/components/*.tsx` must show same counts as before
3. No `text-2xs` or `text-[0.625rem]` or `text-[0.5rem]` remaining (except in max-sm: if ≥12px)
