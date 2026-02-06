use anchor_lang::prelude::*;

declare_id!("DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7");

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

    // Game instructions
    pub fn init_game(ctx: Context<InitGame>, bet_amount: u64) -> Result<()> {
        instructions::game::init_game(ctx, bet_amount)
    }

    pub fn pull_trigger(ctx: Context<PullTrigger>) -> Result<()> {
        instructions::game::pull_trigger(ctx)
    }

    pub fn cash_out(ctx: Context<CashOut>) -> Result<()> {
        instructions::game::cash_out(ctx)
    }
}
