# Figma Desktop_Start Implementation Spec

> Source: Figma file `lgRypzBOBxyf2B1hW0bXEG`, page `Desktop_Start`, frame `2:46` (1512×784)
> All values extracted from Figma API. CSS values are exact. Do NOT deviate.

## CRITICAL RULES
- Do NOT modify game logic (useGame hook, sound, spin mechanics)
- Do NOT remove any `data-testid` attributes
- Do NOT remove any `aria-*` or `role` attributes (keep all accessibility)
- Only modify className strings and text content as specified
- Mobile breakpoint styles (`max-md:`, `max-sm:`, `max-[360px]:`) should be kept unless explicitly changed

---

## 1. page.tsx — Grid Layout

### Current
```
grid-cols-1 md:grid-cols-2 lg:grid-cols-[200px_1fr_220px] xl:grid-cols-[240px_1fr_260px] gap-4 lg:gap-6 px-4 lg:px-6
```

### Target (Figma: 3 columns, gap 46px between)
```
grid-cols-1 md:grid-cols-2 lg:grid-cols-[268px_1fr_260px] gap-4 lg:gap-[46px] px-4 lg:px-6
```

Changes:
- `lg:grid-cols-[200px_1fr_220px]` → `lg:grid-cols-[268px_1fr_260px]`
- Remove `xl:grid-cols-[240px_1fr_260px]` (single breakpoint is enough)
- `lg:gap-6` → `lg:gap-[46px]`

---

## 2. Header.tsx — Icon Replacement

### Current left element
```tsx
<span className="text-xl mr-auto">🎯</span>
```

### Target (Figma: custom revolver icon SVG, 33×33px)
```tsx
<img src="/dg-icon.svg" alt="Degen Roulette" className="w-[33px] h-[33px] mr-auto" />
```

The SVG file is already at `public/dg-icon.svg`.

---

## 3. GameBoard.tsx — Title & Spacing

### 3a. Game center container
Current:
```
gap-3 pt-3 w-full max-w-[680px] bg-bg-surface border border-border-default rounded-xl p-5
```

Target (Figma: 680w, vertical gap 26px, border #252525, bg #0E130E):
```
gap-[26px] pt-0 w-full max-w-[680px] bg-bg-surface border border-border-default rounded-xl p-5
```

Change: `gap-3` → `gap-[26px]`, `pt-3` → `pt-0`

### 3b. Title "DEGEN ROULETTE"
Current:
```
font-pixel text-[1.8rem] text-center text-accent tracking-[0.15em] mb-0.5
```

Target (Figma: Silkscreen 44.8px ≈ 2.8rem):
```
font-pixel text-[2.8rem] text-center text-accent tracking-[0.15em] mb-0
```

Change: `text-[1.8rem]` → `text-[2.8rem]`, `mb-0.5` → `mb-0`

### 3c. Subtitle
Current:
```
font-body text-sm max-md:text-xs text-gray-100 text-center tracking-wide
```

No change needed. Figma matches: Space Mono 14px, gray.

### 3d. Multiplier table labels
Current: `R{idx + 1}` (shows "R1", "R2", etc.)
Target: `Round {idx + 1}` (shows "Round 1", "Round 2", etc.)

Also update the multiplier card padding:
Current: `p-3` (12px)
Target: `py-2` (8px top/bottom) — Figma: padding 8px top, 8px bottom

Current multiplier card classes:
```
border rounded flex flex-col items-center gap-1 p-3 transition-all max-md:p-2.5 max-sm:p-1
```

Target:
```
border rounded flex flex-col items-center gap-1 py-2 px-1 transition-all max-md:py-1.5 max-md:px-1 max-sm:p-1
```

Change: `p-3` → `py-2 px-1`, `max-md:p-2.5` → `max-md:py-1.5 max-md:px-1`

### 3e. Multiplier table container
Current: `mb-4 max-md:mb-3`
Target: `mb-0 max-md:mb-0` (gap is now handled by parent's gap-[26px])

Change: `mb-4` → `mb-0`, `max-md:mb-3` → `max-md:mb-0`

### 3f. Cylinder container margins
Current: `mt-2 mb-2.5`
Target: `mt-0 mb-0` (gap handled by parent)

---

## 4. BetPanel.tsx — Fine Adjustments

### 4a. Container gap
Current: `gap-3`
Target: `gap-3` — Figma shows 12px between input/chips/CTA. `gap-3` = 12px. ✅ No change.

### 4b. CTA button text size
Current: `text-xl` (20px)
Target: `text-2xl` (24px) — Figma: Chakra Petch Bold 24px

Current CTA classes:
```
w-full h-12 bg-accent font-display font-bold text-xl text-bg-primary tracking-[0.08em]
```

Target:
```
w-full h-12 bg-accent font-display font-bold text-2xl text-bg-primary tracking-[0.08em]
```

Change: `text-xl` → `text-2xl`

### 4c. Quick bet chip height
Current: `h-9` (36px)
Target: `h-9` — Figma: 36h. ✅ No change.

---

## 5. LiveFeed.tsx — Title Text

Current title: `LIVE FEED`
Target title: `RECENT GAMES` (Figma text)

Also remove the "GLOBAL" span next to it (not present in Figma).

Current:
```tsx
<h3 className="font-display text-sm max-md:text-xs text-accent tracking-wide">LIVE FEED</h3>
<span className="font-display text-sm max-md:text-xs text-gray-200">GLOBAL</span>
```

Target:
```tsx
<h3 className="font-display text-sm max-md:text-xs text-accent tracking-wide">RECENT GAMES</h3>
```

Remove the `<span>GLOBAL</span>` element entirely.

---

## 6. Leaderboard.tsx — Rounded Corners

Figma Leaderboard has NO rounded corners (cornerRadius: null).

Current container: `rounded-xl`
Target: Remove `rounded-xl` (Figma has square corners)

Also the secondary rank section has `rounded-xl` — remove it too.

Current LiveFeed also has `rounded-xl` — remove it to match Figma (cornerRadius: null on live feed).

Actually wait — looking again at Figma data:
- Leaderboard: cornerRadius null → no rounding
- LiveFeed: cornerRadius null → no rounding
- Game center container KEEPS rounded-xl (it has that in current design)

Change in Leaderboard.tsx:
- First container: remove `rounded-xl`
- Second container: remove `rounded-xl`

Change in LiveFeed.tsx:
- Container: remove `rounded-xl`

---

## Summary of all file changes

| File | Changes |
|------|---------|
| `app/page.tsx` | Grid columns, gap |
| `components/Header.tsx` | 🎯 → dg-icon.svg |
| `components/GameBoard.tsx` | Title size, container gap, multiplier labels/padding, remove margins |
| `components/BetPanel.tsx` | CTA text size |
| `components/LiveFeed.tsx` | "LIVE FEED" → "RECENT GAMES", remove "GLOBAL" |
| `components/Leaderboard.tsx` | Remove rounded-xl |

Total: 6 files, all className/text changes only. No logic changes.
