use crate::errors::CustomError;
use crate::state::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use anchor_lang::prelude::*;

pub fn finalize(ctx: Context<Finalize>, room_id: u8, winner: Pubkey) -> Result<()> {
    let room = &mut ctx.accounts.room;

    room.finalize(winner);

    Ok(())
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct Finalize<'info> {
    #[account(
        mut,
        seeds = [Room::SEED.as_bytes(), room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub room: Account<'info, Room>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
