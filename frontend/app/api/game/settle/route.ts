import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ensureGamesSchema, ensureSchema } from '@/lib/db';
import { getHouseProgram, derivePDAs } from '@/lib/game-server';
import { logServerError } from '@/lib/server-error-reporter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let gameId: number | null = null;
  try {
    const body = await request.json();
    gameId = body.gameId ?? null;
    const roundsSurvived = body.roundsSurvived;

    if (!gameId || !roundsSurvived) {
      return NextResponse.json({ error: 'Missing gameId or roundsSurvived' }, { status: 400 });
    }

    if (roundsSurvived < 1 || roundsSurvived > 5) {
      return NextResponse.json({ error: 'roundsSurvived must be 1-5' }, { status: 400 });
    }

    await ensureGamesSchema();

    // Load game
    const { rows } = await sql`
      SELECT * FROM games WHERE id = ${gameId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const game = rows[0];

    if (game.status !== 'started') {
      return NextResponse.json({ error: `Game status is ${game.status}, expected started` }, { status: 400 });
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

      return NextResponse.json({
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
      });
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

    return NextResponse.json({
      won,
      bulletPosition,
      roundsSurvived,
      payout,
      betAmount,
      serverSeed: game.server_seed,
      seedHash: game.seed_hash,
      txSignature: tx,
    });
  } catch (error: any) {
    console.error('POST /api/game/settle error:', error);
    await logServerError('api/game/settle', error, { gameId });
    return NextResponse.json(
      { error: error.message || 'Settlement failed' },
      { status: 500 }
    );
  }
}
