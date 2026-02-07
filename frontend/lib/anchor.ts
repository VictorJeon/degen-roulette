import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { DEVNET_ENDPOINT, PROGRAM_ID } from './constants';
import IDL from '../idl/degen_roulette_v2.json';

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as any, provider);
}

export function getConnection() {
  return new Connection(DEVNET_ENDPOINT, 'confirmed');
}
