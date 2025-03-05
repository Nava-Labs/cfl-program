use crate::errors::CustomError;
use crate::state::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use anchor_lang::prelude::*;

pub fn kickoff(ctx: Context<Kickoff>, room_id: u8) -> Result<()> {
    let room = &mut ctx.accounts.room;
    let guest = ctx.accounts.guest_squad.key();

    room.start(guest);

    Ok(())
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct Kickoff<'info> {
    /// CHECK:
    #[account(mut)]
    pub guest_squad: UncheckedAccount<'info>,

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
