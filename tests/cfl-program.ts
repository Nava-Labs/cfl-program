import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import * as borsh from "@coral-xyz/borsh";
import {
  AccountInfo,
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { CflProgram } from "../target/types/cfl_program";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { BN } from "bn.js";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { keypairIdentity } from "@metaplex-foundation/umi";

const secretKeyDeployer = Uint8Array.from(
  require("../environment/deployer.json"),
);
const keypairDeployer = Keypair.fromSecretKey(secretKeyDeployer);

const secretKeyUser = Uint8Array.from(require("../environment/user.json"));
const keypairUser = Keypair.fromSecretKey(secretKeyUser);

const GLOBAL_SEED = "Global";
const SQUAD_SEED = "Squad";
const PROFILE_SEED = "Profile";
const MATCH_SEED = "Match";
const USER_SEASON_VOLUME_SEED = "UserSeasonVolume";

describe("cfl-program", () => {
  const provider = anchor.AnchorProvider.env();

  const connection = anchor.getProvider().connection;

  const wallet = new Wallet(keypairDeployer);

  const keypairFeeRecipient = Keypair.generate();

  const pythSolanaReceiver = new PythSolanaReceiver({
    connection,
    wallet,
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.CflProgram as Program<CflProgram>;

  before("Fund user", async () => {
    const ix = SystemProgram.transfer({
      fromPubkey: keypairDeployer.publicKey,
      toPubkey: keypairUser.publicKey,
      lamports: 50 * LAMPORTS_PER_SOL,
    });
    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;

    await sendAndConfirmTransaction(connection, tx, [keypairDeployer]);

    console.log(
      "Keypair Fee Recipient Balance => ",
      await connection.getBalance(keypairFeeRecipient.publicKey),
    );

    console.log(
      "Keypair User Balance => ",
      await connection.getBalance(keypairUser.publicKey),
    );
  });

  it("Is initialized!", async () => {
    let fee = new BN(250); // 2.5%
    let feeRecipient = keypairFeeRecipient.publicKey;

    const ix = await program.methods
      .initialize(fee, feeRecipient)
      .instruction();
    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;

    await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
      skipPreflight: false,
    });

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      program.programId,
    );

    let state = await program.account.global.fetch(global);
    console.log("Initial State: ", state);
  });

  it("Squad Created! by Deployer", async () => {
    let keypairAsset = Keypair.generate();

    const pf1 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf2 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf3 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf4 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf5 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf6 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf7 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf8 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf9 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf10 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");

    const pfs = [pf1, pf2, pf3, pf4, pf5, pf6, pf7, pf8, pf9, pf10];
    const percentages = [
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
    ];

    const formation = new BN(433);

    let [profile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
      program.programId,
    );

    let [squad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const ix = await program.methods
      .createSquad(1, pfs, percentages, formation)
      .accounts({
        asset: keypairAsset.publicKey,
        // @ts-ignore
        squad,
        userProfile: profile,
        user: keypairDeployer.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;

    await sendAndConfirmTransaction(
      connection,
      tx,
      [keypairAsset, keypairDeployer],
      {
        skipPreflight: false,
      },
    );

    const profileState = await program.account.userProfile.fetch(profile);
    console.log("Profile State", JSON.stringify(profileState, null, 3));

    const squadState = await program.account.squad.fetch(squad);
    console.log("Squad State", JSON.stringify(squadState, null, 3));
  });

  it("Squad Created! by User", async () => {
    let keypairAsset = Keypair.generate();

    const pf1 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf2 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf3 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf4 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf5 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf6 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf7 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf8 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf9 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");
    const pf10 = new PublicKey("7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq");

    const pfs = [pf1, pf2, pf3, pf4, pf5, pf6, pf7, pf8, pf9, pf10];
    const percentages = [
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
      parseFloat("10"),
    ];

    const formation = new BN(433);

    let [profile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairUser.publicKey.toBuffer()],
      program.programId,
    );

    let [squad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairUser.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const ix = await program.methods
      .createSquad(1, pfs, percentages, formation)
      .accounts({
        asset: keypairAsset.publicKey,
        // @ts-ignore
        squad,
        userProfile: profile,
        user: keypairUser.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairUser.publicKey;

    await sendAndConfirmTransaction(
      connection,
      tx,
      [keypairAsset, keypairUser],
      {
        skipPreflight: false,
      },
    );

    const profileState = await program.account.userProfile.fetch(profile);
    console.log("Profile State", JSON.stringify(profileState, null, 3));

    const squadState = await program.account.squad.fetch(squad);
    console.log("Squad State", JSON.stringify(squadState, null, 3));
  });

  it("Match Created!", async () => {
    let [hostSquad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const id = new BN(1);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
      program.programId,
    );

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      program.programId,
    );

    const [userSeasonVolume] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(USER_SEASON_VOLUME_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const start = new BN(1773085020);
    const duration = new BN(123);
    const sol = new BN(10 * LAMPORTS_PER_SOL);
    const matchType = 1;

    const ix = await program.methods
      .createMatch(id, start, duration, sol, matchType)
      .accounts({
        // @ts-ignore
        hostSquad,
        // @ts-ignore
        matchAccount: match,
        global,
        userSeasonVolume,
        user: keypairDeployer.publicKey,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;

    await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
      skipPreflight: false,
    });

    let state = await program.account.global.fetch(global);
    console.log(state);

    let [hostOwnerProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
      program.programId,
    );

    let profileState =
      await program.account.userProfile.fetch(hostOwnerProfile);
    console.log(profileState);
  });

  it("Challenge", async () => {
    let [challengerSquad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairUser.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const id = new BN(1);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
      program.programId,
    );

    let [hostOwnerProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
      program.programId,
    );

    let [challengerOwnerProfile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairUser.publicKey.toBuffer()],
      program.programId,
    );

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      program.programId,
    );

    const [hostOwnerSeasonVolume] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(USER_SEASON_VOLUME_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const [challengerOwnerSeasonVolume] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(USER_SEASON_VOLUME_SEED),
        keypairUser.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const ix = await program.methods
      .challenge(id)
      .accounts({
        // @ts-ignore
        challengerSquad,
        // @ts-ignore
        match,
        challengerOwnerProfile,
        hostOwnerProfile,
        global,
        hostOwnerSeasonVolume,
        challengerOwnerSeasonVolume,
        user: keypairUser.publicKey,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairUser.publicKey;

    await sendAndConfirmTransaction(connection, tx, [keypairUser], {
      skipPreflight: false,
    });

    console.log(
      "Keypair Fee Recipient Balance => ",
      await connection.getBalance(keypairFeeRecipient.publicKey),
    );

    console.log(
      "Keypair User Balance => ",
      await connection.getBalance(keypairUser.publicKey),
    );

    let hostOwnerProfileState =
      await program.account.userProfile.fetch(hostOwnerProfile);
    console.log(hostOwnerProfileState);

    let challengerOwnerProfileState = await program.account.userProfile.fetch(
      challengerOwnerProfile,
    );
    console.log(challengerOwnerProfileState);

    let hostOwnerSeasonVolmueState =
      await program.account.userSeasonVolume.fetch(hostOwnerSeasonVolume);
    console.log(hostOwnerSeasonVolmueState);
  });

  it("Finalize", async () => {
    const id = new BN(1);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
      program.programId,
    );

    let [winner] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairUser.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const ix = await program.methods
      .finalize(id, winner, 1, 2)
      .accounts({
        // @ts-ignore
        match,
        user: keypairDeployer.publicKey,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;
    await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
      skipPreflight: false,
    });
  });

  it("Claim Sol by winner", async () => {
    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      program.programId,
    );

    const id = new BN(1);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
      program.programId,
    );

    let [winner] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairUser.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const ix = await program.methods
      .winnerClaimSol(id)
      .accounts({
        // @ts-ignore
        match_account: match,
        squadWinner: winner,
        feeRecipient: keypairFeeRecipient.publicKey,
        global,
        user: keypairUser.publicKey,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairUser.publicKey;
    await sendAndConfirmTransaction(connection, tx, [keypairUser], {
      skipPreflight: false,
    });

    console.log(
      "Keypair Fee Recipient Balance => ",
      await connection.getBalance(keypairFeeRecipient.publicKey),
    );

    console.log(
      "Keypair User Balance => ",
      await connection.getBalance(keypairUser.publicKey),
    );
  });
});
