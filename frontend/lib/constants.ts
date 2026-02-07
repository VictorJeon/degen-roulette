import { PublicKey } from '@solana/web3.js';

// Program ID from IDL v2
export const PROGRAM_ID = new PublicKey('98RABzywqR9v33GmioVFeFrapM1LC5RiwmJbXdEPvx59');

// Game constants
export const CHAMBERS = 6;
export const MULTIPLIERS = [1.16, 1.45, 1.94, 2.91, 5.82];
export const MULTIPLIER_LABELS = ['1.16x', '1.45x', '1.94x', '2.91x', '5.82x'];
export const MAX_ROUNDS = 5;

// Devnet endpoint (Helius RPC)
export const DEVNET_ENDPOINT = 'https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6';
