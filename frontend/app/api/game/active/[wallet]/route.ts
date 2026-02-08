import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { sql } from '@vercel/postgres';
import { ensureGamesSchema } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wallet: string }> }
): Promise<NextResponse> {
  try {
    const { wallet } = await params;

    // Validate wallet
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    await ensureGamesSchema();

    const { rows } = await sql`
      SELECT id, bet_amount, seed_hash, created_at
      FROM games
      WHERE player_wallet = ${wallet}
        AND status = 'started'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ hasActiveGame: false });
    }

    return NextResponse.json({
      hasActiveGame: true,
      gameId: rows[0].id,
      betAmount: Number(rows[0].bet_amount),
      seedHash: rows[0].seed_hash,
      createdAt: rows[0].created_at,
    });
  } catch (error) {
    console.error('GET /api/game/active error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
