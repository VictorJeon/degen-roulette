# Degen Roulette V2

Provably Fair Russian Roulette on Solana

## Overview

A decentralized Russian Roulette game built on Solana using the Anchor framework. Features progressive multipliers (1.15x to 5.5x) and provably fair gameplay.

## Project Structure

- `anchor-v2/` - Solana program (Rust + Anchor)
- `frontend/` - Next.js web interface

## Program Details

- **Program ID**: `DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7`
- **Network**: Devnet
- **Framework**: Anchor 0.31.1

## Game Mechanics

- 6 chambers, 1 bullet
- Progressive multipliers: 1.15x, 1.40x, 1.90x, 2.80x, 5.50x
- Cash out anytime or risk it all
- House vault managed via PDA

## Development

### Anchor Program

```bash
cd anchor-v2
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## License

ISC
