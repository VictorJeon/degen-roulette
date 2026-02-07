import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import pkg from "@coral-xyz/anchor";
const { Program, AnchorProvider, BN, Wallet } = pkg;
import { randomBytes } from "crypto";
import fs from "fs";

const PROGRAM_ID = new PublicKey("BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz");
const ORAO_VRF_PROGRAM_ID = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
const ORAO_VRF_TREASURY = new PublicKey("9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR");
const RPC = "https://api.devnet.solana.com";

// Load IDL
const idl = JSON.parse(fs.readFileSync("./idl/degen_roulette_v2.json", "utf-8"));

// House authority keypair (for funding test wallet)
const houseKeyPath = process.env.HOME + "/.config/solana/degen-roulette.json";
const houseKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(houseKeyPath, "utf-8"))));

// Generate test player wallet
const testPlayer = Keypair.generate();

async function main() {
  const connection = new Connection(RPC, "confirmed");
  
  console.log("=== DEGEN ROULETTE E2E TEST ===\n");
  console.log("House authority:", houseKey.publicKey.toBase58());
  console.log("Test player:", testPlayer.publicKey.toBase58());

  // Step 0: Fund test player from house authority wallet
  console.log("\n--- Step 0: Fund test player ---");
  const houseBalance = await connection.getBalance(houseKey.publicKey);
  console.log("House wallet balance:", houseBalance / LAMPORTS_PER_SOL, "SOL");
  
  // Airdrop to test player directly  
  console.log("Requesting airdrop to test player...");
  try {
    const sig = await connection.requestAirdrop(testPlayer.publicKey, 0.1 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    console.log("Airdrop success:", sig);
  } catch(e) {
    console.log("Airdrop failed, transferring from house wallet...");
    if (houseBalance < 0.03 * LAMPORTS_PER_SOL) {
      console.error("House wallet too low. Please fund it first.");
      process.exit(1);
    }
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: houseKey.publicKey,
        toPubkey: testPlayer.publicKey,
        lamports: 0.12 * LAMPORTS_PER_SOL,
      })
    );
    transferTx.feePayer = houseKey.publicKey;
    transferTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transferTx.sign(houseKey);
    const fundSig = await connection.sendRawTransaction(transferTx.serialize());
    await connection.confirmTransaction(fundSig, "confirmed");
    console.log("Funded test player:", fundSig);
  }
  
  const playerBalance = await connection.getBalance(testPlayer.publicKey);
  console.log("Test player balance:", playerBalance / LAMPORTS_PER_SOL, "SOL");

  // Setup Anchor
  const wallet = new Wallet(testPlayer);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(idl, provider);

  // Derive PDAs
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("game"), testPlayer.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const [houseConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("house_config")], PROGRAM_ID
  );
  const [houseVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("house_vault")], PROGRAM_ID
  );
  const [playerStatsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("player_stats"), testPlayer.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const vrfConfigPda = PublicKey.findProgramAddressSync(
    [Buffer.from("orao-vrf-network-configuration")],
    ORAO_VRF_PROGRAM_ID
  )[0];

  console.log("\nGame PDA:", gamePda.toBase58());
  console.log("PlayerStats PDA:", playerStatsPda.toBase58());

  // Step 1: Start game
  console.log("\n--- Step 1: start_game (0.01 SOL) ---");
  const betAmount = new BN(0.01 * LAMPORTS_PER_SOL);
  
  // Generate VRF seed
  const vrfSeed = new Uint8Array(randomBytes(32));
  // Ensure non-zero
  if (vrfSeed.every(b => b === 0)) vrfSeed[0] = 1;
  
  const randomPda = PublicKey.findProgramAddressSync(
    [Buffer.from("orao-vrf-randomness-request"), vrfSeed],
    ORAO_VRF_PROGRAM_ID
  )[0];

  console.log("VRF seed:", Buffer.from(vrfSeed).toString("hex").slice(0, 16) + "...");
  console.log("Random PDA:", randomPda.toBase58());

  try {
    const startTx = await program.methods
      .startGame(betAmount, Array.from(vrfSeed))
      .accounts({
        player: testPlayer.publicKey,
        game: gamePda,
        houseConfig: houseConfigPda,
        houseVault: houseVaultPda,
        playerStats: playerStatsPda,
        vrfConfig: vrfConfigPda,
        vrfTreasury: ORAO_VRF_TREASURY,
        random: randomPda,
        vrf: ORAO_VRF_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([testPlayer])
      .rpc();
    
    console.log("✅ start_game TX:", startTx);
  } catch (err) {
    console.error("❌ start_game FAILED:", err.message);
    if (err.logs) console.error("Logs:", err.logs.join("\n"));
    process.exit(1);
  }

  // Verify game state
  const gameAccount = await program.account.gameState.fetch(gamePda);
  console.log("Game status:", JSON.stringify(gameAccount.status));
  console.log("Bet amount:", Number(gameAccount.betAmount) / LAMPORTS_PER_SOL, "SOL");
  console.log("VRF seed stored:", Buffer.from(gameAccount.vrfSeed).toString("hex").slice(0, 16) + "...");

  // Step 2: Simulate pulls (client-side, no TX)
  console.log("\n--- Step 2: Client-side pulls ---");
  const roundsSurvived = 2; // Survive 2 rounds
  console.log("Rounds survived (client claim):", roundsSurvived);

  // Step 3: Wait for VRF fulfillment, then settle
  console.log("\n--- Step 3: settle_game ---");
  console.log("Waiting 5s for VRF oracle fulfillment...");
  await new Promise(r => setTimeout(r, 5000));

  // Check if VRF is fulfilled
  const randomInfo = await connection.getAccountInfo(randomPda);
  if (randomInfo) {
    console.log("Random account exists, data length:", randomInfo.data.length);
    console.log("Owner:", randomInfo.owner.toBase58());
  } else {
    console.log("⚠️ Random account NOT found (VRF may not be fulfilled)");
  }

  try {
    const settleTx = await program.methods
      .settleGame(roundsSurvived)
      .accounts({
        player: testPlayer.publicKey,
        game: gamePda,
        houseConfig: houseConfigPda,
        houseVault: houseVaultPda,
        playerStats: playerStatsPda,
        random: randomPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([testPlayer])
      .rpc();
    
    console.log("✅ settle_game TX:", settleTx);
  } catch (err) {
    console.error("❌ settle_game FAILED:", err.message);
    if (err.logs) {
      console.error("Logs:");
      err.logs.forEach(l => console.error("  ", l));
    }
    
    // If VRF not fulfilled, try with empty account (localnet fallback)
    console.log("\nNote: If VrfNotFulfilled, the oracle may not have processed the request yet.");
    console.log("On devnet, Orao VRF oracle should fulfill within a few seconds.");
    console.log("Retrying in 10s...");
    await new Promise(r => setTimeout(r, 10000));
    
    try {
      const retryTx = await program.methods
        .settleGame(roundsSurvived)
        .accounts({
          player: testPlayer.publicKey,
          game: gamePda,
          houseConfig: houseConfigPda,
          houseVault: houseVaultPda,
          playerStats: playerStatsPda,
          random: randomPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([testPlayer])
        .rpc();
      
      console.log("✅ settle_game RETRY TX:", retryTx);
    } catch (err2) {
      console.error("❌ settle_game RETRY FAILED:", err2.message);
      if (err2.logs) {
        console.error("Logs:");
        err2.logs.forEach(l => console.error("  ", l));
      }
      process.exit(1);
    }
  }

  // Verify final state
  const finalGame = await program.account.gameState.fetch(gamePda);
  console.log("\n--- Final State ---");
  console.log("Status:", JSON.stringify(finalGame.status));
  console.log("Rounds survived:", finalGame.roundsSurvived);
  console.log("Bullet position:", finalGame.bulletPosition);
  console.log("Payout:", Number(finalGame.payout) / LAMPORTS_PER_SOL, "SOL");
  console.log("Result multiplier:", Number(finalGame.resultMultiplier), "basis pts");

  const finalBalance = await connection.getBalance(testPlayer.publicKey);
  console.log("\nTest player final balance:", finalBalance / LAMPORTS_PER_SOL, "SOL");
  
  // Check PlayerStats
  const stats = await program.account.playerStats.fetch(playerStatsPda);
  console.log("\n--- Player Stats ---");
  console.log("Total games:", Number(stats.totalGames));
  console.log("Total wagered:", Number(stats.totalWagered) / LAMPORTS_PER_SOL, "SOL");
  console.log("Total won:", Number(stats.totalWon) / LAMPORTS_PER_SOL, "SOL");
  console.log("Total profit:", Number(stats.totalProfit) / LAMPORTS_PER_SOL, "SOL");

  console.log("\n=== E2E TEST COMPLETE ===");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
