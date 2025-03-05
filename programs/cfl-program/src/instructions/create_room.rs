use crate::errors::CustomError;
use crate::state::*;

use anchor_lang::system_program::Transfer;
use anchor_lang::{prelude::*, system_program};

pub fn create_room(
    ctx: Context<CreateRoom>,
    room_id: u8,
    sol_bet_amount_in_lamports: u64,
    duration: u64,
) -> Result<()> {
    let squad: &mut AccountInfo = &mut ctx.accounts.squad.to_account_info();
    let room = &mut ctx.accounts.room;
    let user = &mut ctx.accounts.user;

    room.set_inner(Room::new(
        room_id,
        sol_bet_amount_in_lamports,
        duration,
        squad.key(),
        room.bump,
    ));

    let transfer_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: user.to_account_info(),
            to: room.to_account_info(),
        },
    );

    system_program::transfer(transfer_ctx, sol_bet_amount_in_lamports)?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(room_id: u8)]
pub struct CreateRoom<'info> {
    /// CHECK:
    #[account(mut)]
    pub squad: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        space = Room::ACCOUNT_SIZE,
        seeds = [Room::SEED.as_bytes(), room_id.to_le_bytes().as_ref()],
        bump
    )]
    pub room: Account<'info, Room>,
    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
