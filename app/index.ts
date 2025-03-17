import * as anchor from "@coral-xyz/anchor";
import * as borsh from "@coral-xyz/borsh";
import { AnchorProvider, Program, Idl, web3 } from "@coral-xyz/anchor";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { BN } from "bn.js";
import {
  clusterApiUrl,
  PublicKey,
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { CflProgram } from "../target/types/cfl_program";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
// @ts-ignore
import IDL from "../target/idl/cfl_program.json";
import {
  create,
  fetchAsset,
  getAssetV1GpaBuilder,
  Key,
  mplCore,
  MPL_CORE_PROGRAM_ID,
  transferV1,
} from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  generateSigner,
  signerIdentity,
} from "@metaplex-foundation/umi";

const connection = new Connection("https://rpc.mainnet-alpha.sonic.game");
// const connection = new Connection("https://api.testnet.sonic.game/");
// const connection = new Connection("https://api.devnet.solana.com");

const secretKeyDeployer = Uint8Array.from(
  require("../environment/deployer.json"),
);
const keypairDeployer = Keypair.fromSecretKey(secretKeyDeployer);

const secretKeyFeeRecipient = Uint8Array.from(
  require("../environment/fee-recipient.json"),
);
const keypairFeeRecipient = Keypair.fromSecretKey(secretKeyFeeRecipient);

const GLOBAL_SEED = "Global";
const SQUAD_SEED = "Squad";
const PROFILE_SEED = "Profile";
const MATCH_SEED = "Match";
const USER_SEASON_VOLUME_SEED = "UserSeasonVolume";

// const umi = createUmi("https://rpc.mainnet-alpha.sonic.game").use(mplCore());

// let keypairUmi = umi.eddsa.createKeypairFromSecretKey(secretKeyDeployer);

// Before Umi can use this Keypair you need to generate
// a Signer type with it.
// const signer = createSignerFromKeypair(umi, keypairUmi);

// umi.use(signerIdentity(signer));

async function main() {
  // const assetSigner = generateSigner(umi);
  // const result = await create(umi, {
  //   asset: assetSigner,
  //   name: "My Asset",
  //   uri: "https://example.com/my-asset.json",
  // }).sendAndConfirm(umi);
  // console.log(result);
  // const assetsByOwner = await getAssetV1GpaBuilder(umi)
  //   .whereField("key", Key.AssetV1)
  //   // @ts-ignore
  //   .whereField("owner", keypairDeployer.publicKey)
  //   .getDeserialized();
  // console.log(assetsByOwner);
  // const pythSolanaReceiver = new PythSolanaReceiver({ connection, wallet });
  // const solUsdPriceFeedAccount = pythSolanaReceiver
  //   .getPriceFeedAccountAddress(
  //     1,
  //     "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  //   )
  //   .toBase58();
  // console.log(solUsdPriceFeedAccount);
  /// =================================================== \\\
  // const squadIndex = 3;
  // const matchId = 1;
  // const pf1 =
  //   "0x0fc54579a29ba60a08fdb5c28348f22fd3bec18e221dd6b90369950db638a5a7";
  // const pf2 =
  //   "0x45b75908a1965a86080a26d9f31ab69d045d4dda73d1394e0d3693ce00d40e6f";
  // const pf3 =
  //   "0xa80e97f70f6a4a8a0273822fb86d51b2bdb9a16ce0edb7ea8c8b84cbaecb5ce5";
  // const pf4 =
  //   "0x7358313661dcd4f842a1423aa4f7a05f009001c9113201c719621d3f1aa80a73";
  // const pf5 =
  //   "0x58cd29ef0e714c5affc44f269b2c1899a52da4169d7acc147b9da692e6953608";
  // const pf6 =
  //   "0x3c987d95da67ceb12705b22448200568c15b6242796cacc21c11f622e74cfffb";
  // const pf7 =
  //   "0xd6f83dfeaff95d596ddec26af2ee32f391c206a183b161b7980821860eeef2f5";
  // const pf8 =
  //   "0x9b5729efe3d68e537cdcb2ca70444dea5f06e1660b562632609757076d0b9448";
  // const pf9 =
  //   "0x514aed52ca5294177f20187ae883cec4a018619772ddce41efcc36a6448f5d5d";
  // const pf10 =
  //   "0x1a483c4a63876d286991ac0d6e090298db42e88c3826b6e0cff89daca498eed5";
  // const pfs = [pf1, pf2, pf3, pf4, pf5, pf6, pf7, pf8, pf9, pf10];
  // const allocations = [
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  // ];
  // const formation = new BN(433);
  // await createSquadAndChallenge(
  //   squadIndex,
  //   matchId,
  //   pfs,
  //   allocations,
  //   formation,
  // );
  // / =================================================== \\\
  // / =================================================== \\\
  // / =================================================== \\\
  // / =================================================== \\\
  // / =================================================== \\\

  let fee = new BN(250); // 2.5%
  let feeRecipient = keypairFeeRecipient.publicKey;
  await initialize(fee, feeRecipient);
  // await updateGlobalSettings(fee, feeRecipient, 1);
  // await closeGlobalAccount();

  // / =================================================== \\\
  // const squadIndex = 1;
  // const pf1 = "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE";
  // const pf2 = "AD8TsWft2b715Vh92NUTwAiu8csPBPmKy3B7BsFzyfVb";
  // const pf3 = "6UxPR2nXJNNM1nESVWGAf8NXMVu3SGgYf3ZfUFoGB9cs";
  // const pf4 = "gWzECufoh81TGMrRRD9QnTUjHQpGW1kywXu8PZYLhmF";
  // const pf5 = "6B23K3tkb51vLZA14jcEQVCA1pfHptzEHFA93V5dYwbT";
  // const pf6 = "6B23K3tkb51vLZA14jcEQVCA1pfHptzEHFA93V5dYwbT";
  // const pf7 = "BqostroUNoGWabof1Rm95TLNXRivjgzfM6GetpwTfotq";
  // const pf8 = "9vNb2tQoZ8bB4vzMbQLWViGwNaDJVtct13AGgno1wazp";
  // const pf9 = "27zzC5wXCeZeuJ3h9uAJzV5tGn6r5Tzo98S1ZceYKEb8";
  // const pf10 = "BxizdE1Rd9yeCXUaorGNGLc4qHbqBULxiBtjRX37HjSV";
  // const pfs = [pf1, pf2, pf3, pf4, pf5, pf6, pf7, pf8, pf9, pf10];
  // const percentages = [
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  //   parseFloat("10"),
  // ];
  // const formation = 352;
  // await createSquad(pfs, percentages, squadIndex, formation);
  // / =================================================== \\\
  // const matchId = new BN(2);
  // const start = new BN(1742089800);
  // const duration = new BN(150);
  // const sol = new BN(0.001 * LAMPORTS_PER_SOL);
  // const squadIndex = 1;
  // const matchType = 0;
  // await createMatch(matchId, start, duration, sol, squadIndex, matchType);
  // / =================================================== \\\
  //
  // const matchId = new BN(1);
  // const challengerSquadIndex = 1;
  // await challenge(matchId, challengerSquadIndex);
  /// =================================================== \\\
  // const matchId = new BN(2);
  // const winner = new PublicKey("A15LHoR59wZLn4ho3ApeGTHXYrdygysW4a5QF7M8ekfU");
  // await finalize(
  //   matchId,
  //   winner,
  //   parseFloat("231287195.71011776"),
  //   parseFloat("252994605.51299322"),
  // );
  //
  // const matchId = new BN(1);
  // await winnerClaimSol(matchId);
}

