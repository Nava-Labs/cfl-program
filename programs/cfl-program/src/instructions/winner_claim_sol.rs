use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn winner_claim_sol(ctx: Context<WinnerClaimSol>, _match_id: u64) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let user = &mut ctx.accounts.user;
    let rent = &mut ctx.accounts.rent;

    let squad_winner_account = &ctx.accounts.squad_winner;
    let mut squad_winner_account_data: &[u8] = &squad_winner_account.data.borrow();
    let squad_winner_data: Squad =
        AccountDeserialize::try_deserialize(&mut squad_winner_account_data)?;

    if squad_winner_data.owner != user.key() {
        return err!(CustomError::InvalidSquadOwner);
    }

    if squad_winner_account.key() != match_account.winner {
        return err!(CustomError::InvalidSquadWinner);
    }

    let account_rent = Rent::minimum_balance(rent, Match::ACCOUNT_SIZE);

    let sol_to_withdraw = match_account.get_lamports() - account_rent;

    **match_account.to_account_info().try_borrow_mut_lamports()? -= sol_to_withdraw;
    **user.try_borrow_mut_lamports()? += sol_to_withdraw;

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct WinnerClaimSol<'info> {
    #[account(
        mut,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    /// CHECK:
    #[account(mut, owner =  crate::ID)]
    pub squad_winner: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
