import * as anchor from "@coral-xyz/anchor";
// import * as splToken from "@solana/spl-token";
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
} from "@solana/web3.js";
import { MemeLeagueProgram } from "../target/types/meme_league_program";
import { LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// @ts-ignore
import IDL from "../target/idl/meme_league_program.json";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const secretKeyDeployer = Uint8Array.from(
  require("../environment/deployer.json"),
);
const keypairDeployer = Keypair.fromSecretKey(secretKeyDeployer);

async function main() {
  await createTeam();
}

async function createTeam() {
  // const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const connection = new Connection("https://rpc.mainnet-alpha.sonic.game");

  // const connection = new Connection(
  //   "https://rpc.mainnet-alpha.sonic.game",
  //   "confirmed",
  // );

  // Create the provider
  const provider = new AnchorProvider(
    connection,
    new anchor.Wallet(keypairDeployer),
    AnchorProvider.defaultOptions(),
  );
  anchor.setProvider(provider);

  const wallet = new anchor.Wallet(keypairDeployer);

  const pythSolanaReceiver = new PythSolanaReceiver({
    connection,
    wallet,
  });

  const program = new Program(IDL as MemeLeagueProgram, provider);

  const solUsdPriceFeedAccount = pythSolanaReceiver
    .getPriceFeedAccountAddress(
      0,
      "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    )
    .toBase58();
  console.log(solUsdPriceFeedAccount);

  try {
    // Send the transaction
    const tx = await program.methods
      .createTeam(
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
      )
      .accounts({
        priceUpdate: solUsdPriceFeedAccount,
        user: keypairDeployer.publicKey,
      })
      .signers([keypairDeployer])
      .rpc();

    console.log("Transaction signature", tx);
  } catch (error) {
    console.error("Error initalize:", error);
  }
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  },
);
