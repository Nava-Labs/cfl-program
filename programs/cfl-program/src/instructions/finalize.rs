use crate::state::*;
use std::str::FromStr;

use anchor_lang::prelude::*;

pub fn finalize(ctx: Context<Finalize>, _match_id: u64, winner: Pubkey) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;

    match_account.finalize(winner);

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct Finalize<'info> {
    #[account(
        mut,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(mut, constraint = user.key() == Pubkey::from_str("6Ps4s9TPf9vxMCQouX5oLHETj7rJjMPRyp7BXx6c1TM7").unwrap())]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
