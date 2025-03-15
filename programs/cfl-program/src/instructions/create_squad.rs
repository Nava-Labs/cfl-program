use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_interface::{Mint, TokenAccount},
};

use mpl_token_metadata::{
    instructions::{
        CreateV1Cpi, CreateV1CpiAccounts, CreateV1CpiBuilder, CreateV1InstructionArgs,
        MintV1CpiBuilder,
    },
    types::{Collection, Creator, TokenStandard},
};

pub fn create_squad(
    ctx: Context<CreateSquad>,
    squad_index: u8,
    price_feed_ids: Vec<String>,
    allocations: [f64; 10],
    formation: u64,
) -> Result<()> {
    let squad = &mut ctx.accounts.squad;
    let profile = &mut ctx.accounts.user_profile;
    let owner = ctx.accounts.user.key();

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

    // direct update the profile state
    profile.user = owner;

    profile.increment_squad_count();

    let mint = &ctx.accounts.mint;
    let token_account = &mut ctx.accounts.token_account;
    let mpl_token_metadata_program = &mut ctx.accounts.mpl_token_metadata_program;
    let metadata = &mut ctx.accounts.metadata;
    let user = &mut ctx.accounts.user;
    let system_program = &mut ctx.accounts.system_program;
    let rent = &ctx.accounts.rent.to_account_info();
    let token_program = &ctx.accounts.token_program;

    // Mint NFT to the user
    let nft_name = format!("{} - {}", squad_index, owner.to_string());
    let nft_symbol = "SQUAD".to_string();
    let nft_uri = "https://example.com/1.json".to_string();

    let mint_to_cpi_context = CpiContext::new(
        token_program.to_account_info(),
        anchor_spl::token_interface::MintTo {
            mint: mint.to_account_info(),
            to: token_account.to_account_info(),
            authority: squad.to_account_info(),
        },
    );

    anchor_spl::token_interface::mint_to(mint_to_cpi_context, 1)?;

    let token_mint = mint.to_account_info();

    // create metadata
    let create_metadata_cpi_context = CreateV1Cpi::new(
        mpl_token_metadata_program,
        CreateV1CpiAccounts {
            metadata,
            master_edition: None,
            mint: (&token_mint, true),
            authority: user,
            payer: user,
            update_authority: (user, true),
            system_program,
            sysvar_instructions: rent,
            spl_token_program: Some(token_program),
        },
        CreateV1InstructionArgs {
            name: nft_name,
            symbol: nft_symbol,
            uri: nft_uri,
            seller_fee_basis_points: 0,
            token_standard: TokenStandard::Fungible,
            primary_sale_happened: false,
            creators: None,
            is_mutable: false,
            collection: None,
            uses: None,
            collection_details: None,
            rule_set: None,
            decimals: Some(9),
            print_supply: None,
        },
    );

    create_metadata_cpi_context.invoke()?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(squad_index: u8)]
pub struct CreateSquad<'info> {
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

    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = squad,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub token_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK:
    #[account(
        mut,
        seeds = [
            b"metadata",
            mpl_token_metadata_program.key().as_ref(),
            mint.key().as_ref()
        ],
        bump,
        seeds::program = mpl_token_metadata_program.key()
    )]
    pub metadata: AccountInfo<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK:
    pub mpl_token_metadata_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
