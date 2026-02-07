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
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/degen_roulette_v2.json"));
  const programId = new PublicKey("DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7");
  const program = new anchor.Program(idl, provider);
  
  const [houseConfig] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], programId);
  const [houseVault] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], programId);
  const [gameState] = PublicKey.findProgramAddressSync(
    [Buffer.from("game"), walletKeypair.publicKey.toBuffer()],
    programId
  );
  
  console.log("=== DEGEN ROULETTE TEST ===\n");
  
  const betAmount = new anchor.BN(0.01 * LAMPORTS_PER_SOL); // Min bet
  
  // 1. Init Game
  console.log("1. Initializing game with 0.01 SOL bet...");
  try {
    const tx = await program.methods
      .initGame(betAmount)
      .accounts({
        gameState,
        houseConfig,
        houseVault,
        player: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Game initialized:", tx);
  } catch (err) {
    if (err.message.includes("already in use")) {
      console.log("Game already exists, continuing...");
    } else {
      console.error("❌ Init Error:", err.message);
      return;
    }
  }
  
  // 2. Pull Trigger
  console.log("\n2. Pulling trigger...");
  try {
    const tx = await program.methods
      .pullTrigger()
      .accounts({
        gameState,
        houseConfig,
        houseVault,
        player: walletKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Trigger pulled:", tx);
    
    // Check result
    const game = await program.account.gameState.fetch(gameState);
    console.log("\n=== RESULT ===");
    console.log("Current Round:", game.currentRound);
    console.log("Alive:", game.isAlive);
    console.log("Bet Amount:", game.betAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("Potential Win:", game.potentialWin.toNumber() / LAMPORTS_PER_SOL, "SOL");
    
    if (!game.isAlive) {
      console.log("\n💀 DEAD! Game over.");
    } else {
      console.log("\n🎉 SURVIVED! Can continue or cash out.");
    }
    
  } catch (err) {
    console.error("❌ Pull Error:", err.message);
  }
}

main();
