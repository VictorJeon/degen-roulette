use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::DegenRouletteError;
use crate::state::{HouseConfig, HouseVault};

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
    house_config.max_bet_pct = 100; // 1%
    house_config.house_edge_bps = 200; // 2%
    house_config.paused = false;
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
