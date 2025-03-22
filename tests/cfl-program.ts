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
import {
  collectionAddress,
  fetchAllAssets,
  fetchAssetsByCollection,
  fetchAssetsByOwner,
  fetchCollection,
  fetchCollectionsByUpdateAuthority,
  getAssetV1GpaBuilder,
  Key,
  mplCore,
  MPL_CORE_PROGRAM_ID,
} from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

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
const USER_SEASON_SEED = "UserSeason";

describe("cfl-program", () => {
  const provider = anchor.AnchorProvider.env();

  const connection = anchor.getProvider().connection;

  const wallet = new Wallet(keypairDeployer);

  const keypairFeeRecipient = Keypair.generate();

  let keypairAsset = Keypair.generate();

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
    let pfExample = new PublicKey(
      "7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq",
    );
    let pfs = [];
    let allocations = [];
    for (let i = 0; i < 10; i++) {
      pfs.push(pfExample);
      allocations.push(parseFloat("10"));
    }
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
      .createSquad(1, pfs, allocations, formation)
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
    console.log(
      "Deployer Profile State",
      JSON.stringify(profileState, null, 3),
    );

    const squadState = await program.account.squad.fetch(squad);
    console.log("Deployer Squad State", JSON.stringify(squadState, null, 3));

    await fetchMplxNft(keypairDeployer.publicKey);
  });

  const fetchMplxNft = async (owner: PublicKey) => {
    const umi = createUmi(connection);

    const assetsByOwner = await fetchAssetsByOwner(umi, owner.toString());
    console.log(assetsByOwner);
  };

  const fetchNftCollection = async (collectionPubkey: PublicKey) => {
    const umi = createUmi(connection);

    const collection = await fetchCollection(umi, collectionPubkey.toString());
    console.log("Collection", collection);

    const collectionDetails = await fetchAssetsByCollection(
      umi,
      collectionPubkey.toString(),
    );
    console.log("Collection Details", collectionDetails);
  };

  it("Update nft metadata!", async () => {
    const keypairCollection = Keypair.generate();

    let [squad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const ix = await program.methods
      .updateNftMetadata(1, "aa", "bb")
      .accounts({
        asset: keypairAsset.publicKey,
        collection: keypairCollection.publicKey,
        // @ts-ignore
        squad,
        user: keypairDeployer.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;

    await sendAndConfirmTransaction(
      connection,
      tx,
      [keypairAsset, keypairCollection, keypairDeployer],
      {
        skipPreflight: false,
      },
    );

    await fetchMplxNft(keypairDeployer.publicKey);
    await fetchNftCollection(keypairCollection.publicKey);
  });

  // it("Squad Created! by User", async () => {
  //   let keypairAsset = Keypair.generate();

  //   let pfExample = new PublicKey(
  //     "7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq",
  //   );
  //   let pfs = [];
  //   let allocations = [];
  //   for (let i = 0; i < 10; i++) {
  //     pfs.push(pfExample);
  //     allocations.push(parseFloat("10"));
  //   }
  //   const formation = new BN(433);

  //   let [profile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairUser.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   let [squad] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(SQUAD_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const ix = await program.methods
  //     .createSquad(1, pfs, allocations, formation)
  //     .accounts({
  //       asset: keypairAsset.publicKey,
  //       // @ts-ignore
  //       squad,
  //       userProfile: profile,
  //       user: keypairUser.publicKey,
  //       mplCoreProgram: MPL_CORE_PROGRAM_ID,
  //     })
  //     .instruction();

  //   const tx = new Transaction().add(ix);
  //   tx.feePayer = keypairUser.publicKey;

  //   await sendAndConfirmTransaction(
  //     connection,
  //     tx,
  //     [keypairAsset, keypairUser],
  //     {
  //       skipPreflight: false,
  //     },
  //   );

  //   const profileState = await program.account.userProfile.fetch(profile);
  //   console.log("User Profile State", JSON.stringify(profileState, null, 3));

  //   const squadState = await program.account.squad.fetch(squad);
  //   console.log("User Squad State", JSON.stringify(squadState, null, 3));

  //   await fetchMplxNft(keypairUser.publicKey);
  // });

  // it("Match Created! Season 0", async () => {
  //   let [hostSquad] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(SQUAD_SEED),
  //       keypairDeployer.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const id = new BN(1);

  //   let [match] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
  //     program.programId,
  //   );

  //   const [global] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(GLOBAL_SEED)],
  //     program.programId,
  //   );

  //   const [userSeason] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairDeployer.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([0])),
  //     ],
  //     program.programId,
  //   );

  //   const start = new BN(1773085020);
  //   const duration = new BN(123);
  //   const sol = new BN(10 * LAMPORTS_PER_SOL);
  //   const matchType = 1;

  //   const ix = await program.methods
  //     .createMatch(id, start, duration, sol, matchType)
  //     .accounts({
  //       // @ts-ignore
  //       hostSquad,
  //       // @ts-ignore
  //       matchAccount: match,
  //       global,
  //       userSeason,
  //       user: keypairDeployer.publicKey,
  //     })
  //     .instruction();

  //   const tx = new Transaction().add(ix);
  //   tx.feePayer = keypairDeployer.publicKey;

  //   await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
  //     skipPreflight: false,
  //   });

  //   let state = await program.account.global.fetch(global);
  //   console.log("Global State", JSON.stringify(state, null, 3));

  //   let [hostOwnerProfile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   let profileState =
  //     await program.account.userProfile.fetch(hostOwnerProfile);
  //   console.log(
  //     "Deployer profile state",
  //     JSON.stringify(profileState, null, 3),
  //   );
  // });

  // it("Challenge", async () => {
  //   let [challengerSquad] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(SQUAD_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const id = new BN(1);

  //   let [match] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
  //     program.programId,
  //   );

  //   const [global] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(GLOBAL_SEED)],
  //     program.programId,
  //   );

  //   let [hostOwnerProfile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   let [challengerOwnerProfile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairUser.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   const [hostOwnerSeason] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairDeployer.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([0])),
  //     ],
  //     program.programId,
  //   );

  //   const [challengerOwnerSeason] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([0])),
  //     ],
  //     program.programId,
  //   );

  //   const ix = await program.methods
  //     .challenge(id)
  //     .accounts({
  //       // @ts-ignore
  //       challengerSquad,
  //       // @ts-ignore
  //       match,
  //       challengerOwnerProfile,
  //       hostOwnerProfile,
  //       global,
  //       hostOwnerSeason,
  //       challengerOwnerSeason,
  //       user: keypairUser.publicKey,
  //     })
  //     .instruction();

  //   const tx = new Transaction().add(ix);
  //   tx.feePayer = keypairUser.publicKey;

  //   await sendAndConfirmTransaction(connection, tx, [keypairUser], {
  //     skipPreflight: false,
  //   });

  //   console.log(
  //     "Keypair Fee Recipient Balance => ",
  //     await connection.getBalance(keypairFeeRecipient.publicKey),
  //   );

  //   console.log(
  //     "Keypair User Balance => ",
  //     await connection.getBalance(keypairUser.publicKey),
  //   );

  //   let hostOwnerProfileState =
  //     await program.account.userProfile.fetch(hostOwnerProfile);
  //   console.log(
  //     "Host Owner (Deployer) Profile state",
  //     JSON.stringify(hostOwnerProfileState, null, 3),
  //   );

  //   let challengerOwnerProfileState = await program.account.userProfile.fetch(
  //     challengerOwnerProfile,
  //   );
  //   console.log(
  //     "Challenger Owner (User) Profile state",
  //     JSON.stringify(challengerOwnerProfileState, null, 3),
  //   );

  //   let hostOwnerSeasonState =
  //     await program.account.userSeason.fetch(hostOwnerSeason);
  //   console.log(
  //     "Host Owner Season (Deployer) state",
  //     JSON.stringify(hostOwnerSeasonState, null, 3),
  //   );

  //   let challengerOwnerSeasonState = await program.account.userSeason.fetch(
  //     challengerOwnerSeason,
  //   );
  //   console.log(
  //     "Challenger Owner Season (User) state",
  //     JSON.stringify(challengerOwnerSeasonState, null, 3),
  //   );
  // });

  // it("Finalize", async () => {
  //   const id = new BN(1);

  //   let [match] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
  //     program.programId,
  //   );

  //   let [winner] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(SQUAD_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const ix = await program.methods
  //     .finalize(id, winner, 1, 2)
  //     .accounts({
  //       // @ts-ignore
  //       match,
  //       user: keypairDeployer.publicKey,
  //     })
  //     .instruction();

  //   const tx = new Transaction().add(ix);
  //   tx.feePayer = keypairDeployer.publicKey;
  //   await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
  //     skipPreflight: false,
  //   });
  // });

  // it("Claim Sol by winner", async () => {
  //   const [global] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(GLOBAL_SEED)],
  //     program.programId,
  //   );

  //   const id = new BN(1);

  //   let [match] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
  //     program.programId,
  //   );

  //   let [winner] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(SQUAD_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const ix = await program.methods
  //     .winnerClaimSol(id)
  //     .accounts({
  //       // @ts-ignore
  //       match_account: match,
  //       squadWinner: winner,
  //       feeRecipient: keypairFeeRecipient.publicKey,
  //       global,
  //       user: keypairUser.publicKey,
  //     })
  //     .instruction();

  //   const tx = new Transaction().add(ix);
  //   tx.feePayer = keypairUser.publicKey;
  //   await sendAndConfirmTransaction(connection, tx, [keypairUser], {
  //     skipPreflight: false,
  //   });

  //   console.log(
  //     "Keypair Fee Recipient Balance => ",
  //     await connection.getBalance(keypairFeeRecipient.publicKey),
  //   );

  //   console.log(
  //     "Keypair User Balance => ",
  //     await connection.getBalance(keypairUser.publicKey),
  //   );
  // });

  // it("global settings Updated!", async () => {
  //   let fee = new BN(300); // 3%
  //   let feeRecipient = keypairFeeRecipient.publicKey;
  //   let currentSeason = 1;

  //   const ix = await program.methods
  //     .updateGlobalSettings(fee, feeRecipient, currentSeason)
  //     .accounts({ user: keypairDeployer.publicKey })
  //     .instruction();
  //   const tx = new Transaction().add(ix);
  //   tx.feePayer = keypairDeployer.publicKey;

  //   await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
  //     skipPreflight: false,
  //   });

  //   const [global] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(GLOBAL_SEED)],
  //     program.programId,
  //   );

  //   let state = await program.account.global.fetch(global);
  //   console.log("Updated State: ", state);
  // });

  // it("Match Created! Season 1", async () => {
  //   let [hostSquad] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(SQUAD_SEED),
  //       keypairDeployer.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const id = new BN(2);

  //   let [match] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
  //     program.programId,
  //   );

  //   const [global] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(GLOBAL_SEED)],
  //     program.programId,
  //   );

  //   const [userSeason] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairDeployer.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const start = new BN(1773085020);
  //   const duration = new BN(123);
  //   const sol = new BN(5 * LAMPORTS_PER_SOL);
  //   const matchType = 1;

  //   const ix = await program.methods
  //     .createMatch(id, start, duration, sol, matchType)
  //     .accounts({
  //       // @ts-ignore
  //       hostSquad,
  //       // @ts-ignore
  //       matchAccount: match,
  //       global,
  //       userSeason,
  //       user: keypairDeployer.publicKey,
  //     })
  //     .instruction();

  //   const tx = new Transaction().add(ix);
  //   tx.feePayer = keypairDeployer.publicKey;

  //   await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
  //     skipPreflight: false,
  //   });

  //   let state = await program.account.global.fetch(global);
  //   console.log("Global State", JSON.stringify(state, null, 3));

  //   let [hostOwnerProfile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   let profileState =
  //     await program.account.userProfile.fetch(hostOwnerProfile);
  //   console.log(
  //     "Deployer profile state",
  //     JSON.stringify(profileState, null, 3),
  //   );
  // });

  // it("Create Squad and Challenge by User", async () => {
  //   let keypairAsset = Keypair.generate();

  //   let pfExample = new PublicKey(
  //     "7YmBpFooNruexenhJLU1wwUWUCzgETLQGVF1jLjqqaWq",
  //   );
  //   let pfs = [];
  //   let allocations = [];
  //   for (let i = 0; i < 10; i++) {
  //     pfs.push(pfExample);
  //     allocations.push(parseFloat("10"));
  //   }
  //   const formation = new BN(433);

  //   let [profile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairUser.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   let [challengerSquad] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(SQUAD_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([2])),
  //     ],
  //     program.programId,
  //   );

  //   const createSquadIx = await program.methods
  //     .createSquad(2, pfs, allocations, formation)
  //     .accounts({
  //       asset: keypairAsset.publicKey,
  //       // @ts-ignore
  //       squad: challengerSquad,
  //       userProfile: profile,
  //       user: keypairUser.publicKey,
  //       mplCoreProgram: MPL_CORE_PROGRAM_ID,
  //     })
  //     .instruction();

  //   const id = new BN(2);

  //   let [match] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
  //     program.programId,
  //   );

  //   const [global] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(GLOBAL_SEED)],
  //     program.programId,
  //   );

  //   let [hostOwnerProfile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   let [challengerOwnerProfile] = PublicKey.findProgramAddressSync(
  //     [Buffer.from(PROFILE_SEED), keypairUser.publicKey.toBuffer()],
  //     program.programId,
  //   );

  //   const [hostOwnerSeason] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairDeployer.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const [challengerOwnerSeason] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([1])),
  //     ],
  //     program.programId,
  //   );

  //   const challengeIx = await program.methods
  //     .challenge(id)
  //     .accounts({
  //       // @ts-ignore
  //       challengerSquad,
  //       // @ts-ignore
  //       match,
  //       challengerOwnerProfile,
  //       hostOwnerProfile,
  //       global,
  //       hostOwnerSeason,
  //       challengerOwnerSeason,
  //       user: keypairUser.publicKey,
  //     })
  //     .instruction();

  //   const tx = new Transaction().add(createSquadIx, challengeIx);
  //   tx.feePayer = keypairUser.publicKey;
  //   tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  //   tx.partialSign(keypairAsset);
  //   tx.partialSign(keypairUser);

  //   const serializedTx = tx.serialize();
  //   console.log("tx size", serializedTx.length);

  //   await sendAndConfirmTransaction(
  //     connection,
  //     tx,
  //     [keypairAsset, keypairUser],
  //     {
  //       skipPreflight: false,
  //     },
  //   );

  //   console.log(
  //     "Keypair Fee Recipient Balance => ",
  //     await connection.getBalance(keypairFeeRecipient.publicKey),
  //   );

  //   console.log(
  //     "Keypair User Balance => ",
  //     await connection.getBalance(keypairUser.publicKey),
  //   );

  //   let hostOwnerProfileState =
  //     await program.account.userProfile.fetch(hostOwnerProfile);
  //   console.log(
  //     "Host Owner (Deployer) Profile state",
  //     JSON.stringify(hostOwnerProfileState, null, 3),
  //   );

  //   let challengerOwnerProfileState = await program.account.userProfile.fetch(
  //     challengerOwnerProfile,
  //   );
  //   console.log(
  //     "Challenger Owner (User) Profile state",
  //     JSON.stringify(challengerOwnerProfileState, null, 3),
  //   );

  //   let hostOwnerSeasonState =
  //     await program.account.userSeason.fetch(hostOwnerSeason);
  //   console.log(
  //     "Host Owner Season (Deployer) state",
  //     JSON.stringify(hostOwnerSeasonState, null, 3),
  //   );

  //   let challengerOwnerSeasonState = await program.account.userSeason.fetch(
  //     challengerOwnerSeason,
  //   );
  //   console.log(
  //     "Challenger Owner Season (User) state",
  //     JSON.stringify(challengerOwnerSeasonState, null, 3),
  //   );

  //   const [hostOwnerSeason0] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairDeployer.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([0])),
  //     ],
  //     program.programId,
  //   );

  //   const [challengerOwnerSeason0] = PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from(USER_SEASON_SEED),
  //       keypairUser.publicKey.toBuffer(),
  //       Buffer.from(new Uint8Array([0])),
  //     ],
  //     program.programId,
  //   );

  //   let hostOwnerSeason0State =
  //     await program.account.userSeason.fetch(hostOwnerSeason0);
  //   console.log(
  //     "Host Owner Season 0 (Deployer) state",
  //     JSON.stringify(hostOwnerSeason0State, null, 3),
  //   );

  //   let challengerOwnerSeason0State = await program.account.userSeason.fetch(
  //     challengerOwnerSeason0,
  //   );
  //   console.log(
  //     "Challenger Owner Season 0 (User) state",
  //     JSON.stringify(challengerOwnerSeason0State, null, 3),
  //   );
  // });
});
