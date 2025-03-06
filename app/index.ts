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
  // const pf1 =
  //   "0xb9312a7ee50e189ef045aa3c7842e099b061bd9bdc99ac645956c3b660dc8cce";
  // const pf2 =
  //   "0x17894b9fff49cd07efeab94a0d02db16f158efe04e0dee1db6af5f069082ce83";
  // const pf3 =
  //   "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
  // const pf4 =
  //   "0x656cc2a39dd795bdecb59de810d4f4d1e74c25fe4c42d0bf1c65a38d74df48e9";
  // const pf5 =
  //   "0x63a45218d6b13ffd28ca04748615511bf70eff80a3411c97d96b8ed74a6decab";
  // const pfs = [pf1, pf2, pf3, pf4, pf5];
  // const percentages = [
  //   parseFloat("20"),
  //   parseFloat("20"),
  //   parseFloat("20"),
  //   parseFloat("20"),
  //   parseFloat("20"),
  // ];
  // const squadIndex = 0;
  // await createSquad(pfs, percentages, squadIndex);

  /// =================================================== \\\

  const matchId = 0;
  const start = new BN(1741266000);
  const duration = new BN(604800);
  const sol = new BN(0.01 * LAMPORTS_PER_SOL);
  const squadIndex = 0;
  await createMatch(matchId, start, duration, sol, squadIndex);

  /// =================================================== \\\

  // const matchId = 0;
  // const challengerSquadIndex = 0;
  // await challenge(matchId, challengerSquadIndex);
  /// =================================================== \\\

  // const matchId = 0;
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

async function createSquad(
  pfs: string[],
  percentage: number[],
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
      .createSquad(squadIndex, pfs, percentage)
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
  matchId: number,
  start: any,
  duration: any,
  sol: any,
  squadIndex: number,
) {
  try {
    let [squad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([squadIndex])),
      ],
      program.programId,
    );

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([matchId]))],
      program.programId,
    );

    const tx = await program.methods
      .createMatch(matchId, start, duration, sol)
      .accounts({
        // @ts-ignore
        squad,
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

async function challenge(matchId: number, challengerSquadIndex: number) {
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
      [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([matchId]))],
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
