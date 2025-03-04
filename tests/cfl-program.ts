import * as anchor from "@coral-xyz/anchor";
import { Program, Wallet } from "@coral-xyz/anchor";
import {
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

  it("Get Price", async () => {
    const solUsdPriceFeedAccount = pythSolanaReceiver
      .getPriceFeedAccountAddress(
        0,
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      )
      .toBase58();
    console.log(solUsdPriceFeedAccount);

    const ix = await program.methods
      .createTeam(
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      )
      .accounts({
        priceUpdate: solUsdPriceFeedAccount,
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = keypairDeployer.publicKey;
    console.log(await connection.simulateTransaction(tx));
    await sendAndConfirmTransaction(connection, tx, [keypairDeployer], {
      skipPreflight: false,
    });
  });
});
