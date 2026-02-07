import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { sql } from '@vercel/postgres';
import { ensureGamesSchema } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tx: string }> }
): Promise<NextResponse> {
  try {
    const { tx } = await params;

    await ensureGamesSchema();

    const { rows } = await sql`
      SELECT * FROM games WHERE settle_tx = ${tx}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Game not found for this transaction' }, { status: 404 });
    }

    const game = rows[0];

    // Verify hash match
    const serverSeedBuf = Buffer.from(game.server_seed, 'hex');
    const computedHash = createHash('sha256').update(serverSeedBuf).digest('hex');
    const hashMatch = computedHash === game.seed_hash;

    return NextResponse.json({
      serverSeed: game.server_seed,
      seedHash: game.seed_hash,
      bulletPosition: game.bullet_position,
      roundsSurvived: game.rounds_survived,
      won: game.won,
      betAmount: Number(game.bet_amount),
      payout: Number(game.payout),
      startTx: game.start_tx,
      settleTx: game.settle_tx,
      hashMatch,
      verifiable: true,
    });
  } catch (error) {
    console.error('GET /api/game/verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
