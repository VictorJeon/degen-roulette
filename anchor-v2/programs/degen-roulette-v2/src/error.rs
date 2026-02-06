use anchor_lang::prelude::*;

#[error_code]
pub enum DegenRouletteError {
    #[msg("House is currently paused")]
    HousePaused,

    #[msg("Bet amount below minimum")]
    BetTooLow,

    #[msg("Bet amount exceeds maximum (percentage of house vault)")]
    BetTooHigh,

    #[msg("Insufficient house vault balance")]
    InsufficientHouseBalance,

    #[msg("Game is not active")]
    GameNotActive,

    #[msg("Game is not won")]
    GameNotWon,

    #[msg("Invalid game status")]
    InvalidGameStatus,

    #[msg("Invalid configuration parameter")]
    InvalidConfig,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
