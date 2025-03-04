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

#[account]
pub struct Squad {
    pub owner: Pubkey,
    pub mint1: Pubkey,
    pub mint2: Pubkey,
    pub bump: u8,
    pub squad_index: u8,
}

impl Squad {
    pub const SEED: &'static str = "Squad";

    pub const ACCOUNT_SIZE: usize = 8 + 32 + 32 + 32 + 1 + 1;

    pub fn new(owner: Pubkey, mint1: Pubkey, mint2: Pubkey, bump: u8, squad_index: u8) -> Self {
        Self {
            owner,
            mint1,
            mint2,
            bump,
            squad_index,
        }
    }
}

#[account]
pub struct UserProfile {
    pub squad_count: u8,
    pub bump: u8,
}

impl UserProfile {
    pub const SEED: &'static str = "Profile";

    pub const ACCOUNT_SIZE: usize = 8 + 1 + 1;

    pub fn increment(&mut self) {
        self.squad_count += 1;
    }
}
