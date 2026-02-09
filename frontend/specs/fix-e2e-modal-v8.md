# E2E Fix Phase 8: Provably Fair modal click issue

## Problem
3 tests failing because modal backdrop intercepts button clicks.
Tests: provably-fair.spec.ts - "display server seed", "consistent seed hash", "explain provably fair"

## Fix
The modal backdrop (overlay) is blocking clicks on buttons behind or inside the modal.

### Investigate and fix:
1. Run only the failing tests: `npx playwright test tests/e2e/provably-fair.spec.ts`
2. Check test-results screenshots to see modal state
3. Fix: either
   - Add proper wait for modal to fully open before clicking
   - Click inside modal content area, not on backdrop
   - Close modal before clicking other elements
   - Fix z-index if elements are stacking wrong

### Do not:
- Modify passing tests
- Change game logic
- Alter wallet connection code

## Success criteria
- All 3 provably-fair tests pass
- No regression on other 10 tests
- Run full suite to confirm: `npx playwright test`
