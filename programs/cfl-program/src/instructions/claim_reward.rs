use crate::errors::CustomError;
use crate::state::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use anchor_lang::{
    prelude::*,
    system_program::{self, Transfer},
};

pub fn claim_reward(ctx: Context<ClaimReward>, room_id: u8) -> Result<()> {
    let room = &mut ctx.accounts.room;
    let user = &mut ctx.accounts.user;

    **room.to_account_info().try_borrow_mut_lamports()? -= room.sol_bet_amount;
    **user.try_borrow_mut_lamports()? += room.sol_bet_amount;

    Ok(())
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [Room::SEED.as_bytes(), room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub room: Account<'info, Room>,

    #[account(mut, constraint = user.key() == room.winner.key())]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
