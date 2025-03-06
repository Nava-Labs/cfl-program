use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn claim_sol(ctx: Context<ClaimSol>, _match_id: u8) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let user = &mut ctx.accounts.user;
    let rent = &mut ctx.accounts.rent;

    let account_rent = Rent::minimum_balance(rent, Match::ACCOUNT_SIZE);

    let sol_to_withdraw = match_account.get_lamports() - account_rent;

    **match_account.to_account_info().try_borrow_mut_lamports()? -= sol_to_withdraw;
    **user.try_borrow_mut_lamports()? += sol_to_withdraw;

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
    pub rent: Sysvar<'info, Rent>,
}
