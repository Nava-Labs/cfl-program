use anchor_lang::prelude::*;

declare_id!("3ajHeBXdbTVp57S9CXkATsktgSN5ngbcsa4dYGoM43UR");

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
        weight_percentage: Vec<f64>,
        position_index: Vec<i8>,
    ) -> Result<()> {
        instructions::create_squad(
            ctx,
            squad_index,
            price_feed_ids,
            weight_percentage,
            position_index,
        )
    }

    pub fn create_match(
        ctx: Context<CreateMatch>,
        match_id: u64,
        start_timestamp: i64,
        duration: i64,
        sol_bet_amount_in_lamports: u64,
        match_type: u8,
    ) -> Result<()> {
        instructions::create_match(
            ctx,
            match_id,
            start_timestamp,
            duration,
            sol_bet_amount_in_lamports,
            match_type,
        )
    }

    pub fn challenge(ctx: Context<Challenge>, match_id: u64) -> Result<()> {
        instructions::challenge(ctx, match_id)
    }

    pub fn finalize(ctx: Context<Finalize>, match_id: u64, winner: Pubkey) -> Result<()> {
        instructions::finalize(ctx, match_id, winner)
    }

    pub fn claim_sol(ctx: Context<ClaimSol>, match_id: u64) -> Result<()> {
        instructions::claim_sol(ctx, match_id)
    }
}
