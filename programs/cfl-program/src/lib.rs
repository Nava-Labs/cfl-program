use anchor_lang::prelude::*;

declare_id!("7n6fiGdy4TKzj8RkPxByu4fVVyR9b57NTZwbL39XiW34");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod cfl_program {

    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        fee_in_bps: u64,
        fee_recipient: Pubkey,
    ) -> Result<()> {
        instructions::initialize(ctx, fee_in_bps, fee_recipient)
    }

    pub fn update_fee_settings(
        ctx: Context<UpdateFeeSettings>,
        new_fee_in_bps: u64,
        fee_recipient: Pubkey,
    ) -> Result<()> {
        instructions::update_fee_settings(ctx, new_fee_in_bps, fee_recipient)
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
