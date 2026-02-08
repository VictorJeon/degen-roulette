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
    const { gameId: reqGameId } = await request.json();
    gameId = reqGameId;

    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    await ensureGamesSchema();

    // Load game with row lock for concurrency control
    const { rows } = await sql`
      SELECT id, server_seed, current_round, status
      FROM games
      WHERE id = ${gameId}
      FOR UPDATE
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

    const currentRound = Number(game.current_round);

    // Edge case: already completed 5 rounds
    if (currentRound >= 5) {
      return NextResponse.json(
        { error: 'Game already completed, must cash out' },
        { status: 400 }
      );
    }

    // Calculate bullet position (same as on-chain)
    const seedBuffer = Buffer.from(game.server_seed, 'hex');
    const bulletPosition = seedBuffer[0] % 6; // 0-5

    // Determine outcome
    if (currentRound === bulletPosition) {
      // Death → auto settle
      // Note: on-chain requires rounds_survived >= 1, so use max(currentRound, 1)
      const roundsForSettle = Math.max(currentRound, 1);
      try {
        const settleResult = await settleGameLogic(gameId, roundsForSettle);
        return NextResponse.json({
          survived: false,
          round: currentRound,
          bulletPosition,
          settleResult,
        });
      } catch (settleError: any) {
        console.error('settle error in pull:', settleError);
        await logServerError('api/game/pull:settle', settleError, { gameId });
        return NextResponse.json(
          { error: `Settle failed: ${settleError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Survived → increment current_round (optimistic locking)
      const { rows: updated } = await sql`
        UPDATE games
        SET current_round = current_round + 1
        WHERE id = ${gameId}
          AND status = 'started'
          AND current_round = ${currentRound}
        RETURNING current_round
      `;

      if (updated.length === 0) {
        // Concurrency conflict (another request updated first)
        return NextResponse.json(
          { error: 'Concurrent pull detected, please retry' },
          { status: 409 }
        );
      }

      const newRound = Number(updated[0].current_round);

      return NextResponse.json({
        survived: true,
        round: newRound,
      });
    }
  } catch (error: any) {
    console.error('POST /api/game/pull error:', error);
    await logServerError('api/game/pull', error, { gameId });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
