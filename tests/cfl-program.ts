import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import * as borsh from "@coral-xyz/borsh";
import {
  AccountInfo,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { CflProgram } from "../target/types/cfl_program";
import { PythSolanaReceiver } from "@pythnetwork/pyth-solana-receiver";

const secretKeyDeployer = Uint8Array.from(
  require("../environment/deployer.json"),
);
const keypairDeployer = Keypair.fromSecretKey(secretKeyDeployer);

const GLOBAL_SEED = "Global";
const SQUAD_SEED = "Squad";
const PROFILE_SEED = "Profile";

describe("cfl-program", () => {
  const provider = anchor.AnchorProvider.env();

  const connection = anchor.getProvider().connection;
  // const connection = new Connection("http://127.0.0.1:8899");
  // const connection = new Connection("https://rpc.mainnet-alpha.sonic.game");

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
      const mint1 = Keypair.generate().publicKey;
      const mint2 = Keypair.generate().publicKey;

      const ix = await program.methods
        .createSquad(i, mint1, mint2)
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
    console.log(profileState);

    const squadCreated = profileState.squadCount;

    for (let i = 0; i < squadCreated; i++) {
      const [squad] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(SQUAD_SEED),
          keypairDeployer.publicKey.toBuffer(),
          Buffer.from(new Uint8Array([i])),
        ],
        program.programId,
      );

      const squadState = await program.account.squad.fetch(squad);
      console.log(squadState);
    }
  });

  it("Get Squad Created", async () => {
    const allAccountsOwned = await connection.getProgramAccounts(
      new PublicKey(program.idl.address),
      {
        // dataSlice: { offset: 8, length: 32 },
        filters: [{ dataSize: 106 }],
      },
    );
    console.log(allAccountsOwned);

    const decodedDatas = allAccountsOwned.map((x) => {
      return decodeSquadAccountData(x.account.data);
    });
    console.log(decodedDatas);
  });

  const sleep = async (ms: number) => {
    return new Promise((r) => setTimeout(r, ms));
  };

  const decodeSquadAccountData = (buffer: Buffer) => {
    const borshAccountSchema = borsh.struct([
      borsh.u64("discriminator"),
      borsh.publicKey("owner"),
      borsh.publicKey("mint1"),
      borsh.publicKey("mint2"),
      borsh.u8("bump"),
      borsh.u8("squad_index"),
    ]);

    console.log("Buffer length:", buffer.length);

    const decodedData = borshAccountSchema.decode(buffer);

    return decodedData;
  };
});
