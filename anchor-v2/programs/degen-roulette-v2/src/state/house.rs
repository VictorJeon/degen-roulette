use anchor_lang::prelude::*;

#[account]
pub struct HouseConfig {
    pub authority: Pubkey,
    pub min_bet: u64,
    pub max_bet_pct: u16,
    pub house_edge_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

impl HouseConfig {
    pub const LEN: usize = 8 + 32 + 8 + 2 + 2 + 1 + 1;
    pub const SEEDS: &'static [u8] = b"house_config";
}

#[account]
pub struct HouseVault {}

impl HouseVault {
    pub const SEEDS: &'static [u8] = b"house_vault";
}
