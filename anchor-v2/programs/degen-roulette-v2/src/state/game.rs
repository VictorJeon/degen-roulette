use anchor_lang::prelude::*;

#[account]
pub struct GameState {
    pub player: Pubkey,
    pub bet_amount: u64,
    pub vrf_seed: [u8; 32],
    pub rounds_survived: u8,
    pub bullet_position: u8,
    pub status: GameStatus,
    pub result_multiplier: u16,
    pub payout: u64,
    pub created_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

impl GameState {
    pub const LEN: usize = 8 + 32 + 8 + 32 + 1 + 1 + 1 + 2 + 8 + 8 + 8 + 1;
    pub const SEEDS: &'static [u8] = b"game";
    pub const CHAMBERS: u8 = 6;
    pub const MULTIPLIERS: [u16; 5] = [116, 145, 194, 291, 582]; // basis points: 1.16x, 1.45x, 1.94x, 2.91x, 5.82x (3% house edge)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Default)]
pub enum GameStatus {
    #[default]
    Idle,
    Active,
    Won,
    Lost,
}
