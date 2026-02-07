const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
  
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/degen-roulette.json")))
  );
  
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/degen_roulette_v2.json"));
  const programId = new PublicKey("DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7");
  const program = new anchor.Program(idl, provider);
  
  const [houseConfig] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], programId);
  const [houseVault] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], programId);
  
  const fundAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL
  
  console.log("Funding house vault with 0.1 SOL...");
  
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
    
    const balance = await connection.getBalance(houseVault);
    console.log("House Vault Balance:", balance / LAMPORTS_PER_SOL, "SOL");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();
