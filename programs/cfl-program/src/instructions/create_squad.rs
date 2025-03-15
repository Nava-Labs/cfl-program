use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

use mpl_core::instructions::CreateV2CpiBuilder;

pub fn create_squad(
    ctx: Context<CreateSquad>,
    squad_index: u8,
    price_feed_ids: [Pubkey; 10],
    allocations: [f64; 10],
    formation: u64,
) -> Result<()> {
    let squad = &mut ctx.accounts.squad;
    let profile = &mut ctx.accounts.user_profile;
    let owner = ctx.accounts.user.key();
    let user = &mut ctx.accounts.user;

    if squad_index == 0 {
        return err!(CustomError::InvalidSquadIndex);
    }

    if price_feed_ids.len() != 10 {
        return err!(CustomError::InvalidPriceFeedLength);
    }

    if allocations.len() != 10 {
        return err!(CustomError::InvalidAllocationLength);
    }

    for allocation in allocations.iter() {
        if *allocation == 0.0 {
            return err!(CustomError::InvalidAllocationValue);
        }
    }

    let total_allocation: f64 = allocations.iter().sum();
    if total_allocation < 99.0 || total_allocation > 100.0 {
        return err!(CustomError::InvalidAllocationValue);
    }

    squad.set_inner(Squad::new(
        owner,
        squad_index,
        price_feed_ids,
        allocations,
        formation,
        ctx.bumps.squad,
    ));

    // mpl -- mint nft squad
    CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.asset.to_account_info())
        .collection(None)
        .authority(Some(&squad.to_account_info()))
        .payer(&user.to_account_info())
        .owner(Some(&user.to_account_info()))
        .update_authority(Some(&squad.to_account_info()))
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name("CFL Squad".to_string())
        .uri("https://qjajjywjjuxozhqgpwdm.supabase.co/storage/v1/object/public/metadata//metadata.json".to_string())
        .invoke_signed(&[&[
            Squad::SEED.as_bytes(),
            user.key().as_ref(),
            squad_index.to_le_bytes().as_ref(),
            &[ctx.bumps.squad],
        ]])?;

    // direct update the profile state
    profile.user = owner;

    profile.increment_squad_count();

    Ok(())
}

#[derive(Accounts)]
#[instruction(squad_index: u8)]
pub struct CreateSquad<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = Squad::ACCOUNT_SIZE,
        seeds = [Squad::SEED.as_bytes(), user.key().as_ref(), squad_index.to_le_bytes().as_ref()],
        bump
    )]
    pub squad: Account<'info, Squad>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserProfile::ACCOUNT_SIZE,
        seeds = [UserProfile::SEED.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: this account is checked by the address constraint
    pub mpl_core_program: UncheckedAccount<'info>,
}
