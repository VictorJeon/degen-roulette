const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
  
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
  
  // Update maxBetPct to 1000 (10% of vault)
  // With 0.15 SOL vault, max bet = 0.015 SOL > min bet 0.01 SOL
  try {
    const tx = await program.methods
      .updateConfig(
        null, // minBet - keep same
        1000, // maxBetPct - 10%
        null  // houseEdgeBps - keep same
      )
      .accounts({
        houseConfig,
        authority: walletKeypair.publicKey,
      })
      .rpc();
    
    console.log("✅ Config updated! TX:", tx);
    
    const config = await program.account.houseConfig.fetch(houseConfig);
    const vaultBalance = await connection.getBalance(houseVault);
    console.log("Max Bet %:", config.maxBetPct);
    console.log("Max Bet Amount:", (vaultBalance * config.maxBetPct / 10000) / 1e9, "SOL");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();
