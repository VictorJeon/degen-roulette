use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_lang::solana_program::hash::hashv;
use crate::error::DegenRouletteError;
use crate::state::{GameState, GameStatus, HouseConfig, HouseVault, PlayerStats};

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        init_if_needed,
        payer = player,
        space = GameState::LEN,
        seeds = [GameState::SEEDS, player.key().as_ref()],
        bump
    )]
    pub game: Account<'info, GameState>,

    #[account(
        mut,
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
        space = PlayerStats::LEN,
        seeds = [PlayerStats::SEEDS, player.key().as_ref()],
        bump
    )]
    pub player_stats: Account<'info, PlayerStats>,

    /// CHECK: Orao VRF config (network state PDA)
    #[account(mut)]
    pub vrf_config: UncheckedAccount<'info>,

    /// CHECK: Orao VRF treasury
    #[account(mut)]
    pub vrf_treasury: UncheckedAccount<'info>,

    /// CHECK: Orao VRF randomness PDA
    #[account(mut)]
    pub random: UncheckedAccount<'info>,

    /// CHECK: Orao VRF program
    pub vrf: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn start_game(ctx: Context<StartGame>, bet_amount: u64) -> Result<()> {
    let house_config = &ctx.accounts.house_config;
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;

    // Validation
    require!(!house_config.paused, DegenRouletteError::HousePaused);
    require!(bet_amount >= house_config.min_bet, DegenRouletteError::BetTooLow);

    // Check if game is not already active
    require!(game.status != GameStatus::Active, DegenRouletteError::GameAlreadyActive);

    // Calculate max bet
    let house_balance = ctx.accounts.house_vault.to_account_info().lamports();
    let max_bet = (house_balance as u128)
        .checked_mul(house_config.max_bet_pct as u128)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?
        .checked_div(10000)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?;
    let max_bet = u64::try_from(max_bet).map_err(|_| DegenRouletteError::ArithmeticOverflow)?;
    require!(bet_amount <= max_bet, DegenRouletteError::BetTooHigh);

    // Check if house can cover max payout (5 rounds)
    let max_payout = (bet_amount as u128)
        .checked_mul(*GameState::MULTIPLIERS.last().unwrap() as u128)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(DegenRouletteError::ArithmeticOverflow)?;
    let max_payout = u64::try_from(max_payout).map_err(|_| DegenRouletteError::ArithmeticOverflow)?;
    require!(house_balance >= max_payout, DegenRouletteError::InsufficientHouseBalance);

    // Transfer bet amount to house vault
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.player.to_account_info(),
            to: ctx.accounts.house_vault.to_account_info(),
        },
    );
    transfer(cpi_context, bet_amount)?;

    // Generate VRF seed
    let player_key = ctx.accounts.player.key();
    let slot_bytes = clock.slot.to_le_bytes();
    let game_count_bytes = house_config.total_games.to_le_bytes();
    let seed_data: [&[u8]; 4] = [
        b"degen-roulette".as_ref(),
        player_key.as_ref(),
        slot_bytes.as_ref(),
        game_count_bytes.as_ref(),
    ];
    let seed_hash = hashv(&seed_data);
    let mut vrf_seed = [0u8; 32];
    vrf_seed.copy_from_slice(&seed_hash.to_bytes());

    // Ensure seed is non-zero
    if vrf_seed == [0u8; 32] {
        vrf_seed[0] = 1;
    }

    // Request VRF (if VRF program is executable, i.e., not localnet)
    if ctx.accounts.vrf.executable {
        let cpi_program = ctx.accounts.vrf.to_account_info();
        let cpi_accounts = orao_solana_vrf::cpi::accounts::RequestV2 {
            payer: ctx.accounts.player.to_account_info(),
            network_state: ctx.accounts.vrf_config.to_account_info(),
            treasury: ctx.accounts.vrf_treasury.to_account_info(),
            request: ctx.accounts.random.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        orao_solana_vrf::cpi::request_v2(
            CpiContext::new(cpi_program, cpi_accounts),
            vrf_seed,
        )?;
    }

    // Initialize GameState
    game.player = ctx.accounts.player.key();
    game.bet_amount = bet_amount;
    game.vrf_seed = vrf_seed;
    game.rounds_survived = 0;
    game.bullet_position = 0;
    game.status = GameStatus::Active;
    game.result_multiplier = 0;
    game.payout = 0;
    game.created_at = clock.unix_timestamp;
    game.settled_at = 0;
    game.bump = ctx.bumps.game;

    // Initialize PlayerStats if needed
    if ctx.accounts.player_stats.to_account_info().data_is_empty() {
        let player_stats = &mut ctx.accounts.player_stats;
        player_stats.player = ctx.accounts.player.key();
        player_stats.total_games = 0;
        player_stats.total_wagered = 0;
        player_stats.total_won = 0;
        player_stats.total_profit = 0;
        player_stats.best_streak = 0;
        player_stats.bump = ctx.bumps.player_stats;
    }

    // Emit event
    emit!(GameStarted {
        player: ctx.accounts.player.key(),
        bet_amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SettleGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [GameState::SEEDS, player.key().as_ref()],
        bump = game.bump,
        has_one = player
    )]
    pub game: Account<'info, GameState>,

    #[account(
        mut,
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
        seeds = [PlayerStats::SEEDS, player.key().as_ref()],
        bump = player_stats.bump
    )]
    pub player_stats: Account<'info, PlayerStats>,

    /// CHECK: Orao VRF randomness PDA
    pub random: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn settle_game(ctx: Context<SettleGame>, rounds_survived: u8) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let clock = Clock::get()?;

    // Validation
    require!(game.status == GameStatus::Active, DegenRouletteError::GameNotActive);
    require!(
        rounds_survived >= 1 && rounds_survived <= 5,
        DegenRouletteError::InvalidRoundsSurvived
    );

    // Get bullet position from VRF or fallback
    let bullet_position = if ctx.accounts.random.data_is_empty() {
        // Localnet fallback - deterministic randomness
        let player_key = ctx.accounts.player.key();
        let created_at_bytes = game.created_at.to_le_bytes();
        let seed_data: [&[u8]; 4] = [
            b"test-rng".as_ref(),
            player_key.as_ref(),
            created_at_bytes.as_ref(),
            &[rounds_survived],
        ];
        let hash = hashv(&seed_data);
        hash.to_bytes()[0] % GameState::CHAMBERS
    } else {
        // Orao VRF - read fulfilled randomness (RandomnessV2)
        let randomness_data = ctx.accounts.random.try_borrow_data()?;
        let mut data: &[u8] = &randomness_data;
        let randomness_account = orao_solana_vrf::state::RandomnessV2::try_deserialize(&mut data)?;

        let fulfilled = randomness_account
            .fulfilled()
            .ok_or(DegenRouletteError::VrfNotFulfilled)?;

        let randomness = fulfilled.randomness;
        randomness[0] % GameState::CHAMBERS
    };

    // Determine outcome
    let won = bullet_position >= rounds_survived;
    let payout = if won {
        let multiplier = GameState::MULTIPLIERS[(rounds_survived - 1) as usize];
        let payout = (game.bet_amount as u128)
            .checked_mul(multiplier as u128)
            .ok_or(DegenRouletteError::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(DegenRouletteError::ArithmeticOverflow)?;
        u64::try_from(payout).map_err(|_| DegenRouletteError::ArithmeticOverflow)?
    } else {
        0
    };

    // Transfer payout if won
    if won && payout > 0 {
        **ctx.accounts.house_vault.to_account_info().try_borrow_mut_lamports()? -= payout;
        **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += payout;
    }

    // Update GameState
    game.status = if won { GameStatus::Won } else { GameStatus::Lost };
    game.rounds_survived = rounds_survived;
    game.bullet_position = bullet_position;
    game.result_multiplier = if won {
        GameState::MULTIPLIERS[(rounds_survived - 1) as usize]
    } else {
        0
    };
    game.payout = payout;
    game.settled_at = clock.unix_timestamp;

    // Update PlayerStats
    let player_stats = &mut ctx.accounts.player_stats;
    player_stats.total_games = player_stats.total_games.checked_add(1).unwrap();
    player_stats.total_wagered = player_stats.total_wagered.checked_add(game.bet_amount).unwrap();
    player_stats.total_won = player_stats.total_won.checked_add(payout).unwrap();

    let profit_delta = (payout as i64).checked_sub(game.bet_amount as i64).unwrap();
    player_stats.total_profit = player_stats.total_profit.checked_add(profit_delta).unwrap();

    if won && rounds_survived > player_stats.best_streak {
        player_stats.best_streak = rounds_survived;
    }

    // Update HouseConfig
    let house_config = &mut ctx.accounts.house_config;
    house_config.total_games = house_config.total_games.checked_add(1).unwrap();
    house_config.total_volume = house_config.total_volume.checked_add(game.bet_amount).unwrap();

    // Emit event
    emit!(GameSettled {
        player: ctx.accounts.player.key(),
        bet_amount: game.bet_amount,
        rounds_survived,
        bullet_position,
        won,
        payout,
        multiplier: game.result_multiplier,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct GameStarted {
    pub player: Pubkey,
    pub bet_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct GameSettled {
    pub player: Pubkey,
    pub bet_amount: u64,
    pub rounds_survived: u8,
    pub bullet_position: u8,
    pub won: bool,
    pub payout: u64,
    pub multiplier: u16,
    pub timestamp: i64,
}
