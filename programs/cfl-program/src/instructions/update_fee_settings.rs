use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::state::Global;

pub fn update_fee_settings(
    ctx: Context<UpdateFeeSettings>,
    new_fee_in_bps: u64,
    fee_recipient: Pubkey,
) -> Result<()> {
    let global = &mut ctx.accounts.global;

    global.update_fee_settings(new_fee_in_bps, fee_recipient);

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateFeeSettings<'info> {
    #[account(
        mut,
        seeds = [Global::SEED.as_bytes()],
        bump,
    )]
    pub global: Box<Account<'info, Global>>,

    #[account(mut, constraint = user.key() == Pubkey::from_str("6Ps4s9TPf9vxMCQouX5oLHETj7rJjMPRyp7BXx6c1TM7").unwrap())]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
