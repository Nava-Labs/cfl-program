use crate::errors::CustomError;
use crate::state::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use anchor_lang::prelude::*;

pub fn finalize(ctx: Context<Finalize>, _match_id: u8, winner: Pubkey) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;

    match_account.finalize(winner);

    Ok(())
}

#[derive(Accounts)]
#[instruction(match_id: u8)]
pub struct Finalize<'info> {
    #[account(
        mut,
        seeds = [Match::SEED.as_bytes(), match_id.to_le_bytes().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
