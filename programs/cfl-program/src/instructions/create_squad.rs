use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

pub fn create_squad(
    ctx: Context<CreateSquad>,
    squad_index: u8,
    price_feed_ids: Vec<String>,
    allocations: Vec<f64>,
    position_index: Vec<i8>,
) -> Result<()> {
    let squad = &mut ctx.accounts.squad;
    let profile = &mut ctx.accounts.user_profile;
    let owner = ctx.accounts.user.key();

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

    squad.set_inner(Squad::new(
        owner,
        price_feed_ids,
        allocations,
        position_index,
        squad.bump,
        squad_index,
    ));

    profile.set_inner(UserProfile::new(owner, profile.bump));

    profile.increment_squad_count();

    Ok(())
}

#[derive(Accounts)]
#[instruction(squad_index: u8)]
pub struct CreateSquad<'info> {
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

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
