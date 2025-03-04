use anchor_lang::prelude::*;

#[account]
pub struct Global {
    pub creator: Pubkey,
}

impl Global {
    pub const SEED: &'static str = "Global";

    // Discriminator (8) + creator (32)
    pub const ACCOUNT_SIZE: usize = 8 + 32;

    pub fn new(creator: Pubkey) -> Self {
        Self { creator }
    }
}
