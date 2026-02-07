import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import pkg from "@coral-xyz/anchor";
const { Program, AnchorProvider, BN, Wallet } = pkg;
import { createHash, randomBytes } from "crypto";
import fs from "fs";

const PROGRAM_ID = new PublicKey("98RABzywqR9v33GmioVFeFrapM1LC5RiwmJbXdEPvx59");
const RPC = "https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6";

// Load IDL from target (has correct program address)
const idl = JSON.parse(fs.readFileSync("../anchor-v2/target/idl/degen_roulette_v2.json", "utf-8"));

// House authority keypair
const houseKeyPath = process.env.HOME + "/.config/solana/degen-roulette.json";
const houseKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(houseKeyPath, "utf-8"))));

// Test player
const testPlayer = Keypair.generate();

async function main() {
  const connection = new Connection(RPC, "confirmed");

  console.log("=== DEGEN ROULETTE v3 E2E TEST ===\n");
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("House authority:", houseKey.publicKey.toBase58());
  console.log("Test player:", testPlayer.publicKey.toBase58());

  // Step 0: Fund test player
  console.log("\n--- Step 0: Fund test player ---");
  const houseBalance = await connection.getBalance(houseKey.publicKey);
  console.log("House wallet balance:", houseBalance / LAMPORTS_PER_SOL, "SOL");

  if (houseBalance < 0.05 * LAMPORTS_PER_SOL) {
    console.error("House wallet too low.");
    process.exit(1);
  }

  const transferTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: houseKey.publicKey,
      toPubkey: testPlayer.publicKey,
      lamports: 0.05 * LAMPORTS_PER_SOL,
    })
  );
  transferTx.feePayer = houseKey.publicKey;
  transferTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transferTx.sign(houseKey);
  const fundSig = await connection.sendRawTransaction(transferTx.serialize());
  await connection.confirmTransaction(fundSig, "confirmed");
  console.log("Funded test player:", fundSig);

  const playerBalance = await connection.getBalance(testPlayer.publicKey);
  console.log("Test player balance:", playerBalance / LAMPORTS_PER_SOL, "SOL");

  // Setup Anchor for player
  const playerWallet = new Wallet(testPlayer);
  const playerProvider = new AnchorProvider(connection, playerWallet, { commitment: "confirmed" });
  const playerProgram = new Program(idl, playerProvider);

  // Setup Anchor for house authority
  const houseWallet = new Wallet(houseKey);
  const houseProvider = new AnchorProvider(connection, houseWallet, { commitment: "confirmed" });
  const houseProgram = new Program(idl, houseProvider);

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

  console.log("\nGame PDA:", gamePda.toBase58());
  console.log("HouseConfig PDA:", houseConfigPda.toBase58());
  console.log("HouseVault PDA:", houseVaultPda.toBase58());
  console.log("PlayerStats PDA:", playerStatsPda.toBase58());

  // Step 1: Generate server seed (simulating API /game/start)
  console.log("\n--- Step 1: Generate server seed ---");
  const serverSeedBuf = randomBytes(32);
  const serverSeed = serverSeedBuf.toString("hex");
  const seedHashBuf = createHash("sha256").update(serverSeedBuf).digest();
  const seedHash = seedHashBuf.toString("hex");
  const seedHashBytes = Array.from(seedHashBuf);
  const serverSeedBytes = Array.from(serverSeedBuf);

  console.log("Server seed:", serverSeed.slice(0, 16) + "...");
  console.log("Seed hash:", seedHash.slice(0, 16) + "...");

  // Step 2: Player calls start_game (TX1)
  console.log("\n--- Step 2: start_game (0.01 SOL, player signs) ---");
  const betAmount = new BN(0.01 * LAMPORTS_PER_SOL);

  try {
    const startTx = await playerProgram.methods
      .startGame(betAmount, seedHashBytes)
      .accounts({
        player: testPlayer.publicKey,
        game: gamePda,
        houseConfig: houseConfigPda,
        houseVault: houseVaultPda,
        playerStats: playerStatsPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([testPlayer])
      .rpc();

    console.log("✅ start_game TX:", startTx);
  } catch (err) {
    console.error("❌ start_game FAILED:", err.message);
    if (err.logs) err.logs.forEach(l => console.error("  ", l));
    process.exit(1);
  }

  // Verify game state
  const gameAccount = await playerProgram.account.gameState.fetch(gamePda);
  console.log("Game status:", JSON.stringify(gameAccount.status));
  console.log("Bet amount:", Number(gameAccount.betAmount) / LAMPORTS_PER_SOL, "SOL");
  console.log("Seed hash stored:", Buffer.from(gameAccount.seedHash).toString("hex").slice(0, 16) + "...");

  // Step 3: Client-side pulls (no TX)
  console.log("\n--- Step 3: Client-side pulls ---");
  const roundsSurvived = 2;
  console.log("Rounds survived (client claim):", roundsSurvived);

  // Step 4: House authority calls settle_game (TX2)
  console.log("\n--- Step 4: settle_game (house authority signs) ---");

  try {
    const settleTx = await houseProgram.methods
      .settleGame(roundsSurvived, serverSeedBytes)
      .accounts({
        authority: houseKey.publicKey,
        houseConfig: houseConfigPda,
        houseVault: houseVaultPda,
        game: gamePda,
        player: testPlayer.publicKey,
        playerStats: playerStatsPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([houseKey])
      .rpc();

    console.log("✅ settle_game TX:", settleTx);
  } catch (err) {
    console.error("❌ settle_game FAILED:", err.message);
    if (err.logs) {
      console.error("Logs:");
      err.logs.forEach(l => console.error("  ", l));
    }
    process.exit(1);
  }

  // Step 5: Verify final state
  const finalGame = await playerProgram.account.gameState.fetch(gamePda);
  console.log("\n--- Final State ---");
  console.log("Status:", JSON.stringify(finalGame.status));
  console.log("Rounds survived:", finalGame.roundsSurvived);
  console.log("Bullet position:", finalGame.bulletPosition);
  console.log("Payout:", Number(finalGame.payout) / LAMPORTS_PER_SOL, "SOL");
  console.log("Result multiplier:", Number(finalGame.resultMultiplier), "basis pts");

  const finalPlayerBal = await connection.getBalance(testPlayer.publicKey);
  console.log("\nTest player final balance:", finalPlayerBal / LAMPORTS_PER_SOL, "SOL");

  // Step 6: Verify provably fair
  console.log("\n--- Step 6: Provably fair verification ---");
  const verifyHash = createHash("sha256").update(serverSeedBuf).digest();
  const storedHash = Buffer.from(gameAccount.seedHash);
  const hashMatch = verifyHash.equals(storedHash);
  console.log("SHA256(server_seed) == on-chain seed_hash:", hashMatch ? "✅ MATCH" : "❌ MISMATCH");

  // Check PlayerStats
  const stats = await playerProgram.account.playerStats.fetch(playerStatsPda);
  console.log("\n--- Player Stats ---");
  console.log("Total games:", Number(stats.totalGames));
  console.log("Total wagered:", Number(stats.totalWagered) / LAMPORTS_PER_SOL, "SOL");
  console.log("Total won:", Number(stats.totalWon) / LAMPORTS_PER_SOL, "SOL");
  console.log("Total profit:", Number(stats.totalProfit) / LAMPORTS_PER_SOL, "SOL");

  console.log("\n=== v3 E2E TEST COMPLETE ===");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
