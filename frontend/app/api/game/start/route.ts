import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { sql } from '@vercel/postgres';
import { ensureGamesSchema } from '@/lib/db';
import { generateServerSeed } from '@/lib/game-server';
import { logServerError } from '@/lib/server-error-reporter';
import { gameMock } from '@/lib/game-mock';

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

    // Use in-memory mock if DB is not available
    if (!process.env.POSTGRES_URL) {
      console.warn('[game/start] Using in-memory mock (no POSTGRES_URL)');

      // Clean up pending games
      gameMock.deletePendingGames(playerWallet);

      // In mock mode, force-expire any active game (test isolation)
      const activeGame = gameMock.getActiveGame(playerWallet);
      if (activeGame) {
        gameMock.updateGame(activeGame.id, { status: 'lost' });
        console.warn('[game/start] Force-expired active game:', activeGame.id);
      }

      // Clean up old started games
      gameMock.updateOldStartedGamesToLost(playerWallet);

      // Generate server seed
      const { serverSeed, seedHash, seedHashBytes } = generateServerSeed();

      // Create game in mock
      const game = gameMock.createGame({
        playerWallet,
        serverSeed,
        seedHash,
        status: 'pending',
        currentRound: 0,
      });

      return NextResponse.json({
        gameId: game.id,
        seedHash,
        seedHashBytes,
      });
    }

    // DB path (production)
    await ensureGamesSchema();

    // Clean up all pending games (not yet confirmed on-chain)
    await sql`
      DELETE FROM games
      WHERE player_wallet = ${playerWallet}
        AND status = 'pending'
    `;

    // Check for existing started (on-chain confirmed) game within 5 minutes
    const { rows: active } = await sql`
      SELECT id FROM games
      WHERE player_wallet = ${playerWallet}
        AND status = 'started'
        AND created_at > NOW() - INTERVAL '5 minutes'
      LIMIT 1
    `;

    if (active.length > 0) {
      return NextResponse.json(
        { error: 'Active game already exists', gameId: active[0].id },
        { status: 409 }
      );
    }

    // Clean up old started games (>5 minutes) - likely abandoned
    await sql`
      UPDATE games
      SET status = 'lost', updated_at = NOW()
      WHERE player_wallet = ${playerWallet}
        AND status = 'started'
        AND created_at <= NOW() - INTERVAL '5 minutes'
    `;

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
