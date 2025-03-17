use crate::state::*;

use anchor_lang::prelude::*;

pub fn initialize(ctx: Context<Initialize>, fee_in_bps: u64, fee_recipient: Pubkey) -> Result<()> {
    let global = &mut ctx.accounts.global;
    global.set_inner(Global::new(fee_in_bps, fee_recipient));

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        space = Global::ACCOUNT_SIZE,
        payer = user,
        seeds = [Global::SEED.as_bytes()],
        bump,
    )]
    pub global: Account<'info, Global>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
