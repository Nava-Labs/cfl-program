use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::{prelude::*, system_program};

pub fn challenge(ctx: Context<Challenge>, _match_id: u64) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let global = &mut ctx.accounts.global;
    let challenger_owner_profile = &mut ctx.accounts.challenger_owner_profile;
    let host_owner_profile = &mut ctx.accounts.host_owner_profile;
    let match_account = &mut ctx.accounts.match_account;
    let challenger_squad_account = &mut ctx.accounts.challenger_squad;
    let host_owner_season = &mut ctx.accounts.host_owner_season;
    let challenger_owner_season = &mut ctx.accounts.challenger_owner_season;

    let mut challenger_squad_account_data: &[u8] = &challenger_squad_account.data.borrow();
    let challenger_squad_data: Squad =
        AccountDeserialize::try_deserialize(&mut challenger_squad_account_data)?;

    if challenger_squad_data.owner != user.key() {
        return err!(CustomError::InvalidSquadOwner);
    }

    if challenger_squad_data.owner == match_account.host_squad_owner {
        return err!(CustomError::SameSquadOwner);
    }

    let now = Clock::get().unwrap().unix_timestamp as u64;

    if now > match_account.start_timestamp {
        return err!(CustomError::MatchExpired);
    }

    if match_account.challenger_squad != Pubkey::default() {
        return err!(CustomError::MatchStarted);
    }

    match_account.challenge(challenger_squad_account.key(), user.key());

    challenger_owner_profile.add_total_sol_bet(match_account.sol_bet_amount);
    host_owner_profile.add_total_sol_bet(match_account.sol_bet_amount);

    challenger_owner_season.update_user_in_season(
        user.key(),
        global.current_season,
        match_account.sol_bet_amount,
    );

    host_owner_season.update_user_in_season(
        match_account.host_squad_owner,
        global.current_season,
        match_account.sol_bet_amount,
    );

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
#[instruction(match_id: u64)]
pub struct Challenge<'info> {
    /// CHECK:
    #[account(mut, owner = crate::ID)]
    pub challenger_squad: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(
        mut,
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub challenger_owner_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [UserProfile::SEED.as_bytes(), match_account.host_squad_owner.key().as_ref()],
        bump
    )]
    pub host_owner_profile: Account<'info, UserProfile>,

    #[account(
        mut,
        seeds = [Global::SEED.as_bytes()],
        bump,
    )]
    pub global: Account<'info, Global>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserSeason::ACCOUNT_SIZE,
        seeds = [UserSeason::SEED.as_bytes(), match_account.host_squad_owner.key().as_ref(), global.current_season.to_le_bytes().as_ref()],
        bump
    )]
    pub host_owner_season: Account<'info, UserSeason>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserSeason::ACCOUNT_SIZE,
        seeds = [UserSeason::SEED.as_bytes(), user.key().as_ref(), global.current_season.to_le_bytes().as_ref()],
        bump
    )]
    pub challenger_owner_season: Account<'info, UserSeason>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
