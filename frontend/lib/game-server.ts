import { createHash, randomBytes } from 'crypto';
import { Keypair, Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { sql } from '@vercel/postgres';
import { IDL } from './idl';
import { DEVNET_ENDPOINT, PROGRAM_ID } from './constants';
import { ensureGamesSchema, ensureSchema } from './db';

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

export interface SettleGameResult {
  won: boolean;
  cancelled: boolean;
  bulletPosition: number;
  roundsSurvived: number;
  payout: number;
  betAmount: number;
  serverSeed: string;
  seedHash: string;
  txSignature: string | null;
  alreadySettled?: boolean;
}

export async function settleGameLogic(gameId: number, roundsSurvived: number): Promise<SettleGameResult> {
  await ensureGamesSchema();

  // Load game
  const { rows } = await sql`
    SELECT * FROM games WHERE id = ${gameId}
  `;

  if (rows.length === 0) {
    throw new Error('Game not found');
  }

  const game = rows[0];

  if (game.status !== 'started') {
    throw new Error(`Game status is ${game.status}, expected started`);
  }

  // Get house program
  const { program, houseKeypair } = getHouseProgram();
  const { gamePda, houseConfig, houseVault, playerStats, playerPubkey } = derivePDAs(
    game.player_wallet,
    program.programId
  );

  // Check on-chain status first (idempotent settle)
  const onchain = await (program.account as any).gameState.fetch(gamePda);
  const status = onchain.status || {};
  const isActive = 'active' in status;
  const isWon = 'won' in status;
  const isLost = 'lost' in status;
  const isCancelled = 'cancelled' in status;

  if (!isActive && (isWon || isLost || isCancelled)) {
    // Already settled
    const payout = Number(onchain.payout || 0);
    const bulletPosition = onchain.bulletPosition;
    const rounds = onchain.roundsSurvived || 0;
    const won = isWon;

    await sql`
      UPDATE games
      SET status = 'settled',
          rounds_survived = ${rounds},
          bullet_position = ${bulletPosition},
          won = ${won},
          payout = ${payout},
          settled_at = NOW()
      WHERE id = ${gameId}
    `;

    return {
      won,
      cancelled: isCancelled,
      bulletPosition,
      roundsSurvived: rounds,
      payout,
      betAmount: Number(game.bet_amount || 0),
      serverSeed: game.server_seed,
      seedHash: game.seed_hash,
      txSignature: game.settle_tx || null,
      alreadySettled: true,
    };
  }

  // Convert server seed hex to bytes
  const serverSeedBytes = Buffer.from(game.server_seed, 'hex');

  // Call settle_game on-chain
  const tx = await program.methods
    .settleGame(roundsSurvived, Array.from(serverSeedBytes))
    .accounts({
      authority: houseKeypair.publicKey,
      houseConfig,
      houseVault,
      game: gamePda,
      player: playerPubkey,
      playerStats,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('settle_game TX:', tx);

  // Read game account for result
  await new Promise(resolve => setTimeout(resolve, 2000));
  const gameAccount = await (program.account as any).gameState.fetch(gamePda);

  const won = 'won' in gameAccount.status;
  const bulletPosition = gameAccount.bulletPosition;
  const payout = Number(gameAccount.payout);

  // Update games table
  await sql`
    UPDATE games
    SET status = 'settled',
        rounds_survived = ${roundsSurvived},
        bullet_position = ${bulletPosition},
        won = ${won},
        payout = ${payout},
        settle_tx = ${tx},
        settled_at = NOW()
    WHERE id = ${gameId}
  `;

  // Update leaderboard
  await ensureSchema();
  const betAmount = Number(game.bet_amount || 0);
  const profitDelta = won ? payout - betAmount : -betAmount;

  await sql`
    INSERT INTO leaderboard (
      wallet_address, total_games, total_wagered, total_won, total_profit, best_streak, last_played_at
    ) VALUES (
      ${game.player_wallet}, 1, ${betAmount}, ${payout}, ${profitDelta},
      ${won ? roundsSurvived : 0}, NOW()
    )
    ON CONFLICT (wallet_address)
    DO UPDATE SET
      total_games = leaderboard.total_games + 1,
      total_wagered = leaderboard.total_wagered + ${betAmount},
      total_won = leaderboard.total_won + ${payout},
      total_profit = leaderboard.total_profit + ${profitDelta},
      best_streak = GREATEST(leaderboard.best_streak, ${won ? roundsSurvived : 0}),
      last_played_at = NOW()
  `;

  return {
    won,
    cancelled: false,
    bulletPosition,
    roundsSurvived,
    payout,
    betAmount,
    serverSeed: game.server_seed,
    seedHash: game.seed_hash,
    txSignature: tx,
  };
}
