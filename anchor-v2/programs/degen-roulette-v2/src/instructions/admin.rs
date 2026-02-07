use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::DegenRouletteError;
use crate::state::{GameState, GameStatus, HouseConfig, HouseVault, PlayerStats};

#[derive(Accounts)]
pub struct InitializeHouse<'info> {
    #[account(
        init,
        payer = authority,
        space = HouseConfig::LEN,
        seeds = [HouseConfig::SEEDS],
        bump
    )]
    pub house_config: Account<'info, HouseConfig>,

    #[account(
        init,
        payer = authority,
        space = 8,
        seeds = [HouseVault::SEEDS],
        bump
    )]
    pub house_vault: Account<'info, HouseVault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_house(ctx: Context<InitializeHouse>) -> Result<()> {
    let house_config = &mut ctx.accounts.house_config;
    house_config.authority = ctx.accounts.authority.key();
    house_config.min_bet = 10_000_000; // 0.01 SOL
    house_config.max_bet_pct = 1000; // 10%
    house_config.house_edge_bps = 300; // 3%
    house_config.paused = false;
    house_config.total_games = 0;
    house_config.total_volume = 0;
    house_config.bump = ctx.bumps.house_config;
    Ok(())
}

#[derive(Accounts)]
pub struct FundHouse<'info> {
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

    #[account(mut)]
    pub funder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn fund_house(ctx: Context<FundHouse>, amount: u64) -> Result<()> {
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.funder.to_account_info(),
            to: ctx.accounts.house_vault.to_account_info(),
        },
    );
    transfer(cpi_context, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawHouse<'info> {
    #[account(
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump,
        has_one = authority
    )]
    pub house_config: Account<'info, HouseConfig>,

    #[account(
        mut,
        seeds = [HouseVault::SEEDS],
        bump
    )]
    pub house_vault: Account<'info, HouseVault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub recipient: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn withdraw_house(ctx: Context<WithdrawHouse>, amount: u64) -> Result<()> {
    **ctx.accounts.house_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump,
        has_one = authority
    )]
    pub house_config: Account<'info, HouseConfig>,

    pub authority: Signer<'info>,
}

pub fn update_config(
    ctx: Context<UpdateConfig>,
    min_bet: Option<u64>,
    max_bet_pct: Option<u16>,
    house_edge_bps: Option<u16>,
) -> Result<()> {
    let house_config = &mut ctx.accounts.house_config;

    if let Some(min_bet) = min_bet {
        house_config.min_bet = min_bet;
    }

    if let Some(max_bet_pct) = max_bet_pct {
        require!(max_bet_pct <= 10000, DegenRouletteError::InvalidConfig);
        house_config.max_bet_pct = max_bet_pct;
    }

    if let Some(house_edge_bps) = house_edge_bps {
        require!(house_edge_bps <= 10000, DegenRouletteError::InvalidConfig);
        house_config.house_edge_bps = house_edge_bps;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(
        mut,
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump,
        has_one = authority
    )]
    pub house_config: Account<'info, HouseConfig>,

    pub authority: Signer<'info>,
}

pub fn pause(ctx: Context<Pause>) -> Result<()> {
    ctx.accounts.house_config.paused = true;
    Ok(())
}

#[derive(Accounts)]
pub struct Unpause<'info> {
    #[account(
        mut,
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump,
        has_one = authority
    )]
    pub house_config: Account<'info, HouseConfig>,

    pub authority: Signer<'info>,
}

pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
    ctx.accounts.house_config.paused = false;
    Ok(())
}

#[derive(Accounts)]
pub struct ForceSettle<'info> {
    #[account(
        seeds = [HouseConfig::SEEDS],
        bump = house_config.bump,
        has_one = authority
    )]
    pub house_config: Account<'info, HouseConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [GameState::SEEDS, player.key().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, GameState>,

    /// CHECK: Player account (not signer)
    pub player: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [PlayerStats::SEEDS, player.key().as_ref()],
        bump = player_stats.bump
    )]
    pub player_stats: Account<'info, PlayerStats>,
}

pub fn force_settle(ctx: Context<ForceSettle>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;

    require!(game.status == GameStatus::Active, DegenRouletteError::GameNotActive);
    require!(
        clock.unix_timestamp - game.created_at >= 86400,
        DegenRouletteError::GameExpired
    );

    // Force loss with rounds_survived = 0
    game.status = GameStatus::Lost;
    game.rounds_survived = 0;
    game.bullet_position = 0;
    game.result_multiplier = 0;
    game.payout = 0;
    game.settled_at = clock.unix_timestamp;

    // Update PlayerStats
    let player_stats = &mut ctx.accounts.player_stats;
    player_stats.total_games = player_stats.total_games.checked_add(1).unwrap();
    player_stats.total_wagered = player_stats.total_wagered.checked_add(game.bet_amount).unwrap();
    player_stats.total_profit = player_stats.total_profit.checked_sub(game.bet_amount as i64).unwrap();

    // Update HouseConfig
    let house_config = &mut ctx.accounts.house_config;
    house_config.total_games = house_config.total_games.checked_add(1).unwrap();
    house_config.total_volume = house_config.total_volume.checked_add(game.bet_amount).unwrap();

    Ok(())
}
