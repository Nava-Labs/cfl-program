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
    let match_account = &mut ctx.accounts.match_account;
    let user = &mut ctx.accounts.user;
    let global = &mut ctx.accounts.global;

    let host_squad_account = &ctx.accounts.host_squad;
    let mut host_squad_account_data: &[u8] = &host_squad_account.data.borrow();
    let host_squad_data: Squad = AccountDeserialize::try_deserialize(&mut host_squad_account_data)?;

    if host_squad_data.owner != user.key() {
        return err!(CustomError::InvalidSquadOwner);
    }

    if match_id == 0 {
        return err!(CustomError::InvalidMatchId);
    }

    let now = Clock::get().unwrap().unix_timestamp;

    if start_timestamp <= now {
        return err!(CustomError::InvalidTimestamp);
    }

    if duration == 0 {
        return err!(CustomError::InvalidDuration);
    }

    match_account.set_inner(Match::new(
        match_id,
        host_squad_account.key(),
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

    global.increment();

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct CreateMatch<'info> {
    /// CHECK:
    #[account(mut, owner =  crate::ID)]
    pub host_squad: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        space = Match::ACCOUNT_SIZE,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        mut,
        seeds = [Global::SEED.as_bytes()],
        bump,
    )]
    pub global: Account<'info, Global>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
