use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;

use mpl_core::instructions::{
    CreateCollectionV2CpiBuilder, CreateV2CpiBuilder, UpdateV2CpiBuilder,
};

pub fn update_nft_metadata(
    ctx: Context<UpdateNftMetadata>,
    squad_index: u8,
    new_name: String,
    new_uri: String,
) -> Result<()> {
    let metaplex = &ctx.accounts.mpl_core_program.to_account_info();
    let asset = &ctx.accounts.asset.to_account_info();
    let squad = &ctx.accounts.squad.to_account_info();
    let user = &ctx.accounts.user;
    let system_program = &ctx.accounts.system_program;
    let collection = &ctx.accounts.collection;

    CreateCollectionV2CpiBuilder::new(metaplex)
        .update_authority(Some(user))
        .collection(collection)
        .name("Squad Collection".to_string())
        .uri("https://qjajjywjjuxozhqgpwdm.supabase.co/storage/v1/object/public/metadata//metadata.json".to_string())
        .payer(user)
        .system_program(system_program)
        .invoke()?;

    // mpl -- update squad metadata
    UpdateV2CpiBuilder::new(metaplex)
        .asset(asset)
        .new_name(new_name)
        .new_uri(new_uri)
        .payer(user)
        .system_program(system_program)
        .authority(Some(squad))
        .new_update_authority(mpl_core::types::UpdateAuthority::Address(user.key()))
        .invoke_signed(&[&[
            Squad::SEED.as_bytes(),
            user.key().as_ref(),
            squad_index.to_le_bytes().as_ref(),
            &[ctx.bumps.squad],
        ]])?;

    // mpl -- update authority to collection
    UpdateV2CpiBuilder::new(metaplex)
        .asset(asset)
        .collection(None)
        .new_collection(Some(collection))
        .payer(user)
        .system_program(system_program)
        .new_update_authority(mpl_core::types::UpdateAuthority::Collection(
            collection.key(),
        ))
        .invoke()?;

    // // mpl -- update squad metadata
    // UpdateV2CpiBuilder::new(metaplex)
    //     .asset(asset)
    //     .new_name("Squad Collection".to_string())
    //     .new_uri("https://qjajjywjjuxozhqgpwdm.supabase.co/storage/v1/object/public/metadata//metadata.json".to_string())
    //     .collection(Some(collection))
    //     .payer(user)
    //     .system_program(system_program)
    //     .invoke()?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(squad_index: u8)]
pub struct UpdateNftMetadata<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(mut)]
    pub collection: Signer<'info>,

    #[account(
        mut,
        seeds = [Squad::SEED.as_bytes(), user.key().as_ref(), squad_index.to_le_bytes().as_ref()],
        bump
    )]
    pub squad: Account<'info, Squad>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: this account is checked by the address constraint
    pub mpl_core_program: UncheckedAccount<'info>,
}
