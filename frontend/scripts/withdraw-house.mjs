import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createHash } from "crypto";
import fs from "fs";

const PROGRAM_ID = new PublicKey("BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz");
const RPC = "https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6";

function ixDisc(name) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

const walletPath = process.env.HOME + "/.config/solana/degen-roulette.json";
const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));

async function main() {
  const connection = new Connection(RPC, "confirmed");

  const [houseConfig] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], PROGRAM_ID);
  const [houseVault] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], PROGRAM_ID);

  const vaultBal = await connection.getBalance(houseVault);
  const withdrawAmount = vaultBal - 10_000_000; // keep 0.01 SOL in vault
  
  console.log(`Vault balance: ${vaultBal / 1e9} SOL`);
  console.log(`Withdrawing: ${withdrawAmount / 1e9} SOL`);

  // withdraw_house(amount: u64) — accounts: house_config, house_vault, authority, recipient, system_program
  const amountBuf = Buffer.alloc(8);
  amountBuf.writeBigUInt64LE(BigInt(withdrawAmount));
  const data = Buffer.concat([ixDisc("withdraw_house"), amountBuf]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: houseConfig, isSigner: false, isWritable: false },
      { pubkey: houseVault, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: false, isWritable: true }, // recipient = authority
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(wallet);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  console.log("Withdraw TX:", sig);

  const walletBal = await connection.getBalance(wallet.publicKey);
  console.log(`Wallet balance: ${walletBal / 1e9} SOL`);
}

main().catch(console.error);
