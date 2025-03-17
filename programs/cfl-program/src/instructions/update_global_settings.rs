use std::str::FromStr;

use anchor_lang::prelude::*;

use crate::state::Global;

pub fn update_global_settings(
    ctx: Context<UpdateGlobalSettings>,
    new_fee_in_bps: u64,
    fee_recipient: Pubkey,
    season: u8,
) -> Result<()> {
    let global = &mut ctx.accounts.global;

    global.update_global_settings(new_fee_in_bps, fee_recipient, season);

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateGlobalSettings<'info> {
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
