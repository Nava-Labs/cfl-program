use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn challenge(ctx: Context<Challenge>, _match_id: u8) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let challenger = ctx.accounts.challenger_squad.key();

    match_account.start(challenger);

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u8)]
pub struct Challenge<'info> {
    /// CHECK:
    #[account(mut)]
    pub challenger_squad: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
