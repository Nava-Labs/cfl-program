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
    pub price_feed_ids: Vec<String>,
    pub bump: u8,
    pub squad_index: u8,
}

impl Squad {
    pub const SEED: &'static str = "Squad";

    pub const ACCOUNT_SIZE: usize = 8 + 32 + (4 + (32 * 10)) + 1 + 1;

    pub fn new(owner: Pubkey, price_feed_ids: Vec<String>, bump: u8, squad_index: u8) -> Self {
        Self {
            owner,
            price_feed_ids,
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
pub struct Room {
    pub room_id: u8,
    pub sol_bet_amount: u64,
    pub duration: u64,
    pub is_finished: bool,
    pub host: Pubkey,
    pub guest: Pubkey,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub winner: Pubkey,
    pub bump: u8,
}

impl Room {
    pub const SEED: &'static str = "Room";

    pub const ACCOUNT_SIZE: usize = 1 + 8 + 8 + 8 + 1 + 32 + 32 + 8 + 8 + 32 + 8;

    pub fn new(room_id: u8, sol_bet_amount: u64, duration: u64, host: Pubkey, bump: u8) -> Self {
        Self {
            room_id,
            sol_bet_amount,
            duration,
            is_finished: false,
            host,
            guest: Pubkey::default(),
            start_timestamp: 0,
            end_timestamp: 0,
            winner: Pubkey::default(),
            bump,
        }
    }

    pub fn start(&mut self, guest: Pubkey) {
        let duration = self.duration as i64;
        let now = Clock::get().unwrap().unix_timestamp;

        self.guest = guest;
        self.start_timestamp = now;
        self.end_timestamp = now + duration;
    }

    pub fn finalize(&mut self, winner: Pubkey) {
        self.is_finished = true;
        self.winner = winner;
    }
}
