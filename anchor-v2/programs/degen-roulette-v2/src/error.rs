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

    #[msg("Invalid game status")]
    InvalidGameStatus,

    #[msg("Invalid configuration parameter")]
    InvalidConfig,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Invalid rounds survived (must be 1-5)")]
    InvalidRoundsSurvived,

    #[msg("Server seed does not match committed hash")]
    InvalidServerSeed,

    #[msg("Game already settled")]
    GameAlreadySettled,

    #[msg("Game has not expired yet (1h timeout required)")]
    GameNotExpired,

    #[msg("Game already active")]
    GameAlreadyActive,
}
