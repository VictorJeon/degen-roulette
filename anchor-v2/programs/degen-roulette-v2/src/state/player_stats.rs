use anchor_lang::prelude::*;

#[account]
pub struct PlayerStats {
    pub player: Pubkey,
    pub total_games: u64,
    pub total_wagered: u64,
    pub total_won: u64,
    pub total_profit: i64,
    pub best_streak: u8,
    pub bump: u8,
}

impl PlayerStats {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 1 + 1;
    pub const SEEDS: &'static [u8] = b"player_stats";
}
