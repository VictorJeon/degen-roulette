import { sql } from '@vercel/postgres';

export interface LeaderboardRow {
  wallet_address: string;
  total_games: number;
  total_wagered: string;
  total_won: string;
  total_profit: string;
  best_streak: number;
  last_played_at: Date;
  created_at: Date;
}

export async function ensureSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS leaderboard (
      wallet_address text PRIMARY KEY,
      total_games int NOT NULL DEFAULT 0,
      total_wagered bigint NOT NULL DEFAULT 0,
      total_won bigint NOT NULL DEFAULT 0,
      total_profit bigint NOT NULL DEFAULT 0,
      best_streak int NOT NULL DEFAULT 0,
      last_played_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_leaderboard_profit
    ON leaderboard(total_profit DESC)
  `;
}

export async function ensureErrorsSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS error_logs (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL DEFAULT 'client',
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
  await sql`CREATE INDEX IF NOT EXISTS idx_errors_resolved ON error_logs(resolved, created_at DESC)`;
}

export async function ensureGamesSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      player_wallet TEXT NOT NULL,
      bet_amount BIGINT NOT NULL DEFAULT 0,
      server_seed TEXT NOT NULL,
      seed_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      rounds_survived INT,
      bullet_position INT,
      won BOOLEAN,
      payout BIGINT DEFAULT 0,
      start_tx TEXT,
      settle_tx TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      settled_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_games_player ON games(player_wallet)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)`;
}