// const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const provider = new AnchorProvider(
  connection,
  new anchor.Wallet(keypairDeployer),
  AnchorProvider.defaultOptions(),
);
anchor.setProvider(provider);

const wallet = new anchor.Wallet(keypairDeployer);

const program = new Program(IDL as CflProgram, provider);

// async function closeGlobalAccount() {
//   try {
//     const [global] = PublicKey.findProgramAddressSync(
//       [Buffer.from(GLOBAL_SEED)],
//       program.programId,
//     );

//     const tx = await program.methods
//       .closeGlobalAccount()
//       .accounts({
//         // @ts-ignore
//         global,
//         receiver: keypairDeployer.publicKey,
//       })
//       .signers([keypairDeployer])
//       .rpc();

//     console.log("Transaction signature", tx);
//   } catch (error) {
//     console.error("Error initalize:", error);
//   }
// }

async function initialize(fee: any, feeRecipient: any) {
  try {
    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      program.programId,
    );

    const tx = await program.methods
      .initialize(fee, feeRecipient)
      .accounts({
        // @ts-ignore
        global,
        user: keypairDeployer.publicKey,
      })
      .signers([keypairDeployer])
      .rpc();

    console.log("Transaction signature", tx);
  } catch (error) {
    console.error("Error initalize:", error);
  }
}

async function createSquad(
  pfs: string[],
  percentage: number[],
  squadIndex: number,
  formation: number,
) {
  try {
    let keypairAsset = Keypair.generate();

    let [profile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
      program.programId,
    );

    let [squad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([squadIndex])),
      ],
      program.programId,
    );

    let pfsFinal = [];

    for (const pf of pfs) {
      pfsFinal.push(new PublicKey(pf));
    }

    const tx = await program.methods
      .createSquad(squadIndex, pfsFinal, percentage, new BN(formation))
      .accounts({
        // @ts-ignore
        asset: keypairAsset.publicKey,
        // @ts-ignore
        squad,
        userProfile: profile,
        user: keypairDeployer.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
      })
      .signers([keypairAsset, keypairDeployer])
      .rpc();

    console.log("Transaction signature", tx);
  } catch (error) {
    console.error("Error initalize:", error);
  }
}

