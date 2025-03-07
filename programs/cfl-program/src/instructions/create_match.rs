use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::{prelude::*, system_program};

pub fn create_match(
    ctx: Context<CreateMatch>,
    match_id: u64,
    start_timestamp: i64,
    duration: i64,
    sol_bet_amount_in_lamports: u64,
    match_type: u8,
) -> Result<()> {
    let host_squad: &mut AccountInfo = &mut ctx.accounts.host_squad.to_account_info();
    let match_account = &mut ctx.accounts.match_account;
    let user = &mut ctx.accounts.user;

    match_account.set_inner(Match::new(
        match_id,
        host_squad.key(),
        user.key(),
        sol_bet_amount_in_lamports,
        duration,
        start_timestamp,
        match_account.bump,
        match_type,
    ));

    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: user.to_account_info(),
            to: match_account.to_account_info(),
        },
    );

    system_program::transfer(transfer_ctx, sol_bet_amount_in_lamports)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct CreateMatch<'info> {
    /// CHECK:
    #[account(mut)]
    pub host_squad: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        space = Match::ACCOUNT_SIZE,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
