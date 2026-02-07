import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import pkg from "@coral-xyz/anchor";
const { Program, AnchorProvider, BN, Wallet } = pkg;
import { randomBytes } from "crypto";
import fs from "fs";

const PROGRAM_ID = new PublicKey("BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz");
const ORAO_VRF_PROGRAM_ID = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
const ORAO_VRF_TREASURY = new PublicKey("9ZTHWWZDpB36UFe1vszf2KEpt83vwi27jDqtHQ7NSXyR");
const RPC = "https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6";
const BET_SOL = 0.01; // Min bet = 0.01 SOL (house_config.min_bet)
const PLAYER_FUND_SOL = 0.12; // Enough for bet + rent + VRF fee
const MAX_SETTLE_RETRIES = 6;
const SETTLE_RETRY_DELAY_MS = 5000;

const NUM_TESTS = parseInt(process.argv[2] ?? "10");
const houseKeyPath = process.env.HOME + "/.config/solana/degen-roulette.json";
const houseKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(houseKeyPath, "utf-8"))));
const idl = JSON.parse(fs.readFileSync("./idl/degen_roulette_v2.json", "utf-8"));

const results = { success: 0, startFail: 0, settleFail: 0, wins: 0, losses: 0, totalPayout: 0, totalBet: 0, errors: [] };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runOneTest(connection, testNum) {
  const testPlayer = Keypair.generate();
  const wallet = new Wallet(testPlayer);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(idl, provider);

  // Derive PDAs
  const [gamePda] = PublicKey.findProgramAddressSync([Buffer.from("game"), testPlayer.publicKey.toBuffer()], PROGRAM_ID);
  const [houseConfigPda] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], PROGRAM_ID);
  const [houseVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], PROGRAM_ID);
  const [playerStatsPda] = PublicKey.findProgramAddressSync([Buffer.from("player_stats"), testPlayer.publicKey.toBuffer()], PROGRAM_ID);
  const vrfConfigPda = PublicKey.findProgramAddressSync([Buffer.from("orao-vrf-network-configuration")], ORAO_VRF_PROGRAM_ID)[0];

  // Fund test player from house authority wallet
  const transferTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: houseKey.publicKey,
      toPubkey: testPlayer.publicKey,
      lamports: PLAYER_FUND_SOL * LAMPORTS_PER_SOL,
    })
  );
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transferTx.feePayer = houseKey.publicKey;
  transferTx.recentBlockhash = blockhash;
  transferTx.sign(houseKey);
  const fundSig = await connection.sendRawTransaction(transferTx.serialize(), { skipPreflight: true });
  await connection.confirmTransaction({ signature: fundSig, blockhash, lastValidBlockHeight }, "confirmed");
  await sleep(500);

  const betAmount = new BN(BET_SOL * LAMPORTS_PER_SOL);
  const vrfSeed = new Uint8Array(randomBytes(32));
  if (vrfSeed.every(b => b === 0)) vrfSeed[0] = 1;

  const randomPda = PublicKey.findProgramAddressSync(
    [Buffer.from("orao-vrf-randomness-request"), vrfSeed],
    ORAO_VRF_PROGRAM_ID
  )[0];

  // Randomize rounds survived (1-5)
  const roundsSurvived = Math.floor(Math.random() * 5) + 1;

  // Step 1: start_game
  let startTx;
  try {
    startTx = await program.methods
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
  } catch (err) {
    results.startFail++;
    results.errors.push({ test: testNum, phase: "start", error: err.message?.slice(0, 120) });
    return;
  }

  // Step 2: settle_game (with retries for VRF fulfillment)
  let settleTx;
  for (let attempt = 1; attempt <= MAX_SETTLE_RETRIES; attempt++) {
    await sleep(SETTLE_RETRY_DELAY_MS);
    try {
      settleTx = await program.methods
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
      break; // success
    } catch (err) {
      if (attempt === MAX_SETTLE_RETRIES) {
        results.settleFail++;
        results.errors.push({ test: testNum, phase: "settle", error: err.message?.slice(0, 120), attempts: attempt });
        return;
      }
      // VrfNotFulfilled → retry
      if (!err.message?.includes("VrfNotFulfilled")) {
        results.settleFail++;
        results.errors.push({ test: testNum, phase: "settle", error: err.message?.slice(0, 120), attempts: attempt });
        return;
      }
    }
  }

  // Step 3: Read result
  try {
    const gameAccount = await program.account.gameState.fetch(gamePda);
    const won = 'won' in gameAccount.status;
    const payout = Number(gameAccount.payout) / LAMPORTS_PER_SOL;

    results.success++;
    results.totalBet += BET_SOL;
    results.totalPayout += payout;
    if (won) results.wins++;
    else results.losses++;

    const symbol = won ? "🟢" : "🔴";
    console.log(`  ${symbol} #${testNum}: rounds=${roundsSurvived}, bullet=${gameAccount.bulletPosition}, ${won ? "WIN" : "LOSE"}, payout=${payout.toFixed(4)}`);
  } catch (err) {
    results.success++; // settle worked, just couldn't read result
    console.log(`  ⚪ #${testNum}: settle OK but read failed: ${err.message?.slice(0, 80)}`);
  }
}

async function main() {
  const connection = new Connection(RPC, "confirmed");

  console.log(`=== DEGEN ROULETTE BATCH E2E (${NUM_TESTS} games) ===\n`);
  console.log(`Bet: ${BET_SOL} SOL | Fund/player: ${PLAYER_FUND_SOL} SOL`);

  const walletBal = await connection.getBalance(houseKey.publicKey);
  const needed = NUM_TESTS * PLAYER_FUND_SOL * LAMPORTS_PER_SOL;
  console.log(`House wallet: ${walletBal / LAMPORTS_PER_SOL} SOL (need ~${(needed / LAMPORTS_PER_SOL).toFixed(2)} SOL)\n`);

  if (walletBal < needed) {
    console.log("⚠️ House wallet may run low. Will try to continue anyway.\n");
  }

  const startTime = Date.now();
  for (let i = 1; i <= NUM_TESTS; i++) {
    try {
      await runOneTest(connection, i);
    } catch (err) {
      console.log(`  ❌ #${i}: unexpected error: ${err.message?.slice(0, 100)}`);
      results.errors.push({ test: i, phase: "unknown", error: err.message?.slice(0, 120) });
    }
    // Rate limit: don't spam devnet
    if (i < NUM_TESTS) await sleep(3000);
  }
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n=== RESULTS (${elapsed}s) ===`);
  console.log(`Total: ${NUM_TESTS} | Success: ${results.success} | Start fail: ${results.startFail} | Settle fail: ${results.settleFail}`);
  console.log(`Wins: ${results.wins} | Losses: ${results.losses}`);
  console.log(`Total bet: ${results.totalBet.toFixed(4)} SOL | Total payout: ${results.totalPayout.toFixed(4)} SOL`);
  console.log(`House edge observed: ${((1 - results.totalPayout / results.totalBet) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log(`\nErrors (${results.errors.length}):`);
    results.errors.forEach(e => console.log(`  #${e.test} [${e.phase}]: ${e.error}`));
  }

  // Write JSON summary
  const summary = { ...results, numTests: NUM_TESTS, elapsed, timestamp: new Date().toISOString() };
  fs.writeFileSync("/tmp/e2e-batch-results.json", JSON.stringify(summary, null, 2));
  console.log("\nJSON → /tmp/e2e-batch-results.json");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
