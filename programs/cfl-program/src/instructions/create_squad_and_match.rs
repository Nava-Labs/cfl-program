use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::{prelude::*, system_program};

pub fn create_squad_and_match(
    ctx: Context<CreateSquadAndMatch>,
    squad_index: u8,
    match_id: u64,
    price_feed_ids: Vec<String>,
    allocations: [f64; 10],
    formation: u64,
    start_timestamp: u64,
    duration: u64,
    sol_bet_amount_in_lamports: u64,
    match_type: u8,
) -> Result<()> {
    let squad = &mut ctx.accounts.squad;
    let profile = &mut ctx.accounts.user_profile;
    let owner = ctx.accounts.user.key();
    let match_account = &mut ctx.accounts.match_account;
    let user = &mut ctx.accounts.user;
    let global = &mut ctx.accounts.global;

    if squad_index == 0 {
        return err!(CustomError::InvalidSquadIndex);
    }

    if match_id == 0 {
        return err!(CustomError::InvalidMatchId);
    }

    if price_feed_ids.len() != 10 {
        return err!(CustomError::InvalidPriceFeedLength);
    }

    if allocations.len() != 10 {
        return err!(CustomError::InvalidAllocationLength);
    }

    let now = Clock::get().unwrap().unix_timestamp as u64;

    if start_timestamp <= now {
        return err!(CustomError::InvalidTimestamp);
    }

    if duration == 0 {
        return err!(CustomError::InvalidDuration);
    }

    squad.set_inner(Squad::new(
        owner,
        price_feed_ids,
        allocations,
        squad.bump,
        squad_index,
        formation,
    ));

    profile.increment_squad_count();
    profile.add_total_sol_bet(sol_bet_amount_in_lamports);

    match_account.set_inner(Match::new(
        match_id,
        squad.key(),
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
#[instruction(squad_index: u8, match_id: u64)]
pub struct CreateSquadAndMatch<'info> {
    #[account(
        init,
        payer = user,
        space = Squad::ACCOUNT_SIZE,
        seeds = [Squad::SEED.as_bytes(), user.key().as_ref(), squad_index.to_le_bytes().as_ref()],
        bump
    )]
    pub squad: Account<'info, Squad>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserProfile::ACCOUNT_SIZE,
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

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
