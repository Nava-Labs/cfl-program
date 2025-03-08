use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Invalid squad index")]
    InvalidSquadIndex,

    #[msg("Invalid price feed length")]
    InvalidPriceFeedLength,

    #[msg("Invalid weight percentage")]
    InvalidWeightPercentageLength,

    #[msg("Invalid match id")]
    InvalidMatchId,

    #[msg("Invalid timestamp")]
    InvalidTimestamp,

    #[msg("Invalid duration")]
    InvalidDuration,

    #[msg("Invalid account")]
    InvalidAccount,

    #[msg("Invalid squad owner")]
    InvalidSquadOwner,

    #[msg("Invalid squad winner")]
    InvalidSquadWinner,

    #[msg("Match expired")]
    MatchExpired,

    #[msg("Match Started")]
    MatchStarted,
}
