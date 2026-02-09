import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'wallet required' }, { status: 400 });
    }

    const { rows } = await sql`
      SELECT id, status, current_round, created_at
      FROM games
      WHERE player_wallet = ${wallet}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({ wallet, games: rows });
  } catch (error) {
    console.error('DB check error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
