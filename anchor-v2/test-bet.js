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
  anchor.setProvider(provider);
  
  const idl = JSON.parse(fs.readFileSync("./target/idl/degen_roulette_v2.json"));
  const programId = new PublicKey("DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7");
  const program = new anchor.Program(idl, provider);
  
  const [houseConfig] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], programId);
  const [houseVault] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], programId);
  const [gameState] = PublicKey.findProgramAddressSync(
    [Buffer.from("game"), walletKeypair.publicKey.toBuffer()],
    programId
  );
  
  console.log("Wallet:", walletKeypair.publicKey.toBase58());
  console.log("House Config:", houseConfig.toBase58());
  console.log("Game State:", gameState.toBase58());
  
  // Check if game exists
  try {
    const game = await program.account.gameState.fetch(gameState);
    console.log("Existing game found, round:", game.currentRound);
  } catch (e) {
    console.log("No existing game, initializing new one...");
    
    const betAmount = new anchor.BN(0.05 * LAMPORTS_PER_SOL); // 0.05 SOL
    
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
      
      console.log("✅ Game initialized! TX:", tx);
      console.log("https://solscan.io/tx/" + tx + "?cluster=devnet");
    } catch (err) {
      console.error("❌ Error:", err.message);
    }
  }
}

main();
