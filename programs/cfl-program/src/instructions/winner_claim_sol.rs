use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn winner_claim_sol(ctx: Context<WinnerClaimSol>, _match_id: u64) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let global = &ctx.accounts.global;
    let user = &mut ctx.accounts.user;
    let fee_recipeint = &mut ctx.accounts.fee_recipient;
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

    match_account.update_claim_status();

    let account_rent = Rent::minimum_balance(rent, Match::ACCOUNT_SIZE);

    let total_sol = match_account
        .to_account_info()
        .lamports()
        .saturating_sub(account_rent);
    msg!("total_sol {}", total_sol);

    let fee = (global.fee_in_bps * total_sol) / 10000;
    msg!("fee {}", fee);

    let sol_to_withdraw = total_sol.saturating_sub(fee);
    msg!("sol_to_withdraw {}", sol_to_withdraw);

    **match_account.to_account_info().try_borrow_mut_lamports()? -= total_sol;

    **user.try_borrow_mut_lamports()? += sol_to_withdraw;

    **fee_recipeint.try_borrow_mut_lamports()? += fee;

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

    /// CHECK:
    #[account(
        mut,
        constraint = fee_recipient.key() == global.fee_recipient
    )]
    pub fee_recipient: UncheckedAccount<'info>,

    #[account(
        seeds = [Global::SEED.as_bytes()],
        bump,
    )]
    pub global: Account<'info, Global>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
