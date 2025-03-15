use anchor_lang::prelude::*;

declare_id!("2yCL5Cxy23F11BFEnUuQmZpx2eULi8k2yU7KGaTXuk6N");

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
        price_feed_ids: [Pubkey; 10],
        allocations: [f64; 10],
        formation: u64,
    ) -> Result<()> {
        instructions::create_squad(ctx, squad_index, price_feed_ids, allocations, formation)
    }

    pub fn create_match(
        ctx: Context<CreateMatch>,
        match_id: u64,
        start_timestamp: u64,
        duration: u64,
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

    pub fn finalize(
        ctx: Context<Finalize>,
        match_id: u64,
        winner: Pubkey,
        host_squad_mc_end: f64,
        challenger_squad_mc_end: f64,
    ) -> Result<()> {
        instructions::finalize(
            ctx,
            match_id,
            winner,
            host_squad_mc_end,
            challenger_squad_mc_end,
        )
    }

    pub fn winner_claim_sol(ctx: Context<WinnerClaimSol>, match_id: u64) -> Result<()> {
        instructions::winner_claim_sol(ctx, match_id)
    }

    pub fn host_claim_sol(ctx: Context<HostClaimSol>, match_id: u64) -> Result<()> {
        instructions::host_claim_sol(ctx, match_id)
    }
}
