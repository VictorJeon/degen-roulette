use anchor_lang::prelude::*;

declare_id!("BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz");

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod degen_roulette_v2 {
    use super::*;

    // Admin instructions
    pub fn initialize_house(ctx: Context<InitializeHouse>) -> Result<()> {
        instructions::admin::initialize_house(ctx)
    }

    pub fn fund_house(ctx: Context<FundHouse>, amount: u64) -> Result<()> {
        instructions::admin::fund_house(ctx, amount)
    }

    pub fn withdraw_house(ctx: Context<WithdrawHouse>, amount: u64) -> Result<()> {
        instructions::admin::withdraw_house(ctx, amount)
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        min_bet: Option<u64>,
        max_bet_pct: Option<u16>,
        house_edge_bps: Option<u16>,
    ) -> Result<()> {
        instructions::admin::update_config(ctx, min_bet, max_bet_pct, house_edge_bps)
    }

    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::admin::pause(ctx)
    }

    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::admin::unpause(ctx)
    }

    pub fn force_settle(ctx: Context<ForceSettle>) -> Result<()> {
        instructions::admin::force_settle(ctx)
    }

    // Game instructions
    pub fn start_game(ctx: Context<StartGame>, bet_amount: u64, vrf_seed: [u8; 32]) -> Result<()> {
        instructions::game::start_game(ctx, bet_amount, vrf_seed)
    }

    pub fn settle_game(ctx: Context<SettleGame>, rounds_survived: u8) -> Result<()> {
        instructions::game::settle_game(ctx, rounds_survived)
    }
}
