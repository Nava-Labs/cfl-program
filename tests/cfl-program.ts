import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import * as borsh from "@coral-xyz/borsh";
import {
  AccountInfo,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { CflProgram } from "../target/types/cfl_program";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";
import { BN } from "bn.js";

const secretKeyDeployer = Uint8Array.from(
  require("../environment/deployer.json"),
);
const keypairDeployer = Keypair.fromSecretKey(secretKeyDeployer);

const GLOBAL_SEED = "Global";
const SQUAD_SEED = "Squad";
const PROFILE_SEED = "Profile";
const MATCH_SEED = "Match";

describe("cfl-program", () => {
  const provider = anchor.AnchorProvider.env();

  const connection = anchor.getProvider().connection;

  const wallet = new Wallet(keypairDeployer);

  const pythSolanaReceiver = new PythSolanaReceiver({
    connection,
    wallet,
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.CflProgram as Program<CflProgram>;

  it("Is initialized!", async () => {
    const ix = await program.methods.initialize().instruction();
    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;

    console.log(await connection.simulateTransaction(tx));

    await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
      skipPreflight: false,
    });

    // const [global] = PublicKey.findProgramAddressSync(
    //   [Buffer.from(GLOBAL_SEED)],
    //   program.programId,
    // );

    // let state = await program.account.global.fetch(global);
    // console.log(state);
  });

  it("Squad Created!", async () => {
    const squadCount = 3;
    for (let i = 0; i < squadCount; i++) {
      const pf1 =
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
      const pf2 =
        "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
      const pf3 =
        "0x656cc2a39dd795bdecb59de810d4f4d1e74c25fe4c42d0bf1c65a38d74df48e9";

      let pfs = [pf1, pf2, pf3];
      let percentages = [
        parseFloat("1.5"),
        parseFloat("20.5"),
        parseFloat("66.667"),
      ];

      let [profile] = PublicKey.findProgramAddressSync(
        [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
        program.programId,
      );

      let [squad] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(SQUAD_SEED),
          keypairDeployer.publicKey.toBuffer(),
          Buffer.from(new Uint8Array([i])),
        ],
        program.programId,
      );
      console.log("Squad pda", squad.toBase58());

      const ix = await program.methods
        .createSquad(i, pfs, percentages)
        .accounts({
          // @ts-ignore
          squad,
          userProfile: profile,
          user: keypairDeployer.publicKey,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      tx.feePayer = keypairDeployer.publicKey;

      await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
        skipPreflight: false,
      });
    }

    await sleep(10);

    const [profile] = PublicKey.findProgramAddressSync(
      [Buffer.from(PROFILE_SEED), keypairDeployer.publicKey.toBuffer()],
      program.programId,
    );

    const profileState = await program.account.userProfile.fetch(profile);
    console.log("Profile State", JSON.stringify(profileState, null, 3));

    // const squadCreated = profileState.squadCount;

    // for (let i = 0; i < squadCreated; i++) {
    //   const [squad] = PublicKey.findProgramAddressSync(
    //     [
    //       Buffer.from(SQUAD_SEED),
    //       keypairDeployer.publicKey.toBuffer(),
    //       Buffer.from(new Uint8Array([i])),
    //     ],
    //     program.programId,
    //   );

    //   const squadState = await program.account.squad.fetch(squad);
    //   console.log("Squad State", JSON.stringify(squadState, null, 3));
    // }
  });

  it("Get Squad Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 450 }],
      },
    );
    // console.log(allAccountsOwned);

    const decodedDatas = allAccountsOwned.map((x) => {
      return decodeSquadAccountData(x.account.data);
    });
    console.log("decoded squad account", JSON.stringify(decodedDatas, null, 3));
  });

  const sleep = async (ms: number) => {
    return new Promise((r) => setTimeout(r, ms));
  };

  const decodeSquadAccountData = (buffer: Buffer) => {
    const borshAccountSchema = borsh.struct([
      borsh.u64("discriminator"),
      borsh.publicKey("owner"),
      borsh.vec(borsh.str(), "token_price_feed_ids"),
      borsh.vec(borsh.f64(), "token_weghts"),
      borsh.u8("bump"),
      borsh.u8("squad_index"),
    ]);

    // console.log("Buffer length:", buffer.length);

    const decodedData = borshAccountSchema.decode(buffer);

    return decodedData;
  };

  it("Match Created!", async () => {
    let [challengerSquad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([0])),
      ],
      program.programId,
    );

    const id = 0;

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([id]))],
      program.programId,
    );

    const start = new BN(1234);
    const duration = new BN(123);
    const sol = new BN(LAMPORTS_PER_SOL);

    const ix = await program.methods
      .createMatch(id, start, duration, sol)
      .accounts({
        // @ts-ignore
        challengerSquad,
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

  it("Get Match Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 146 }],
      },
    );
    console.log(allAccountsOwned);

    const decodedDatas = allAccountsOwned.map((x) => {
      return decodeMatchAccountData(x.account.data);
    });
    console.log("decoded match data", JSON.stringify(decodedDatas, null, 3));
  });

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

  it("Challenge", async () => {
    let [challengerSquad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const id = 0;

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([id]))],
      program.programId,
    );

    const ix = await program.methods
      .challenge(id)
      .accounts({
        // @ts-ignore
        challengerSquad,
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

  it("Get Match Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 146 }],
      },
    );
    // console.log(allAccountsOwned);

    const decodedDatas = allAccountsOwned.map((x) => {
      return decodeMatchAccountData(x.account.data);
    });
    console.log("decoded match data", JSON.stringify(decodedDatas, null, 3));
  });

  it("Finalize", async () => {
    const id = 0;

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([id]))],
      program.programId,
    );

    let [winner] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([1])),
      ],
      program.programId,
    );

    const ix = await program.methods
      .finalize(id, winner)
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

  it("Get Room Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 146 }],
      },
    );
    // console.log(allAccountsOwned);

    const decodedDatas = allAccountsOwned.map((x) => {
      return decodeMatchAccountData(x.account.data);
    });
    console.log("decoded match data", JSON.stringify(decodedDatas, null, 3));
  });

  it("Claim", async () => {
    const id = 0;

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), Buffer.from(new Uint8Array([id]))],
      program.programId,
    );

    const ix = await program.methods
      .claimSol(id)
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

  it("Get Match Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 146 }],
      },
    );
    console.log(allAccountsOwned);

    // const decodedDatas = allAccountsOwned.map((x) => {
    //   return decodeRoomAccountData(x.account.data);
    // });
    // console.log("decoded room data", JSON.stringify(decodedDatas, null, 3));
  });
});
