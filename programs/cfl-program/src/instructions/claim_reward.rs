use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn claim_sol(ctx: Context<ClaimSol>, _match_id: u8) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let user = &mut ctx.accounts.user;

    **match_account.to_account_info().try_borrow_mut_lamports()? -= match_account.sol_bet_amount;
    **user.try_borrow_mut_lamports()? += match_account.sol_bet_amount;

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u8)]
pub struct ClaimSol<'info> {
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