async function createMatch(
  matchId: any,
  start: any,
  duration: any,
  sol: any,
  squadIndex: number,
  matchType: any,
) {
  try {
    let [profile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
      program.programId,
    );

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      program.programId,
    );

    let [hostSquad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([squadIndex])),
      ],
      program.programId,
    );

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), matchId.toBuffer("le", 8)],
      program.programId,
    );

    const tx = await program.methods
      .createMatch(matchId, start, duration, sol, matchType)
      .accounts({
        // @ts-ignore
        hostSquad,
        // @ts-ignore
        match,
        userProfile: profile,
        global,
        user: keypairDeployer.publicKey,
      })
      .signers([keypairDeployer])
      .rpc();

    console.log("Transaction signature", tx);
  } catch (error) {
    console.error("Error initalize:", error);
  }
}

async function challenge(matchId: any, challengerSquadIndex: number) {
  try {
    let [challengerSquad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([challengerSquadIndex])),
      ],
      program.programId,
    );

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), matchId.toBuffer("le", 8)],
      program.programId,
    );

    const tx = await program.methods
      .challenge(matchId)
      .accounts({
        // @ts-ignore
        challengerSquad,
        // @ts-ignore
        match,
        user: keypairDeployer.publicKey,
      })
      .signers([keypairDeployer])
      .rpc();

    console.log("Transaction signature", tx);
  } catch (error) {
    console.error("Error initalize:", error);
  }
}

async function finalize(
  matchId: any,
  winner: PublicKey,
  hostMcEnd,
  challengerMcEnd,
) {
  let [match] = PublicKey.findProgramAddressSync(
    [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([matchId]))],
    program.programId,
  );

  const ix = await program.methods
    .finalize(matchId, winner, hostMcEnd, challengerMcEnd)
    .accounts({
      // @ts-ignore
      match,
      user: keypairDeployer.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = keypairDeployer.publicKey;
  await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
    skipPreflight: false,
  });

  console.log(tx);
}

async function winnerClaimSol(matchId: any) {
  const [global] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_SEED)],
    program.programId,
  );

  let [match] = PublicKey.findProgramAddressSync(
    [Buffer.from(MATCH_SEED), matchId.toBuffer("le", 8)],
    program.programId,
  );

  const ix = await program.methods
    .winnerClaimSol(matchId)
    .accounts({
      // @ts-ignore
      matchAccount: match,
      squadWinner: new PublicKey(
        "BoDNKw2AwtLhVh5RMs9cVfWETSsADyGCgHsDZ3QAkmXj",
      ),
      feeRecipient: keypairFeeRecipient.publicKey,
      global,
      user: keypairDeployer.publicKey,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = keypairDeployer.publicKey;
  await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
    skipPreflight: true,
  });

  console.log(tx);
}

// async function updateGlobalSettings(
//   newFeeInBps: any,
//   feeRecipient: any,
//   season: any,
// ) {
//   const [global] = PublicKey.findProgramAddressSync(
//     [Buffer.from(GLOBAL_SEED)],
//     program.programId,
//   );

//   const ix = await program.methods
//     .updateGlobalSettings(newFeeInBps, feeRecipient, season)
//     .accounts({
//       // @ts-ignore
//       global,
//       user: keypairDeployer.publicKey,
//     })
//     .instruction();

//   const tx = new Transaction().add(ix);
//   tx.feePayer = keypairDeployer.publicKey;
//   await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
//     skipPreflight: false,
//   });

//   console.log(tx);
// }

async function getAllSquad() {
  const allAccountsOwned = await connection.getProgramAccounts(
    new PublicKey(program.idl.address),
    {
      filters: [{ dataSize: 366 }],
    },
  );

  const decodedDatas = allAccountsOwned.map((x) => {
    return decodeSquadAccountData(x.account.data);
  });

  console.log("decoded squad account", JSON.stringify(decodedDatas, null, 3));

  return decodedDatas;
}

async function getAllMatch() {
  const allAccountsOwned = await connection.getProgramAccounts(
    new PublicKey(program.idl.address),
    {
      filters: [{ dataSize: 146 }],
    },
  );

  const decodedDatas = allAccountsOwned.map((x) => {
    return decodeMatchAccountData(x.account.data);
  });
  console.log("decoded room data", JSON.stringify(decodedDatas, null, 3));
}

const decodeSquadAccountData = (buffer: Buffer) => {
  const borshAccountSchema = borsh.struct([
    borsh.u64("discriminator"),
    borsh.publicKey("owner"),
    borsh.vec(borsh.str(), "price_feed_ids"),
    borsh.u8("bump"),
    borsh.u8("squad_index"),
  ]);

  // console.log("Buffer length:", buffer.length);

  const decodedData = borshAccountSchema.decode(buffer);

  return decodedData;
};

const decodeMatchAccountData = (buffer: Buffer) => {
  const borshAccountSchema = borsh.struct([
    borsh.u64("discriminator"),
    borsh.u8("match_id"),
    borsh.u64("sol_bet_amount"),
    borsh.u64("duration"),
    borsh.bool("is_finished"),
    borsh.publicKey("host"),
    borsh.publicKey("challenger"),
    borsh.i64("start_timestamp"),
    borsh.i64("end_timestamp"),
    borsh.publicKey("winner"),
  ]);

  const decodedData = borshAccountSchema.decode(buffer);

  return decodedData;
};

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  },
);
