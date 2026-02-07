const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
  const connection = new anchor.web3.Connection("https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6", "confirmed");
  
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/degen-roulette.json")))
  );
  
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/degen_roulette_v2.json"));
  const programId = new PublicKey("DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7");
  const program = new anchor.Program(idl, provider);
  
  const [houseConfig] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], programId);
  const [houseVault] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], programId);
  
  // Check wallet balance first
  const walletBalance = await connection.getBalance(walletKeypair.publicKey);
  console.log("Wallet Balance:", walletBalance / LAMPORTS_PER_SOL, "SOL");
  
  // Max bet needs to be >= min bet (0.01 SOL)
  // If maxBetPct = 100 (1%), then vault needs 1 SOL for 0.01 max bet
  // But we only have ~0.12 SOL in wallet. Let's add what we can.
  
  const fundAmount = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
  
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
    
    console.log("✅ Added 0.05 SOL to house");
    
    const vaultBalance = await connection.getBalance(houseVault);
    console.log("House Vault Balance:", vaultBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("Max Bet Now:", (vaultBalance / 100) / LAMPORTS_PER_SOL, "SOL");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();
