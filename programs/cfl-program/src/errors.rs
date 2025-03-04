use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Invalid amount to swap")]
    InvalidAmount,

    #[msg("Token amount is too big to sell")]
    TokenAmountToSellTooBig,

    #[msg("SOL is not enough in vault")]
    NotEnoughSolInVault,

    #[msg("Token is not enough in vault")]
    NotEnoughTokenInVault,

    #[msg("Slippage error")]
    InvalidSlippage,

    #[msg("Out of bonding curve range")]
    OutOfBondingCurveRange,
}
