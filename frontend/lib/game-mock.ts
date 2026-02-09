/**
 * In-memory mock for game state when POSTGRES_URL is not available (E2E tests)
 */

export interface GameRow {
  id: number;
  player_wallet: string;
  bet_amount: number;
  server_seed: string;
  seed_hash: string;
  status: 'pending' | 'started' | 'won' | 'lost';
  current_round: number;
  rounds_survived?: number;
  bullet_position?: number;
  won?: boolean;
  payout?: number;
  start_tx?: string;
  settle_tx?: string;
  created_at: Date;
  settled_at?: Date;
  updated_at?: Date;
}

class InMemoryGameStore {
  private games: Map<number, GameRow> = new Map();
  private nextId = 1;

  createGame(data: {
    playerWallet: string;
    serverSeed: string;
    seedHash: string;
    status: 'pending' | 'started';
    currentRound?: number;
    betAmount?: number;
  }): GameRow {
    const game: GameRow = {
      id: this.nextId++,
      player_wallet: data.playerWallet,
      bet_amount: data.betAmount || 0,
      server_seed: data.serverSeed,
      seed_hash: data.seedHash,
      status: data.status,
      current_round: data.currentRound || 0,
      created_at: new Date(),
    };
    this.games.set(game.id, game);
    return game;
  }

  getGame(id: number): GameRow | null {
    return this.games.get(id) || null;
  }

  getActiveGame(playerWallet: string): GameRow | null {
    // Find most recent 'started' game within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeGames = Array.from(this.games.values())
      .filter(
        (g) =>
          g.player_wallet === playerWallet &&
          g.status === 'started' &&
          g.created_at > fiveMinutesAgo
      )
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return activeGames[0] || null;
  }

  getPendingGames(playerWallet: string): GameRow[] {
    return Array.from(this.games.values()).filter(
      (g) => g.player_wallet === playerWallet && g.status === 'pending'
    );
  }

  getOldStartedGames(playerWallet: string): GameRow[] {
    // Games older than 5 minutes in 'started' status
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return Array.from(this.games.values()).filter(
      (g) =>
        g.player_wallet === playerWallet &&
        g.status === 'started' &&
        g.created_at <= fiveMinutesAgo
    );
  }

  updateGame(id: number, updates: Partial<GameRow>): GameRow | null {
    const game = this.games.get(id);
    if (!game) return null;

    const updated = { ...game, ...updates, updated_at: new Date() };
    this.games.set(id, updated);
    return updated;
  }

  deleteGame(id: number): boolean {
    return this.games.delete(id);
  }

  deletePendingGames(playerWallet: string): number {
    const pending = this.getPendingGames(playerWallet);
    pending.forEach((g) => this.games.delete(g.id));
    return pending.length;
  }

  updateOldStartedGamesToLost(playerWallet: string): number {
    const oldGames = this.getOldStartedGames(playerWallet);
    oldGames.forEach((g) => {
      this.updateGame(g.id, { status: 'lost', updated_at: new Date() });
    });
    return oldGames.length;
  }

  // For testing: clear all data
  clear(): void {
    this.games.clear();
    this.nextId = 1;
  }
}

// Singleton instance
const store = new InMemoryGameStore();

export const gameMock = {
  createGame: (data: Parameters<typeof store.createGame>[0]) => store.createGame(data),
  getGame: (id: number) => store.getGame(id),
  getActiveGame: (playerWallet: string) => store.getActiveGame(playerWallet),
  getPendingGames: (playerWallet: string) => store.getPendingGames(playerWallet),
  getOldStartedGames: (playerWallet: string) => store.getOldStartedGames(playerWallet),
  updateGame: (id: number, updates: Partial<GameRow>) => store.updateGame(id, updates),
  deleteGame: (id: number) => store.deleteGame(id),
  deletePendingGames: (playerWallet: string) => store.deletePendingGames(playerWallet),
  updateOldStartedGamesToLost: (playerWallet: string) =>
    store.updateOldStartedGamesToLost(playerWallet),
  clear: () => store.clear(),
};
