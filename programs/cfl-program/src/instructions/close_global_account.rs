use crate::state::*;

use anchor_lang::prelude::*;

pub fn close_global_account(ctx: Context<CloseGlobalAccount>) -> Result<()> {
    // The account will be closed and lamports returned to the receiver
    Ok(())
}

#[derive(Accounts)]
pub struct CloseGlobalAccount<'info> {
    #[account(mut, close = receiver)]
    pub global: Account<'info, Global>,

    #[account(mut)]
    pub receiver: Signer<'info>,
}
