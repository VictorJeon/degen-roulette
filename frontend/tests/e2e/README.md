# Degen Roulette E2E Tests

Playwright-based end-to-end tests for the Degen Roulette frontend.

## Setup

Install Playwright and browsers:

```bash
npm install
npx playwright install chromium
```

## Running Tests

### Headless mode (CI)
```bash
npm run test:e2e
```

### Headed mode (see browser)
```bash
npm run test:e2e:headed
```

### UI mode (interactive debugging)
```bash
npm run test:e2e:ui
```

### Debug mode (step-by-step)
```bash
npm run test:e2e:debug
```

## Test Structure

- **`game-flow.spec.ts`** - Happy path scenarios (win/survive rounds)
- **`error-handling.spec.ts`** - Error cases (invalid bet, no wallet, etc.)
- **`provably-fair.spec.ts`** - Verification and transparency testing

## How It Works

### Mock Wallet

Tests use a mock Phantom wallet (`playwright/fixtures/mock-wallet.ts`) that:
- Injects `window.solana` object before page load
- Auto-approves wallet connection
- Auto-approves transaction signatures
- Uses a fixed test keypair for consistency

### Test Keypair

Located at `playwright/fixtures/test-keypair.json`:
- Public key: `5pUv3FqUnY1wWW1NkRgLzPJF3Xvu3HmRHipAZ1T4oQvj`
- Pre-funded with 0.05 SOL on Devnet
- Consistent across test runs

### Target Environment

- **URL**: `https://frontend-umber-kappa-32.vercel.app/`
- **Network**: Solana Devnet
- **RPC**: Helius Devnet endpoint

## Notes

### Timeouts

Tests use extended timeouts (60s) to account for:
- Solana transaction confirmation (~30s)
- House settlement processing
- Network latency on Devnet

### Randomness

Some tests may fail due to RNG:
- Bullet position is randomly determined
- Tests may "lose" on first pull (expected behavior)
- Re-run tests if random failure occurs

### Retries

Configured with 1 retry by default to handle:
- Devnet RPC flakiness
- Transaction confirmation timeouts
- Network issues

## Debugging

### View test report
```bash
npx playwright show-report
```

### View trace (after failure)
```bash
npx playwright show-trace trace.zip
```

### Check screenshots
Failed tests save screenshots to `test-results/` directory.

## CI Integration

Tests are ready for CI/CD:
- Set `CI=true` env variable for CI mode
- Retries: 2 (vs 1 locally)
- Screenshots/videos on failure only
- HTML report generated automatically

Example GitHub Actions:
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## Troubleshooting

### Wallet not connecting
- Check browser console in headed mode
- Verify `window.solana` is injected (use debug mode)
- Ensure test keypair is valid

### Transaction failures
- Verify test wallet has sufficient balance
- Check Devnet RPC status
- Review Solana Explorer for transaction details

### Selector not found
- UI may have changed - update selectors in test files
- Use `npm run test:e2e:ui` to inspect element selectors
- Check component files for current class names

### Timeout errors
- Devnet can be slow - increase timeout if needed
- Check network connection
- Verify Vercel deployment is live

## Maintenance

When UI changes, update:
1. **Selectors** in test files (e.g., button text, class names)
2. **Wait conditions** if new loading states are added
3. **Mock wallet** if Phantom API changes
4. **Test keypair** if it runs out of funds (airdrop more SOL)

## Resources

- [Playwright Docs](https://playwright.dev/)
- [Solana Devnet Faucet](https://faucet.solana.com/)
- [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
