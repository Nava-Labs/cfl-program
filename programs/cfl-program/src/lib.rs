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
        mint1: Pubkey,
        mint2: Pubkey,
    ) -> Result<()> {
        instructions::create_squad(ctx, squad_index, mint1, mint2)
    }
}
