import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ensureSchema } from '@/lib/db';
import { verifyTransaction, fetchPlayerStats } from '@/lib/solana-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ leaderboard: [] });
    }

    await ensureSchema();

    const { rows } = await sql`
      SELECT
        wallet_address,
        total_games,
        total_profit,
        best_streak,
        last_played_at
      FROM leaderboard
      ORDER BY total_profit DESC
      LIMIT 20
    `;

    const leaderboard = rows.map((row, index) => ({
      rank: index + 1,
      wallet: row.wallet_address,
      totalGames: row.total_games,
      totalProfit: parseInt(row.total_profit),
      profitSol: parseInt(row.total_profit) / LAMPORTS_PER_SOL,
      bestStreak: row.best_streak,
      lastPlayedAt: row.last_played_at.toISOString(),
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { wallet, txSignature } = body;

    // Validation 1: Wallet format
    let walletPubkey: PublicKey;
    try {
      walletPubkey = new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validation 2: TX signature format
    if (!txSignature || typeof txSignature !== 'string' || txSignature.length < 80) {
      return NextResponse.json(
        { ok: false, error: 'Invalid transaction signature' },
        { status: 400 }
      );
    }

    // Validation 3: Verify transaction on-chain
    const isValid = await verifyTransaction(txSignature, walletPubkey);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: 'Transaction verification failed' },
        { status: 400 }
      );
    }

    // Fetch PlayerStats from on-chain
    const stats = await fetchPlayerStats(walletPubkey);
    if (!stats) {
      return NextResponse.json(
        { ok: false, error: 'Player stats not found on-chain' },
        { status: 404 }
      );
    }

    // 중복 방지: 최근 10초 이내 업데이트 차단
    await ensureSchema();
    const { rows: recent } = await sql`
      SELECT last_played_at
      FROM leaderboard
      WHERE wallet_address = ${wallet}
    `;

    if (recent.length > 0) {
      const lastUpdate = new Date(recent[0].last_played_at);
      const now = new Date();
      if (now.getTime() - lastUpdate.getTime() < 10000) {
        return NextResponse.json({ ok: true }); // Silent ignore
      }
    }

    // Upsert to DB
    await sql`
      INSERT INTO leaderboard (
        wallet_address,
        total_games,
        total_wagered,
        total_won,
        total_profit,
        best_streak,
        last_played_at
      ) VALUES (
        ${wallet},
        ${stats.totalGames.toString()},
        ${stats.totalWagered.toString()},
        ${stats.totalWon.toString()},
        ${stats.totalProfit.toString()},
        ${stats.bestStreak},
        NOW()
      )
      ON CONFLICT (wallet_address)
      DO UPDATE SET
        total_games = EXCLUDED.total_games,
        total_wagered = EXCLUDED.total_wagered,
        total_won = EXCLUDED.total_won,
        total_profit = EXCLUDED.total_profit,
        best_streak = EXCLUDED.best_streak,
        last_played_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/leaderboard error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
