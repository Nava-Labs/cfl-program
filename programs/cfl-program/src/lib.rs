use anchor_lang::prelude::*;

declare_id!("D6Y6qVKNMTqzafrZfrUWshsbJWmR17b4jdChXruX7KtV");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod cfl_program {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn create_squad(
        ctx: Context<CreateSquad>,
        squad_index: u8,
        price_feed_ids: Vec<String>,
    ) -> Result<()> {
        instructions::create_squad(ctx, squad_index, price_feed_ids)
    }

    pub fn create_room(
        ctx: Context<CreateRoom>,
        room_id: u8,
        sol_bet_amount_in_lamports: u64,
        duration: u64,
    ) -> Result<()> {
        instructions::create_room(ctx, room_id, sol_bet_amount_in_lamports, duration)
    }

    pub fn kickoff(ctx: Context<Kickoff>, room_id: u8) -> Result<()> {
        instructions::kickoff(ctx, room_id)
    }

    pub fn finalize(ctx: Context<Finalize>, room_id: u8, winner: Pubkey) -> Result<()> {
        instructions::finalize(ctx, room_id, winner)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>, room_id: u8) -> Result<()> {
        instructions::claim_reward(ctx, room_id)
    }
}
