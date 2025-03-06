use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Invalid squad")]
    InvalidSquad,

    #[msg("Match expired")]
    MatchExpired,

    #[msg("Sol Claimed!")]
    SolClaimed,

    #[msg("Match Started")]
    MatchStarted,
}
