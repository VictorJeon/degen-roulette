import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import fs from "fs";

const PROGRAM_ID = new PublicKey("BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz");
const RPC = "https://api.devnet.solana.com";

// Load wallet keypair
const walletPath = process.env.HOME + "/.config/solana/degen-roulette.json";
const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// Load IDL
const idlPath = __dirname + "/../anchor-v2/target/idl/degen_roulette_v2.json";
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = new anchor.Program(idl, provider);

  // Derive PDAs
  const [houseConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("house_config")],
    PROGRAM_ID
  );
  const [houseVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("house_vault")],
    PROGRAM_ID
  );

  console.log("Authority:", wallet.publicKey.toBase58());
  console.log("HouseConfig PDA:", houseConfig.toBase58());
  console.log("HouseVault PDA:", houseVault.toBase58());

  // Check if already initialized
  const configAccount = await connection.getAccountInfo(houseConfig);
  if (configAccount) {
    console.log("HouseConfig already initialized, skipping initialize_house");
  } else {
    console.log("\n--- initialize_house ---");
    const tx = await (program.methods as any)
      .initializeHouse()
      .accounts({
        houseConfig,
        houseVault,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();
    console.log("initialize_house TX:", tx);
  }

  // Check balance and fund
  const balance = await connection.getBalance(wallet.publicKey);
  const keepLamports = 50_000_000; // keep 0.05 SOL for future TXs
  const fundAmount = balance - keepLamports;

  if (fundAmount <= 0) {
    console.log("Not enough SOL to fund house");
    return;
  }

  console.log(`\n--- fund_house ---`);
  console.log(`Wallet balance: ${balance / 1e9} SOL`);
  console.log(`Funding house with: ${fundAmount / 1e9} SOL`);
  console.log(`Keeping: ${keepLamports / 1e9} SOL`);

  const fundTx = await (program.methods as any)
    .fundHouse(new anchor.BN(fundAmount))
    .accounts({
      houseConfig,
      houseVault,
      funder: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();
  console.log("fund_house TX:", fundTx);

  // Verify
  const vaultBalance = await connection.getBalance(houseVault);
  console.log(`\nHouseVault balance: ${vaultBalance / 1e9} SOL`);
  console.log("Done!");
}

main().catch(console.error);
