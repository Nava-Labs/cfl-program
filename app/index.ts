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

const secretKeyDeployer = Uint8Array.from(
  require("../environment/deployer.json"),
);
const keypairDeployer = Keypair.fromSecretKey(secretKeyDeployer);

const GLOBAL_SEED = "Global";
const SQUAD_SEED = "Squad";
const PROFILE_SEED = "Profile";
const MATCH_SEED = "Match";

async function main() {
  // / =================================================== \\\
  // await initialize();
  // / =================================================== \\\

  // const squadIndex = 1;

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

  // const positionIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // await createSquad(pfs, percentages, positionIndex, squadIndex);

  /// =================================================== \\\

  const matchId = new BN(3);
  const start = new BN(1741615200);
  const duration = new BN(604800);
  const sol = new BN(0.01 * LAMPORTS_PER_SOL);
  const squadIndex = 1;
  const matchType = 0;
  await createMatch(matchId, start, duration, sol, squadIndex, matchType);

  // / =================================================== \\\
  // const matchId = new BN(0);
  // const challengerSquadIndex = 0;
  // await challenge(matchId, challengerSquadIndex);
  /// =================================================== \\\
  // const matchId = new BN(0);
  // const winner = new PublicKey("");
  // await finalize();
}

// const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const connection = new Connection("https://api.testnet.sonic.game/");

const provider = new AnchorProvider(
  connection,
  new anchor.Wallet(keypairDeployer),
  AnchorProvider.defaultOptions(),
);
anchor.setProvider(provider);

const wallet = new anchor.Wallet(keypairDeployer);

const program = new Program(IDL as CflProgram, provider);

async function initialize() {
  try {
    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_SEED)],
      program.programId,
    );

    const tx = await program.methods
      .initialize()
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
  positionIndex: number[],
  squadIndex: number,
) {
  try {
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

    const tx = await program.methods
      .createSquad(squadIndex, pfs, percentage, positionIndex)
      .accounts({
        // @ts-ignore
        squad,
        userProfile: profile,
        user: keypairDeployer.publicKey,
      })
      .signers([keypairDeployer])
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

async function finalize(matchId: any, winner: PublicKey) {
  let [match] = PublicKey.findProgramAddressSync(
    [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([matchId]))],
    program.programId,
  );

  const ix = await program.methods
    .finalize(matchId, winner)
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
}

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
