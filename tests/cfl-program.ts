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
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
      const pf3 =
        "0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f";
      const pf4 =
        "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
      const pf5 =
        "0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8";
      const pf6 =
        "0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d";
      const pf7 =
        "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221";
      const pf8 =
        "0x67aed5a24fdad045475e7195c98a98aea119c763f272d4523f5bac93a4f33c2b";
      const pf9 =
        "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
      const pf10 =
        "0xb7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850";

      const pfs = [pf1, pf2, pf3, pf4, pf5, pf6, pf7, pf8, pf9, pf10];
      const percentages = [
        parseFloat("10"),
        parseFloat("20"),
        parseFloat("30"),
        parseFloat("40"),
        parseFloat("50"),
        parseFloat("60"),
        parseFloat("70"),
        parseFloat("80"),
        parseFloat("90"),
        parseFloat("100"),
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

      // console.log(await connection.simulateTransaction(tx));

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

    const squadCreated = profileState.squadCount;

    // for (let i = 0; i < squadCreated; i++) {
    //   const [squad] = PublicKey.findProgramAddressSync(
    //     [
    //       Buffer.from(SQUAD_SEED),
    //       keypairDeployer.publicKey.toBuffer(),
    //       Buffer.from(new Uint8Array([i])),
    //     ],
    //     program.programId,
    //   );

    // const squadState = await program.account.squad.fetch(squad);
    // console.log("Squad State", JSON.stringify(squadState, null, 3));
    // }
  });

  it("Get Squad Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 830 }],
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
    let [hostSquad] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SQUAD_SEED),
        keypairDeployer.publicKey.toBuffer(),
        Buffer.from(new Uint8Array([0])),
      ],
      program.programId,
    );

    const id = new BN(0);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
      program.programId,
    );

    console.log(match);

    const start = new BN(1234);
    const duration = new BN(123);
    const sol = new BN(LAMPORTS_PER_SOL);
    const matchType = 1;

    const ix = await program.methods
      .createMatch(id, start, duration, sol, matchType)
      .accounts({
        // @ts-ignore
        hostSquad,
        // @ts-ignore
        matchAccount: match,
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
        filters: [{ dataSize: 211 }],
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
      borsh.u64("match_id"),
      borsh.publicKey("host_squad"),
      borsh.publicKey("challenger_squad"),
      borsh.publicKey("host_squad_owner"),
      borsh.publicKey("challenger_squad_owner"),
      borsh.u64("sol_bet_amount"),
      borsh.u64("duration"),
      borsh.i64("start_timestamp"),
      borsh.i64("end_timestamp"),
      borsh.bool("is_finished"),
      borsh.publicKey("winner"),
      borsh.u8("bump"),
      borsh.u8("match_type"),
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

    const id = new BN(0);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
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
        filters: [{ dataSize: 211 }],
      },
    );
    // console.log(allAccountsOwned);

    const decodedDatas = allAccountsOwned.map((x) => {
      return decodeMatchAccountData(x.account.data);
    });
    console.log("decoded match data", JSON.stringify(decodedDatas, null, 3));
  });

  it("Finalize", async () => {
    const id = new BN(0);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
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

  it("Get Match Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 211 }],
      },
    );
    // console.log(allAccountsOwned);

    const decodedDatas = allAccountsOwned.map((x) => {
      return decodeMatchAccountData(x.account.data);
    });
    console.log("decoded match data", JSON.stringify(decodedDatas, null, 3));
  });

  it("Claim", async () => {
    const id = new BN(0);

    let [match] = PublicKey.findProgramAddressSync(
      [Buffer.from(MATCH_SEED), id.toBuffer("le", 8)],
      program.programId,
    );

    const ix = await program.methods
      .claimSol(id)
      .accounts({
        // @ts-ignore
        match_account: match,
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
        filters: [{ dataSize: 211 }],
      },
    );
    console.log(allAccountsOwned);

    // const decodedDatas = allAccountsOwned.map((x) => {
    //   return decodeRoomAccountData(x.account.data);
    // });
    // console.log("decoded room data", JSON.stringify(decodedDatas, null, 3));
  });
});
