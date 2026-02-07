import { PublicKey } from '@solana/web3.js';

// Program ID from IDL v2
export const PROGRAM_ID = new PublicKey('DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7');

// Orao VRF Program
export const ORAO_VRF_PROGRAM_ID = new PublicKey('VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y');

// Orao VRF Treasury (devnet)
export const ORAO_VRF_TREASURY = new PublicKey('9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR');

// Game constants
export const CHAMBERS = 6;
export const MULTIPLIERS = [1.16, 1.45, 1.94, 2.91, 5.82];
export const MULTIPLIER_LABELS = ['1.16x', '1.45x', '1.94x', '2.91x', '5.82x'];
export const MAX_ROUNDS = 5;

// Devnet endpoint
export const DEVNET_ENDPOINT = 'https://api.devnet.solana.com';
