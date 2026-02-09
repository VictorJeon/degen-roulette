import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureGamesSchema } from '@/lib/db';
import { gameMock } from '@/lib/game-mock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { gameId, txSignature } = await request.json();

    if (!gameId || !txSignature) {
      return NextResponse.json({ error: 'Missing gameId or txSignature' }, { status: 400 });
    }

    // Use in-memory mock if DB is not available
    if (!process.env.POSTGRES_URL) {
      console.warn('[game/confirm] Using in-memory mock (no POSTGRES_URL)');

      const game = gameMock.getGame(gameId);
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }

      if (game.status !== 'pending') {
        return NextResponse.json({ error: 'Game is not in pending state' }, { status: 400 });
      }

      gameMock.updateGame(gameId, {
        status: 'started',
        start_tx: txSignature,
      });

      return NextResponse.json({ ok: true });
    }

    // DB path (production)
    await ensureGamesSchema();

    const { rows } = await sql`
      SELECT id, status FROM games WHERE id = ${gameId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (rows[0].status !== 'pending') {
      return NextResponse.json({ error: 'Game is not in pending state' }, { status: 400 });
    }

    await sql`
      UPDATE games
      SET status = 'started', start_tx = ${txSignature}
      WHERE id = ${gameId}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/game/confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
