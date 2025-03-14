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
    pub squad_index: u8,
    #[max_len(10, 66)]
    pub token_price_feed_ids: Vec<String>,
    #[max_len(10)]
    pub allocations: [f64; 10],
    pub formation: u64,
    pub bump: u8,
}

impl Squad {
    pub const SEED: &'static str = "Squad";

    pub const ACCOUNT_SIZE: usize = 8 + Squad::INIT_SPACE;

    pub fn new(
        owner: Pubkey,
        squad_index: u8,
        token_price_feed_ids: Vec<String>,
        allocations: [f64; 10],
        formation: u64,
        bump: u8,
    ) -> Self {
        Self {
            owner,
            token_price_feed_ids,
            allocations,
            bump,
            squad_index,
            formation,
        }
    }
}

#[account]
pub struct UserProfile {
    pub user: Pubkey,
    pub squad_count: u8,
    pub total_sol_bet: u64,
}

impl UserProfile {
    pub const SEED: &'static str = "Profile";

    pub const ACCOUNT_SIZE: usize = 8 + 32 + 1 + 8;

    pub fn increment_squad_count(&mut self) {
        self.squad_count += 1;
    }

    pub fn add_total_sol_bet(&mut self, sol_amount: u64) {
        self.total_sol_bet += sol_amount;
    }

    pub fn substract_total_sol_bet(&mut self, sol_amount: u64) {
        self.total_sol_bet -= sol_amount;
    }
}

#[account]
pub struct Match {
    pub match_id: u64,
    pub match_type: u8,
    pub host_squad: Pubkey,
    pub challenger_squad: Pubkey,
    pub host_squad_owner: Pubkey,
    pub challenger_squad_owner: Pubkey,
    pub sol_bet_amount: u64,
    pub duration: u64,
    pub start_timestamp: u64,
    pub end_timestamp: u64,
    pub is_finished: bool,
    pub winner: Pubkey,
    pub host_squad_mc_end: f64,
    pub challenger_squad_mc_end: f64,
    pub bump: u8,
}

impl Match {
    pub const SEED: &'static str = "Match";

    pub const ACCOUNT_SIZE: usize = 8 + 8 + 1 + (4 * 32) + (4 * 8) + 1 + 32 + (2 * 8) + 1;

    pub fn new(
        match_id: u64,
        match_type: u8,
        host_squad: Pubkey,
        host_squad_owner: Pubkey,
        sol_bet_amount: u64,
        duration: u64,
        start_timestamp: u64,
        bump: u8,
    ) -> Self {
        Self {
            match_id,
            match_type,
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
            host_squad_mc_end: 0.0,
            challenger_squad_mc_end: 0.0,
            bump,
        }
    }

    pub fn challenge(&mut self, challeger_squad: Pubkey, challenger_squad_owner: Pubkey) {
        self.challenger_squad = challeger_squad;
        self.challenger_squad_owner = challenger_squad_owner;
    }

    pub fn finalize(
        &mut self,
        winner: Pubkey,
        host_squad_mc_end: f64,
        challenger_squad_mc_end: f64,
    ) {
        self.is_finished = true;
        self.winner = winner;
        self.host_squad_mc_end = host_squad_mc_end;
        self.challenger_squad_mc_end = challenger_squad_mc_end;
    }
}
