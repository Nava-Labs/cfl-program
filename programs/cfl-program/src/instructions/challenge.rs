use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::{prelude::*, system_program};

pub fn challenge(ctx: Context<Challenge>, _match_id: u64) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let profile = &mut ctx.accounts.user_profile;
    let match_account = &mut ctx.accounts.match_account;
    let challenger_squad_account = &mut ctx.accounts.challenger_squad;

    let mut challenger_squad_account_data: &[u8] = &challenger_squad_account.data.borrow();
    let challenger_squad_data: Squad =
        AccountDeserialize::try_deserialize(&mut challenger_squad_account_data)?;

    if challenger_squad_data.owner != user.key() {
        return err!(CustomError::InvalidSquadOwner);
    }

    if challenger_squad_data.owner == match_account.host_squad_owner {
        return err!(CustomError::SameSquadOwner);
    }

    let now = Clock::get().unwrap().unix_timestamp;

    if now > match_account.start_timestamp {
        return err!(CustomError::MatchExpired);
    }

    if match_account.challenger_squad != Pubkey::default() {
        return err!(CustomError::MatchStarted);
    }

    match_account.challenge(challenger_squad_account.key(), user.key());

    profile.add_total_sol_bet(match_account.sol_bet_amount);

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
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
