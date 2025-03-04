use crate::errors::CustomError;
use crate::state::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use anchor_lang::prelude::*;

pub fn create_team(ctx: Context<CreateTeam>, feed_id: String) -> Result<()> {
    let price_update = &mut ctx.accounts.price_update;

    let feed_id: [u8; 32] = get_feed_id_from_hex(&feed_id)?;

    let price = price_update.get_price_unchecked(&feed_id)?;

    msg!("price, {:?}", price);

    // Sample output:
    // The price is (7160106530699 ± 5129162301) * 10^-8
    msg!(
        "The price is ({} ± {}) * 10^{}",
        price.price,
        price.conf,
        price.exponent
    );
    Ok(())
}

#[derive(Accounts)]
pub struct CreateTeam<'info> {
    pub price_update: Account<'info, PriceUpdateV2>,

    #[account(mut)]
    pub user: Signer<'info>,
}
