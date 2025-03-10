use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::{prelude::*, system_program};

pub fn create_squad_and_challenge(
    ctx: Context<CreateSquadAndChallenge>,
    squad_index: u8,
    _match_id: u64,
    price_feed_ids: Vec<String>,
    allocations: Vec<f64>,
    position_index: Vec<i8>,
) -> Result<()> {
    let squad = &mut ctx.accounts.squad;
    let profile = &mut ctx.accounts.user_profile;
    let owner = ctx.accounts.user.key();
    let user = &mut ctx.accounts.user;
    let match_account = &mut ctx.accounts.match_account;

    if squad_index == 0 {
        return err!(CustomError::InvalidSquadIndex);
    }

    if price_feed_ids.len() != 10 {
        return err!(CustomError::InvalidPriceFeedLength);
    }

    if allocations.len() != 10 {
        return err!(CustomError::InvalidAllocationLength);
    }

    if position_index.len() != 10 {
        return err!(CustomError::InvalidPositionIndexLength);
    }

    if owner == match_account.host_squad_owner {
        return err!(CustomError::SameSquadOwner);
    }

    let now = Clock::get().unwrap().unix_timestamp;

    if now > match_account.start_timestamp {
        return err!(CustomError::MatchExpired);
    }

    if match_account.challenger_squad != Pubkey::default() {
        return err!(CustomError::MatchStarted);
    }

    squad.set_inner(Squad::new(
        owner,
        price_feed_ids,
        allocations,
        position_index,
        squad.bump,
        squad_index,
    ));

    profile.increment_squad_count();

    profile.add_total_sol_bet(match_account.sol_bet_amount);

    match_account.challenge(squad.key(), user.key());

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
#[instruction(squad_index: u8, match_id: u64)]
pub struct CreateSquadAndChallenge<'info> {
    #[account(
        init,
        payer = user,
        space = Squad::ACCOUNT_SIZE,
        seeds = [Squad::SEED.as_bytes(), user.key().as_ref(), squad_index.to_le_bytes().as_ref()],
        bump
    )]
    pub squad: Account<'info, Squad>,

    #[account(
        mut,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserProfile::ACCOUNT_SIZE,
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
