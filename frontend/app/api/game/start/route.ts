import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { sql } from '@vercel/postgres';
import { ensureGamesSchema } from '@/lib/db';
import { generateServerSeed } from '@/lib/game-server';
import { logServerError } from '@/lib/server-error-reporter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { playerWallet } = await request.json();

    // Validate wallet
    try {
      new PublicKey(playerWallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    await ensureGamesSchema();

    // Clean up stale pending games (>5 min old)
    await sql`
      DELETE FROM games
      WHERE player_wallet = ${playerWallet}
        AND status = 'pending'
        AND created_at < NOW() - INTERVAL '5 minutes'
    `;

    // Check for existing active game
    const { rows: active } = await sql`
      SELECT id FROM games
      WHERE player_wallet = ${playerWallet}
        AND status IN ('pending', 'started')
      LIMIT 1
    `;

    if (active.length > 0) {
      return NextResponse.json(
        { error: 'Active game already exists', gameId: active[0].id },
        { status: 409 }
      );
    }

    // Generate server seed
    const { serverSeed, seedHash, seedHashBytes } = generateServerSeed();

    // Insert game
    const { rows } = await sql`
      INSERT INTO games (player_wallet, server_seed, seed_hash, status, current_round)
      VALUES (${playerWallet}, ${serverSeed}, ${seedHash}, 'pending', 0)
      RETURNING id
    `;

    return NextResponse.json({
      gameId: rows[0].id,
      seedHash,
      seedHashBytes,
    });
  } catch (error) {
    console.error('POST /api/game/start error:', error);
    await logServerError('api/game/start', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
