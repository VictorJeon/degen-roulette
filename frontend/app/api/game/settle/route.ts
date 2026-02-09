import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { ensureGamesSchema } from '@/lib/db';
import { settleGameLogic } from '@/lib/game-server';
import { logServerError } from '@/lib/server-error-reporter';
import { gameMock } from '@/lib/game-mock';
import { MULTIPLIERS } from '@/lib/constants';

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

    // Use in-memory mock if DB is not available
    if (!process.env.POSTGRES_URL) {
      console.warn('[game/settle] Using in-memory mock (no POSTGRES_URL)');

      const game = gameMock.getGame(gameId);
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }

      if (game.status !== 'started') {
        return NextResponse.json(
          { error: `Game status is ${game.status}, expected started` },
          { status: 400 }
        );
      }

      const roundsSurvived = game.current_round;
      if (roundsSurvived < 1 || roundsSurvived > 5) {
        return NextResponse.json(
          { error: `Invalid rounds survived: ${roundsSurvived}` },
          { status: 400 }
        );
      }

      const seedBuffer = Buffer.from(game.server_seed, 'hex');
      const bulletPosition = seedBuffer[0] % 6;
      const multiplier = MULTIPLIERS[roundsSurvived - 1];
      const betAmount = game.bet_amount || 10000000;
      const payout = Math.round(betAmount * multiplier);

      gameMock.updateGame(gameId, {
        status: 'won',
        rounds_survived: roundsSurvived,
        bullet_position: bulletPosition,
        won: true,
        payout,
        settled_at: new Date(),
      });

      return NextResponse.json({
        won: true,
        cancelled: false,
        bulletPosition,
        roundsSurvived,
        payout,
        betAmount,
        serverSeed: game.server_seed,
        seedHash: game.seed_hash,
        txSignature: null,
      });
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
