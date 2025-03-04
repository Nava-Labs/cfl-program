use anchor_lang::prelude::*;

declare_id!("D6Y6qVKNMTqzafrZfrUWshsbJWmR17b4jdChXruX7KtV");
pub mod instructions;
use instructions::*;
pub mod errors;
pub mod state;

#[program]
pub mod cfl_program {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn create_team(ctx: Context<CreateTeam>, feed_id: String) -> Result<()> {
        instructions::create_team(ctx, feed_id)
    }
}
