use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::DegenRouletteError;
use crate::state::{GameState, GameStatus, HouseConfig, HouseVault};

#[derive(Accounts)]
pub struct InitGame<'info> {
    #[account(
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump
    )]
    pub house_config: Account<'info, HouseConfig>,

    #[account(
        mut,
        seeds = [HouseVault::SEEDS],
        bump
    )]
    pub house_vault: Account<'info, HouseVault>,

    #[account(
        init_if_needed,
        payer = player,
        space = GameState::LEN,
        seeds = [GameState::SEEDS, player.key().as_ref()],
        bump
    )]
    pub game: Account<'info, GameState>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn init_game(ctx: Context<InitGame>, bet_amount: u64) -> Result<()> {
    let house_config = &ctx.accounts.house_config;
    let game = &mut ctx.accounts.game;

    require!(!house_config.paused, DegenRouletteError::HousePaused);
    require!(bet_amount >= house_config.min_bet, DegenRouletteError::BetTooLow);

    let house_balance = ctx.accounts.house_vault.to_account_info().lamports();
    let max_bet = (house_balance as u128)
        .checked_mul(house_config.max_bet_pct as u128)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?
        .checked_div(10000)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?;
    let max_bet = u64::try_from(max_bet).map_err(|_| DegenRouletteError::ArithmeticOverflow)?;
    require!(bet_amount <= max_bet, DegenRouletteError::BetTooHigh);

    let max_payout = (bet_amount as u128)
        .checked_mul(GameState::MULTIPLIERS.last().unwrap().clone() as u128)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?;
    let max_payout = u64::try_from(max_payout).map_err(|_| DegenRouletteError::ArithmeticOverflow)?;
    require!(house_balance >= max_payout, DegenRouletteError::InsufficientHouseBalance);

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.player.to_account_info(),
            to: ctx.accounts.house_vault.to_account_info(),
        },
    );
    transfer(cpi_context, bet_amount)?;

    let clock = Clock::get()?;
    let bullet_position = (clock.unix_timestamp % GameState::CHAMBERS as i64) as u8;

    game.player = ctx.accounts.player.key();
    game.bet_amount = bet_amount;
    game.bullet_position = bullet_position;
    game.current_round = 0;
    game.status = GameStatus::Active;
    game.created_at = clock.unix_timestamp;
    game.bump = ctx.bumps.game;

    Ok(())
}

#[derive(Accounts)]
pub struct PullTrigger<'info> {
    #[account(
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump
    )]
    pub house_config: Account<'info, HouseConfig>,

    #[account(
        mut,
        seeds = [GameState::SEEDS, player.key().as_ref()],
        bump = game.bump,
        has_one = player
    )]
    pub game: Account<'info, GameState>,

    pub player: Signer<'info>,
}

pub fn pull_trigger(ctx: Context<PullTrigger>) -> Result<()> {
    let game = &mut ctx.accounts.game;

    require!(!ctx.accounts.house_config.paused, DegenRouletteError::HousePaused);
    require!(game.status == GameStatus::Active, DegenRouletteError::GameNotActive);

    game.current_round += 1;

    if game.current_round == game.bullet_position + 1 {
        game.status = GameStatus::Lost;
    } else if game.current_round >= GameState::CHAMBERS {
        game.status = GameStatus::Won;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CashOut<'info> {
    #[account(
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump
    )]
    pub house_config: Account<'info, HouseConfig>,

    #[account(
        mut,
        seeds = [HouseVault::SEEDS],
        bump
    )]
    pub house_vault: Account<'info, HouseVault>,

    #[account(
        mut,
        seeds = [GameState::SEEDS, player.key().as_ref()],
        bump = game.bump,
        has_one = player
    )]
    pub game: Account<'info, GameState>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn cash_out(ctx: Context<CashOut>) -> Result<()> {
    let game = &ctx.accounts.game;

    require!(!ctx.accounts.house_config.paused, DegenRouletteError::HousePaused);
    require!(game.status == GameStatus::Won, DegenRouletteError::GameNotWon);

    let payout = game.calculate_payout()?;

    **ctx.accounts.house_vault.to_account_info().try_borrow_mut_lamports()? -= payout;
    **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += payout;

    Ok(())
}
