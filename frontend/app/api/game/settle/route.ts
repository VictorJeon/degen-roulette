import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureGamesSchema } from '@/lib/db';
import { settleGameLogic } from '@/lib/game-server';
import { logServerError } from '@/lib/server-error-reporter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let gameId: number | null = null;
  try {
    const body = await request.json();
    gameId = body.gameId ?? null;

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    await ensureGamesSchema();

    // Load game to get current_round
    const { rows } = await sql`
      SELECT current_round, status
      FROM games
      WHERE id = ${gameId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = rows[0];

    if (game.status !== 'started') {
      return NextResponse.json(
        { error: `Game status is ${game.status}, expected started` },
        { status: 400 }
      );
    }

    const roundsSurvived = Number(game.current_round);

    if (roundsSurvived < 1 || roundsSurvived > 5) {
      return NextResponse.json(
        { error: `Invalid rounds survived: ${roundsSurvived}` },
        { status: 400 }
      );
    }

    // Call shared settle logic
    const result = await settleGameLogic(gameId, roundsSurvived);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/game/settle error:', error);
    await logServerError('api/game/settle', error, { gameId });
    return NextResponse.json(
      { error: error.message || 'Settlement failed' },
      { status: 500 }
    );
  }
}
