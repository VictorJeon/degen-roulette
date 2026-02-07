import { sql } from '@vercel/postgres';

export async function logServerError(
  source: string,
  error: Error | string,
  extra?: Record<string, any>
) {
  try {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    await sql`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL DEFAULT 'server',
        message TEXT NOT NULL,
        stack TEXT,
        url TEXT,
        user_agent TEXT,
        wallet TEXT,
        extra JSONB,
        resolved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO error_logs (source, message, stack, extra)
      VALUES (
        ${source},
        ${message.slice(0, 4000)},
        ${stack ? stack.slice(0, 8000) : null},
        ${extra ? JSON.stringify(extra) : null}
      )
    `;
  } catch (e) {
    // Don't throw from error reporter
    console.error('[error-reporter] failed to log:', e);
  }
}
