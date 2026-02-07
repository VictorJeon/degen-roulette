const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
  const RPC = "https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6";
  const connection = new anchor.web3.Connection(RPC, "confirmed");

  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/degen-roulette.json")))
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const PROGRAM_ID = new PublicKey("98RABzywqR9v33GmioVFeFrapM1LC5RiwmJbXdEPvx59");
  const idl = JSON.parse(fs.readFileSync("./target/idl/degen_roulette_v2.json"));
  const program = new anchor.Program(idl, provider);

  const [houseConfig] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], PROGRAM_ID);
  const [houseVault] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], PROGRAM_ID);

  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("HouseConfig PDA:", houseConfig.toBase58());
  console.log("HouseVault PDA:", houseVault.toBase58());
  console.log("Authority:", walletKeypair.publicKey.toBase58());

  // Step 1: Initialize house
  console.log("\n=== Step 1: Initialize House ===");
  try {
    const tx = await program.methods
      .initializeHouse()
      .accounts({
        authority: walletKeypair.publicKey,
        houseConfig,
        houseVault,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ House initialized! TX:", tx);
  } catch (err) {
    if (err.message.includes("already in use")) {
      console.log("ℹ️  House already initialized, skipping.");
    } else {
      console.error("❌ Init error:", err.message);
      return;
    }
  }

  // Step 2: Fund house vault
  const fundAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
  console.log("\n=== Step 2: Fund House Vault (0.5 SOL) ===");
  try {
    const tx = await program.methods
      .fundHouse(fundAmount)
      .accounts({
        houseConfig,
        houseVault,
        funder: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ House funded! TX:", tx);
  } catch (err) {
    console.error("❌ Fund error:", err.message);
  }

  // Check balances
  const vaultBal = await connection.getBalance(houseVault);
  const walletBal = await connection.getBalance(walletKeypair.publicKey);
  console.log("\n=== Final Balances ===");
  console.log("House Vault:", vaultBal / LAMPORTS_PER_SOL, "SOL");
  console.log("Wallet:", walletBal / LAMPORTS_PER_SOL, "SOL");
}

main().catch(console.error);
