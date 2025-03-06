use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::{prelude::*, system_program};

pub fn challenge(ctx: Context<Challenge>, _match_id: u8) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let match_account = &mut ctx.accounts.match_account;
    let challenger = &mut ctx.accounts.challenger_squad;

    match_account.start(challenger.key());

    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: user.to_account_info(),
            to: match_account.to_account_info(),
        },
    );

    system_program::transfer(transfer_ctx, match_account.sol_bet_amount)?;

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
