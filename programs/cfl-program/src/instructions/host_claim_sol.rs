use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn host_claim_sol(ctx: Context<HostClaimSol>, _match_id: u64) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let user = &mut ctx.accounts.user;
    let profile = &mut ctx.accounts.user_profile;
    let rent = &mut ctx.accounts.rent;

    let host_squad_account = &ctx.accounts.host_squad;
    let mut host_squad_account_data: &[u8] = &host_squad_account.data.borrow();
    let host_squad_data: Squad = AccountDeserialize::try_deserialize(&mut host_squad_account_data)?;

    if host_squad_data.owner != user.key() {
        return err!(CustomError::InvalidSquadOwner);
    }

    let now = Clock::get().unwrap().unix_timestamp as u64;

    if now < match_account.start_timestamp {
        return err!(CustomError::NotEligible);
    }

    let account_rent = Rent::minimum_balance(rent, Match::ACCOUNT_SIZE);

    let sol_to_withdraw = match_account.get_lamports() - account_rent;

    **match_account.to_account_info().try_borrow_mut_lamports()? -= sol_to_withdraw;
    **user.try_borrow_mut_lamports()? += sol_to_withdraw;

    profile.add_total_sol_bet(sol_to_withdraw);

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct HostClaimSol<'info> {
    #[account(
        mut,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    /// CHECK:
    #[account(mut, owner =  crate::ID)]
    pub host_squad: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
