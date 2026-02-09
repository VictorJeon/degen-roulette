import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { ensureErrorsSchema } from '@/lib/db';

export const runtime = 'nodejs';

// POST: 에러 기록
export async function POST(request: NextRequest) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ ok: true });
    }

    await ensureErrorsSchema();
    const body = await request.json();

    const { source, message, stack, url, wallet, extra } = body;

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    await sql`
      INSERT INTO error_logs (source, message, stack, url, user_agent, wallet, extra)
      VALUES (
        ${source || 'client'},
        ${message},
        ${stack || null},
        ${url || null},
        ${request.headers.get('user-agent') || null},
        ${wallet || null},
        ${extra ? JSON.stringify(extra) : null}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error logging failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: 미해결 에러 조회 (Nova polling용)
export async function GET(request: NextRequest) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ errors: [], count: 0 });
    }

    await ensureErrorsSchema();
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await sql`
      SELECT id, source, message, stack, url, wallet, extra, created_at
      FROM error_logs
      WHERE resolved = ${resolved}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ errors: result.rows, count: result.rowCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: 에러 해결 마킹
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 });
    }

    for (const id of ids) {
      await sql`UPDATE error_logs SET resolved = TRUE WHERE id = ${id}`;
    }

    return NextResponse.json({ ok: true, resolved: ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
