use crate::errors::CustomError;
use crate::state::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use anchor_lang::prelude::*;

pub fn create_squad(
    ctx: Context<CreateSquad>,
    squad_index: u8,
    price_feed_ids: Vec<String>,
    weight_percentage: Vec<f64>,
) -> Result<()> {
    let squad = &mut ctx.accounts.squad;
    let profile = &mut ctx.accounts.user_profile;
    let owner = ctx.accounts.user.key();

    squad.set_inner(Squad::new(
        owner,
        price_feed_ids,
        weight_percentage,
        squad.bump,
        squad_index,
    ));
    profile.increment();

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
