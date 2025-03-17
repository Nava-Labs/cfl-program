use anchor_lang::prelude::*;

#[account]
pub struct Global {
    pub match_count: u64,
    pub fee_in_bps: u64,
    pub fee_recipient: Pubkey,
    pub current_season: u8,
}

impl Global {
    pub const SEED: &'static str = "Global";

    pub const ACCOUNT_SIZE: usize = 8 + 8 + 8 + 32 + 1;

    pub fn new(fee_in_bps: u64, fee_recipient: Pubkey) -> Self {
        Self {
            match_count: 0,
            fee_in_bps,
            fee_recipient,
            current_season: 1,
        }
    }

    pub fn increment(&mut self) {
        self.match_count += 1
    }

    pub fn update_global_settings(
        &mut self,
        new_fee_in_bps: u64,
        fee_recipient: Pubkey,
        season: u8,
    ) {
        self.fee_in_bps = new_fee_in_bps;
        self.fee_recipient = fee_recipient;
        self.current_season = season
    }
}

#[account]
pub struct Squad {
    pub owner: Pubkey,
    pub squad_index: u8,
    pub token_price_feed_ids: [Pubkey; 10],
    pub allocations: [f64; 10],
    pub formation: u64,
    pub bump: u8,
}

impl Squad {
    pub const SEED: &'static str = "Squad";

    pub const ACCOUNT_SIZE: usize = 8 + 32 + 1 + (32 * 10) + (8 * 10) + 8 + 1;

    pub fn new(
        owner: Pubkey,
        squad_index: u8,
        token_price_feed_ids: [Pubkey; 10],
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
pub struct UserSeasonVolume {
    pub user: Pubkey,
    pub season: u8,
    pub total_sol_bet: u64,
}

impl UserSeasonVolume {
    pub const SEED: &'static str = "UserSeasonVolume";

    pub const ACCOUNT_SIZE: usize = 8 + 32 + 1 + 8;

    pub fn add_total_sol_bet(&mut self, sol_amount: u64) {
        self.total_sol_bet += sol_amount;
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
    pub is_claimed: bool,
    pub bump: u8,
}

impl Match {
    pub const SEED: &'static str = "Match";

    pub const ACCOUNT_SIZE: usize = 8 + 8 + 1 + (4 * 32) + (4 * 8) + 1 + 32 + (2 * 8) + 1 + 1;

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
            is_claimed: false,
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

    pub fn update_claim_status(&mut self) {
        self.is_claimed = true;
    }
}
