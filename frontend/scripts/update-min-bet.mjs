import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import pkg from "@coral-xyz/anchor";
const { Program, AnchorProvider, BN, Wallet } = pkg;
import fs from "fs";

const PROGRAM_ID = new PublicKey("98RABzywqR9v33GmioVFeFrapM1LC5RiwmJbXdEPvx59");
const RPC = "https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6";
const idl = JSON.parse(fs.readFileSync("../anchor-v2/target/idl/degen_roulette_v2.json", "utf-8"));

const houseKeyPath = process.env.HOME + "/.config/solana/degen-roulette.json";
const houseKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(houseKeyPath, "utf-8"))));

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const wallet = new Wallet(houseKey);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(idl, provider);

  const [houseConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("house_config")], PROGRAM_ID
  );

  // Read current config
  const config = await program.account.houseConfig.fetch(houseConfigPda);
  console.log("Current min_bet:", Number(config.minBet) / 1e9, "SOL");

  // Update to 0.001 SOL = 1_000_000 lamports
  const newMinBet = new BN(1_000_000);
  
  const tx = await program.methods
    .updateConfig(newMinBet, null, null)
    .accounts({
      houseConfig: houseConfigPda,
      authority: houseKey.publicKey,
    })
    .signers([houseKey])
    .rpc();

  console.log("✅ update_config TX:", tx);

  const updated = await program.account.houseConfig.fetch(houseConfigPda);
  console.log("New min_bet:", Number(updated.minBet) / 1e9, "SOL");
}

main().catch(console.error);
