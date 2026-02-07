import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createHash } from "crypto";
import fs from "fs";

const PROGRAM_ID = new PublicKey("BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz");
const RPC = "https://api.devnet.solana.com";

// Anchor instruction discriminator: sha256("global:<name>")[0..8]
function ixDisc(name) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

// Load wallet
const walletPath = process.env.HOME + "/.config/solana/degen-roulette.json";
const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));

async function main() {
  const connection = new Connection(RPC, "confirmed");

  // Derive PDAs
  const [houseConfig, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("house_config")], PROGRAM_ID
  );
  const [houseVault, vaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("house_vault")], PROGRAM_ID
  );

  console.log("Authority:", wallet.publicKey.toBase58());
  console.log("HouseConfig PDA:", houseConfig.toBase58());
  console.log("HouseVault PDA:", houseVault.toBase58());

  // Check if already initialized
  const configAccount = await connection.getAccountInfo(houseConfig);
  if (configAccount) {
    console.log("\nHouseConfig already initialized, skipping initialize_house");
  } else {
    console.log("\n--- initialize_house ---");
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: houseConfig, isSigner: false, isWritable: true },
        { pubkey: houseVault, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: ixDisc("initialize_house"),
    });
    const tx = new Transaction().add(ix);
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.sign(wallet);
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    console.log("initialize_house TX:", sig);
  }

  // Fund house with almost all remaining SOL
  const balance = await connection.getBalance(wallet.publicKey);
  const keepLamports = 50_000_000; // keep 0.05 SOL
  const fundAmount = balance - keepLamports;

  if (fundAmount <= 0) {
    console.log("Not enough SOL to fund house");
    return;
  }

  console.log(`\n--- fund_house ---`);
  console.log(`Wallet balance: ${balance / 1e9} SOL`);
  console.log(`Funding: ${fundAmount / 1e9} SOL`);
  console.log(`Keeping: ${keepLamports / 1e9} SOL`);

  // fund_house(amount: u64) - data = disc + le_u64
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(BigInt(fundAmount));
  const fundData = Buffer.concat([ixDisc("fund_house"), amountBuf]);

  const fundIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: houseConfig, isSigner: false, isWritable: false },
      { pubkey: houseVault, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: fundData,
  });
  const fundTx = new Transaction().add(fundIx);
  fundTx.feePayer = wallet.publicKey;
  fundTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  fundTx.sign(wallet);
  const fundSig = await connection.sendRawTransaction(fundTx.serialize());
  await connection.confirmTransaction(fundSig, "confirmed");
  console.log("fund_house TX:", fundSig);

  // Verify
  const vaultBal = await connection.getBalance(houseVault);
  const walletBal = await connection.getBalance(wallet.publicKey);
  console.log(`\nHouseVault balance: ${vaultBal / 1e9} SOL`);
  console.log(`Wallet balance: ${walletBal / 1e9} SOL`);
  console.log("Done!");
}

main().catch(console.error);
