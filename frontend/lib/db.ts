import { sql } from '@vercel/postgres';

export interface LeaderboardRow {
  wallet_address: string;
  total_games: number;
  total_wagered: string; // bigint는 string으로 반환됨
  total_won: string;
  total_profit: string; // BIGINT signed
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
