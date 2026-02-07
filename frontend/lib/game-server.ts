import { createHash, randomBytes } from 'crypto';
import { Keypair, Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { IDL } from './idl';
import { DEVNET_ENDPOINT, PROGRAM_ID } from './constants';

// Minimal wallet adapter for server-side Anchor usage
class NodeWallet {
  constructor(readonly payer: Keypair) {}
  get publicKey() { return this.payer.publicKey; }
  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) { tx.partialSign(this.payer); }
    return tx;
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return txs.map(tx => { if (tx instanceof Transaction) tx.partialSign(this.payer); return tx; });
  }
}

export function getHouseKeypair(): Keypair {
  const raw = process.env.HOUSE_AUTHORITY_KEYPAIR;
  if (!raw) throw new Error('HOUSE_AUTHORITY_KEYPAIR env not set');
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

export function generateServerSeed(): { serverSeed: string; seedHash: string; seedHashBytes: number[] } {
  const serverSeedBuf = randomBytes(32);
  const serverSeed = serverSeedBuf.toString('hex');
  const hashBuf = createHash('sha256').update(serverSeedBuf).digest();
  const seedHash = hashBuf.toString('hex');
  const seedHashBytes = Array.from(hashBuf);
  return { serverSeed, seedHash, seedHashBytes };
}

export function getHouseProgram(): { program: Program; houseKeypair: Keypair } {
  const houseKeypair = getHouseKeypair();
  const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');
  const wallet = new NodeWallet(houseKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(IDL as any, provider);
  return { program, houseKeypair };
}

export function derivePDAs(playerWallet: string, programId: PublicKey) {
  const playerPubkey = new PublicKey(playerWallet);
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('game'), playerPubkey.toBuffer()],
    programId
  );
  const [houseConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('house_config')],
    programId
  );
  const [houseVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('house_vault')],
    programId
  );
  const [playerStats] = PublicKey.findProgramAddressSync(
    [Buffer.from('player_stats'), playerPubkey.toBuffer()],
    programId
  );
  return { gamePda, houseConfig, houseVault, playerStats, playerPubkey };
}
