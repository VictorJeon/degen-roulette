import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { DEVNET_ENDPOINT, PROGRAM_ID } from './constants';
import { IDL } from './idl';

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL, provider);
}

export function getConnection() {
  return new Connection(DEVNET_ENDPOINT, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    wsEndpoint: undefined, // Disable WebSocket for mobile stability
  });
}
