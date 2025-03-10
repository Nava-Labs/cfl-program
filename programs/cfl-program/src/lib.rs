use anchor_lang::prelude::*;

declare_id!("EJVRwfiTuahYBgaxXXCj1DRcYFKF7mQJt15Ax2Jjmzhf");

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
        allocations: Vec<f64>,
        position_index: Vec<i8>,
    ) -> Result<()> {
        instructions::create_squad(
            ctx,
            squad_index,
            price_feed_ids,
            allocations,
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

    pub fn create_squad_and_match(
        ctx: Context<CreateSquadAndMatch>,
        squad_index: u8,
        match_id: u64,
        price_feed_ids: Vec<String>,
        allocations: Vec<f64>,
        position_index: Vec<i8>,
        start_timestamp: i64,
        duration: i64,
        sol_bet_amount_in_lamports: u64,
        match_type: u8,
    ) -> Result<()> {
        instructions::create_squad_and_match(
            ctx,
            squad_index,
            match_id,
            price_feed_ids,
            allocations,
            position_index,
            start_timestamp,
            duration,
            sol_bet_amount_in_lamports,
            match_type,
        )
    }

    pub fn create_squad_and_challenge(
        ctx: Context<CreateSquadAndChallenge>,
        squad_index: u8,
        match_id: u64,
        price_feed_ids: Vec<String>,
        allocations: Vec<f64>,
        position_index: Vec<i8>,
    ) -> Result<()> {
        instructions::create_squad_and_challenge(
            ctx,
            squad_index,
            match_id,
            price_feed_ids,
            allocations,
            position_index,
        )
    }

    pub fn challenge(ctx: Context<Challenge>, match_id: u64) -> Result<()> {
        instructions::challenge(ctx, match_id)
    }

    pub fn finalize(ctx: Context<Finalize>, match_id: u64, winner: Pubkey) -> Result<()> {
        instructions::finalize(ctx, match_id, winner)
    }

    pub fn winner_claim_sol(ctx: Context<WinnerClaimSol>, match_id: u64) -> Result<()> {
        instructions::winner_claim_sol(ctx, match_id)
    }

    pub fn host_claim_sol(ctx: Context<HostClaimSol>, match_id: u64) -> Result<()> {
        instructions::host_claim_sol(ctx, match_id)
    }
}
