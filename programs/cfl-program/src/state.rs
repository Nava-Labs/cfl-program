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
    pub token_price_feed_ids: Vec<String>,
    pub token_weight: Vec<f64>,
    pub bump: u8,
    pub squad_index: u8,
}

impl Squad {
    pub const SEED: &'static str = "Squad";

    pub const ACCOUNT_SIZE: usize = 8 + 32 + (4 + (32 * 10)) + (4 + (8 * 10)) + 1 + 1;

    pub fn new(
        owner: Pubkey,
        token_price_feed_ids: Vec<String>,
        token_weight: Vec<f64>,
        bump: u8,
        squad_index: u8,
    ) -> Self {
        Self {
            owner,
            token_price_feed_ids,
            token_weight,
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

#[account]
pub struct Match {
    pub match_id: u8,
    pub sol_bet_amount: u64,
    pub duration: i64,
    pub is_finished: bool,
    pub host: Pubkey,
    pub challenger: Pubkey,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub winner: Pubkey,
    pub bump: u8,
}

impl Match {
    pub const SEED: &'static str = "Match";

    pub const ACCOUNT_SIZE: usize = 1 + 8 + 8 + 8 + 1 + 32 + 32 + 8 + 8 + 32 + 8;

    pub fn new(
        match_id: u8,
        sol_bet_amount: u64,
        start_timestamp: i64,
        duration: i64,
        host: Pubkey,
        bump: u8,
    ) -> Self {
        Self {
            match_id,
            sol_bet_amount,
            duration,
            is_finished: false,
            host,
            challenger: Pubkey::default(),
            start_timestamp,
            end_timestamp: start_timestamp + duration,
            winner: Pubkey::default(),
            bump,
        }
    }

    pub fn start(&mut self, challeger: Pubkey) {
        // let duration = self.duration as i64;
        // let now = Clock::get().unwrap().unix_timestamp;

        self.challenger = challeger;
    }

    pub fn finalize(&mut self, winner: Pubkey) {
        self.is_finished = true;
        self.winner = winner;
    }
}
