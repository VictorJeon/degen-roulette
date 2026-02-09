import { NextResponse } from 'next/server';
import { gameMock } from '@/lib/game-mock';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  if (!process.env.POSTGRES_URL) {
    gameMock.clear();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
}
