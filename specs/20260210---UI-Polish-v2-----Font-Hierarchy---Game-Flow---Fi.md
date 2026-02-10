# UI Polish v2 — Font Hierarchy + Game Flow + Fixes

## 1. Font Hierarchy Rework

### Tier 1: Silkscreen (font-pixel) — Brand Identity ONLY
Very few elements. Pixel font = game identity.
- `DEGEN ROULETTE` h1 title (GameBoard.tsx)
- `YOU LIVE.` / `YOU DIED.` h2 result text (ResultOverlay.tsx)
- That's it. Nothing else.

### Tier 2: Chakra Petch (font-display) — CTAs + Section Headers
Action-oriented and structural.
- CTA buttons: `BET X SOL`, `PULL TRIGGER`, `CASH OUT`, `PLAY AGAIN` (already correct)
- Round labels: `R1`, `R2`, `R3`, `R4`, `R5` (GameBoard.tsx multiplier table)
- Section headers: `HALL OF DEGENS` (Leaderboard.tsx), `LIVE FEED`, `GLOBAL` (LiveFeed.tsx), `RANK` (Leaderboard.tsx)
- Modal headers: `HOW TO PLAY`, `PROVABLY FAIR` (GameBoard.tsx modals)
- StatsBar labels: `BET`, `MULTIPLIER`, `POTENTIAL WIN`, `DEATH %`

### Tier 3: Space Mono (font-body) — Everything Else
Readable, functional text.
- Multiplier values: `1.16x`, `1.95x`, etc.
- All numeric values (bet amounts, profits, payouts)
- Body text, descriptions, instructions
- Tagline: `1 BULLET. 6 CHAMBERS. HOW DEGEN ARE YOU?`
- Action hints (`CHAMBER X LOADED`, `LOCKED & LOADED`, etc.)
- All addresses, hashes (also font-mono which = Space Mono)
- Result overlay stat labels: `PAYOUT`, `PROFIT`, `MULTIPLIER`, `ROUNDS`, `DIED AT`, `LOST`
- Result overlay stat values
- Leaderboard entries, LiveFeed entries
- Modal body text
- Quick bet chip labels (0.001, 0.01, etc.)
- Empty state text ("No degens yet.", "Waiting for blood...")
- Header "TOTAL PLAYS:" label + count
- Sub-action button text ("How to Play", "Provably Fair")
- Instruction text (`>>> LOAD THE BULLET <<<`, etc.)
- `SETTLING...` text

### Summary of what CHANGES from current:
Current → New:
- Title "DEGEN ROULETTE": font-display → font-pixel ⭐
- "YOU LIVE."/"YOU DIED.": font-display → font-pixel ⭐
- R1-R5 labels: font-pixel → font-display ⭐
- HALL OF DEGENS/LIVE FEED/GLOBAL/RANK headers: font-pixel → font-display ⭐
- HOW TO PLAY/PROVABLY FAIR modal headers: font-pixel → font-display ⭐
- StatsBar labels: font-pixel → font-display ⭐
- Multiplier values (1.16x etc): font-pixel → font-body ⭐
- Action hints: font-pixel → font-body ⭐
- Status badges (SAFE/BANG): font-pixel → font-body ⭐
- Sub-action buttons (How to Play, Provably Fair): font-pixel → font-body ⭐
- SETTLING text: font-pixel → font-body ⭐
- Instruction text: font-pixel → font-body ⭐
- Header text: stays font-body (no change needed, was already changed?)
- Result overlay labels (PAYOUT etc): font-pixel → font-body ⭐
- Result overlay "Provably Fair" button: font-pixel → font-body ⭐

## 2. Wallet Connect CTA

In BetPanel.tsx, when wallet is not connected:
- Change the BET button text to "CONNECT WALLET"
- On click, trigger wallet connect modal instead of startGame
- Keep the same green CTA styling
- The bet input and quick chips can still be visible (user can browse amounts) but CTA changes

Implementation: BetPanel already receives props. Check if wallet is connected via `useWallet()` hook.
```tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

// Inside BetPanel:
const { connected } = useWallet();
const { setVisible } = useWalletModal();

// CTA button:
<button onClick={connected ? handleBet : () => setVisible(true)}>
  {connected ? `BET ${betAmount} SOL` : 'CONNECT WALLET'}
</button>
```

## 3. Remove Odds Fractions

In GameBoard.tsx, remove the odds row below the multiplier table:
```tsx
// DELETE this entire block:
<div className="grid grid-cols-5 gap-1.5 mt-1">
  {ROUND_ODDS.map((odds, idx) => (
    ...
  ))}
</div>
```
Also remove the `ROUND_ODDS` constant at top of file.

## 4. Sidebar Clipping + Spacing

In page.tsx layout:
- Add `overflow-hidden` or proper padding to sidebar containers
- Ensure sidebars have `min-w-0` to prevent content overflow
- Add `p-2` or `p-3` inner padding to sidebar wrappers
- Increase gap between main sections: multiplier table → cylinder → bet section

In GameBoard.tsx:
- Add `gap-4` or `gap-5` between major sections (currently `gap-3`)
- Add `mb-4` after multiplier table
- Add `mt-2` before bet section

## 5. Cylinder Dim → Bright Transition (Game-like Flow)

In GameBoard.tsx, the cylinder image:
- Idle state (before bet): `brightness-[0.35] saturate-[0.3]` — dark, desaturated
- Active state (game started, selecting chamber): `brightness-100 saturate-100` — full color
- Spinning: existing blur effect stays
- Transition: `transition-all duration-700 ease-out`

```tsx
const cylinderFilter = !isActive && !isGameOver
  ? 'brightness-[0.35] saturate-[0.3]'  // dormant
  : cylinderPhase === 'spinning'
    ? 'blur-[8px] brightness-[1.3]'      // spinning (existing)
    : '';                                  // active, full brightness
```

Also dim the chamber overlay pulse animation in idle state.

## 6. Move HOW TO PLAY / PROVABLY FAIR to Footer

Currently these are inside GameBoard.tsx as sub-action buttons.
Move them to the page footer area (below the main game card).
Keep the same click handlers (they open modals that are in GameBoard).

Option: Keep them where they are but restyle as simple text links, or move to an actual footer bar.
Simpler approach: just move them below the game card wrapper, styled as subtle footer links.

## 7. Build & Verify

- `pnpm build` must pass
- All 8 `data-testid` attributes preserved
- No game logic changes (useGame, sound, spin untouched)
- Visual verification via screenshot

## Constraints
- Do NOT modify useGame hook, SoundEngine, or spin/rotation logic
- Preserve all data-testid attributes
- Minimum font sizes: desktop 14px (text-sm), mobile 12px (text-xs)
- Use breakpoint prefixes (max-md:text-xs) for responsive sizing

---
## 작업 완료 후 필수
- CLAUDE.md가 있으면 이번 작업에서 배운 패턴/규칙/주의사항을 추가할 것
- CLAUDE.md가 없으면 새로 생성할 것 (프로젝트 구조, 빌드 명령, 핵심 규칙 포함)
