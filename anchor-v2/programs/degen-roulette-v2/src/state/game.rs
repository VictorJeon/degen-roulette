use anchor_lang::prelude::*;
use crate::error::DegenRouletteError;

#[account]
pub struct GameState {
    pub player: Pubkey,
    pub bet_amount: u64,
    pub bullet_position: u8,
    pub current_round: u8,
    pub status: GameStatus,
    pub created_at: i64,
    pub bump: u8,
}

impl GameState {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 1 + 1 + 8 + 1;
    pub const SEEDS: &'static [u8] = b"game";
    pub const CHAMBERS: u8 = 6;
    pub const MULTIPLIERS: [u16; 5] = [115, 140, 190, 280, 550]; // basis points: 1.15x, 1.40x, 1.90x, 2.80x, 5.50x

    pub fn get_multiplier(&self) -> Result<u16> {
        if self.current_round == 0 || self.current_round > Self::CHAMBERS {
            return Err(DegenRouletteError::InvalidGameStatus.into());
        }
        let idx = (self.current_round - 1) as usize;
        if idx >= Self::MULTIPLIERS.len() {
            return Ok(*Self::MULTIPLIERS.last().unwrap());
        }
        Ok(Self::MULTIPLIERS[idx])
    }

    pub fn calculate_payout(&self) -> Result<u64> {
        let multiplier_bps = self.get_multiplier()?;
        let payout = (self.bet_amount as u128)
            .checked_mul(multiplier_bps as u128)
            .ok_or(DegenRouletteError::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(DegenRouletteError::ArithmeticOverflow)?;
        u64::try_from(payout).map_err(|_| DegenRouletteError::ArithmeticOverflow.into())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Idle,
    WaitingVrf,
    Active,
    Won,
    Lost,
}
