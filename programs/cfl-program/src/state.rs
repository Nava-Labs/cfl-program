use anchor_lang::prelude::*;

#[account]
pub struct Global {
    pub match_count: u64,
}

impl Global {
    pub const SEED: &'static str = "Global";

    pub const ACCOUNT_SIZE: usize = 8 + 8;

    pub fn new() -> Self {
        Self { match_count: 0 }
    }

    pub fn increment(&mut self) {
        self.match_count += 1
    }
}

#[account]
#[derive(InitSpace)]
pub struct Squad {
    pub owner: Pubkey,
    #[max_len(10, 66)]
    pub token_price_feed_ids: Vec<String>,
    #[max_len(10)]
    pub token_weight: Vec<f64>,
    #[max_len(10)]
    pub position_index: Vec<i8>,
    pub bump: u8,
    pub squad_index: u8,
}

impl Squad {
    pub const SEED: &'static str = "Squad";

    pub const ACCOUNT_SIZE: usize = 8 + Squad::INIT_SPACE;

    pub fn new(
        owner: Pubkey,
        token_price_feed_ids: Vec<String>,
        token_weight: Vec<f64>,
        position_index: Vec<i8>,
        bump: u8,
        squad_index: u8,
    ) -> Self {
        Self {
            owner,
            token_price_feed_ids,
            token_weight,
            position_index,
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
    pub match_id: u64,
    pub host_squad: Pubkey,
    pub challenger_squad: Pubkey,
    pub host_squad_owner: Pubkey,
    pub challenger_squad_owner: Pubkey,
    pub sol_bet_amount: u64,
    pub duration: i64,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub is_finished: bool,
    pub winner: Pubkey,
    pub bump: u8,
    pub match_type: u8,
}

impl Match {
    pub const SEED: &'static str = "Match";

    pub const ACCOUNT_SIZE: usize = 8 + 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 32 + 1 + 1;

    pub fn new(
        match_id: u64,
        host_squad: Pubkey,
        host_squad_owner: Pubkey,
        sol_bet_amount: u64,
        duration: i64,
        start_timestamp: i64,
        bump: u8,
        match_type: u8,
    ) -> Self {
        Self {
            match_id,
            host_squad,
            challenger_squad: Pubkey::default(),
            host_squad_owner,
            challenger_squad_owner: Pubkey::default(),
            sol_bet_amount,
            duration,
            start_timestamp,
            end_timestamp: start_timestamp + duration,
            is_finished: false,
            winner: Pubkey::default(),
            bump,
            match_type,
        }
    }

    pub fn challenge(&mut self, challeger_squad: Pubkey, challenger_squad_owner: Pubkey) {
        self.challenger_squad = challeger_squad;
        self.challenger_squad_owner = challenger_squad_owner;
    }

    pub fn finalize(&mut self, winner: Pubkey) {
        self.is_finished = true;
        self.winner = winner;
    }
}
