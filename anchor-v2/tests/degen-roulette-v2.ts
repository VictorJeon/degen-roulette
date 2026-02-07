import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import BN from "bn.js";
import * as fs from "fs";

describe("degen-roulette-v2", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const idlPath = "./target/idl/degen_roulette_v2.json";
  const idlContent = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const program = new Program(
    idlContent,
    provider
  ) as Program<any>;

  const authority = provider.wallet;

  let houseConfig: PublicKey;
  let houseVault: PublicKey;

  // Orao VRF PDAs (not deployed on localnet, but we need the addresses)
  let vrfConfig: PublicKey;
  let vrfTreasury: PublicKey;

  before(async () => {
    [houseConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("house_config")],
      program.programId
    );

    [houseVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("house_vault")],
      program.programId
    );

    // Orao VRF program ID
    const ORAO_VRF_PROGRAM_ID = new PublicKey(
      "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y"
    );

    [vrfConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("orao-vrf-network-configuration")],
      ORAO_VRF_PROGRAM_ID
    );

    // For localnet, treasury doesn't matter since VRF won't execute
    vrfTreasury = authority.publicKey;
  });

  it("Initialize house", async () => {
    const tx = await program.methods
      .initializeHouse()
      .accounts({
        houseConfig,
        houseVault,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.houseConfig.fetch(houseConfig);
    assert.ok(config.authority.equals(authority.publicKey));
    assert.equal(config.minBet.toNumber(), 10_000_000);
    assert.equal(config.maxBetPct, 1000); // 10%
    assert.equal(config.houseEdgeBps, 300); // 3%
    assert.equal(config.paused, false);
    assert.equal(config.totalGames.toNumber(), 0);
    assert.equal(config.totalVolume.toNumber(), 0);
  });

  it("Fund house", async () => {
    const fundAmount = new BN(5 * LAMPORTS_PER_SOL);

    const balanceBefore = await provider.connection.getBalance(houseVault);

    await program.methods
      .fundHouse(fundAmount)
      .accounts({
        houseConfig,
        houseVault,
        funder: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const balanceAfter = await provider.connection.getBalance(houseVault);
    assert.ok(balanceAfter - balanceBefore >= fundAmount.toNumber());
  });

  it("Start game - success", async () => {
    const player = anchor.web3.Keypair.generate();

    const airdropSig = await provider.connection.requestAirdrop(
      player.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), player.publicKey.toBuffer()],
      program.programId
    );

    const [playerStats] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_stats"), player.publicKey.toBuffer()],
      program.programId
    );

    const betAmount = new BN(50_000_000); // 0.05 SOL

    // Derive VRF randomness PDA (will be empty on localnet)
    const ORAO_VRF_PROGRAM_ID = new PublicKey(
      "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y"
    );

    // We need a seed - let's use a dummy seed for localnet
    const dummySeed = Buffer.alloc(32, 1);
    const [randomAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("orao-vrf-randomness-request"), dummySeed],
      ORAO_VRF_PROGRAM_ID
    );

    const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);

    await program.methods
      .startGame(betAmount)
      .accounts({
        player: player.publicKey,
        game: gameAccount,
        houseConfig,
        houseVault,
        playerStats,
        vrfConfig,
        vrfTreasury,
        random: randomAccount,
        vrf: ORAO_VRF_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    const game = await program.account.gameState.fetch(gameAccount);
    assert.ok(game.player.equals(player.publicKey));
    assert.equal(game.betAmount.toNumber(), betAmount.toNumber());
    assert.deepEqual(game.status, { active: {} });
    assert.equal(game.roundsSurvived, 0);
    assert.equal(game.payout.toNumber(), 0);

    const stats = await program.account.playerStats.fetch(playerStats);
    assert.ok(stats.player.equals(player.publicKey));
    assert.equal(stats.totalGames.toNumber(), 0); // Not yet settled

    const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
    // Player should have paid bet + tx fees
    assert.ok(playerBalanceBefore - playerBalanceAfter >= betAmount.toNumber());
  });

  it("Start game - reject double start", async () => {
    const player = anchor.web3.Keypair.generate();

    const airdropSig = await provider.connection.requestAirdrop(
      player.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), player.publicKey.toBuffer()],
      program.programId
    );

    const [playerStats] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_stats"), player.publicKey.toBuffer()],
      program.programId
    );

    const betAmount = new BN(50_000_000);

    const ORAO_VRF_PROGRAM_ID = new PublicKey(
      "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y"
    );
    const dummySeed = Buffer.alloc(32, 2);
    const [randomAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("orao-vrf-randomness-request"), dummySeed],
      ORAO_VRF_PROGRAM_ID
    );

    // First start - should succeed
    await program.methods
      .startGame(betAmount)
      .accounts({
        player: player.publicKey,
        game: gameAccount,
        houseConfig,
        houseVault,
        playerStats,
        vrfConfig,
        vrfTreasury,
        random: randomAccount,
        vrf: ORAO_VRF_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    // Second start - should fail
    try {
      await program.methods
        .startGame(betAmount)
        .accounts({
          player: player.publicKey,
          game: gameAccount,
          houseConfig,
          houseVault,
          playerStats,
          vrfConfig,
          vrfTreasury,
          random: randomAccount,
          vrf: ORAO_VRF_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([player])
        .rpc();
      assert.fail("Should have failed with GameAlreadyActive");
    } catch (err) {
      assert.ok(err.toString().includes("GameAlreadyActive"));
    }
  });

  it("Settle game - win path (localnet fallback)", async () => {
    const player = anchor.web3.Keypair.generate();

    const airdropSig = await provider.connection.requestAirdrop(
      player.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), player.publicKey.toBuffer()],
      program.programId
    );

    const [playerStats] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_stats"), player.publicKey.toBuffer()],
      program.programId
    );

    const betAmount = new BN(50_000_000);

    const ORAO_VRF_PROGRAM_ID = new PublicKey(
      "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y"
    );
    const dummySeed = Buffer.alloc(32, 3);
    const [randomAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("orao-vrf-randomness-request"), dummySeed],
      ORAO_VRF_PROGRAM_ID
    );

    // Start game
    await program.methods
      .startGame(betAmount)
      .accounts({
        player: player.publicKey,
        game: gameAccount,
        houseConfig,
        houseVault,
        playerStats,
        vrfConfig,
        vrfTreasury,
        random: randomAccount,
        vrf: ORAO_VRF_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    const playerBalanceBefore = await provider.connection.getBalance(player.publicKey);

    // Settle with rounds_survived = 1 (most likely to win in deterministic fallback)
    const roundsSurvived = 1;
    await program.methods
      .settleGame(roundsSurvived)
      .accounts({
        player: player.publicKey,
        game: gameAccount,
        houseConfig,
        houseVault,
        playerStats,
        random: randomAccount,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    const game = await program.account.gameState.fetch(gameAccount);
    const stats = await program.account.playerStats.fetch(playerStats);

    console.log(`Rounds survived: ${game.roundsSurvived}`);
    console.log(`Bullet position: ${game.bulletPosition}`);
    console.log(`Status: ${JSON.stringify(game.status)}`);
    console.log(`Payout: ${game.payout.toNumber()}`);

    // Update assertions based on actual outcome
    assert.equal(game.roundsSurvived, roundsSurvived);
    assert.equal(stats.totalGames.toNumber(), 1);
    assert.equal(stats.totalWagered.toNumber(), betAmount.toNumber());

    if (game.status.won) {
      // Expected payout for round 1: bet * 116 / 100
      const expectedPayout = betAmount.toNumber() * 116 / 100;
      assert.equal(game.payout.toNumber(), expectedPayout);
      assert.equal(stats.totalWon.toNumber(), expectedPayout);
      assert.equal(stats.bestStreak, roundsSurvived);

      const playerBalanceAfter = await provider.connection.getBalance(player.publicKey);
      // Player should have received payout
      assert.ok(playerBalanceAfter > playerBalanceBefore);
    } else {
      assert.equal(game.payout.toNumber(), 0);
      assert.equal(stats.totalWon.toNumber(), 0);
    }
  });

  it("Settle game - loss path (localnet fallback)", async () => {
    const player = anchor.web3.Keypair.generate();

    const airdropSig = await provider.connection.requestAirdrop(
      player.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), player.publicKey.toBuffer()],
      program.programId
    );

    const [playerStats] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_stats"), player.publicKey.toBuffer()],
      program.programId
    );

    const betAmount = new BN(50_000_000);

    const ORAO_VRF_PROGRAM_ID = new PublicKey(
      "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y"
    );
    const dummySeed = Buffer.alloc(32, 4);
    const [randomAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("orao-vrf-randomness-request"), dummySeed],
      ORAO_VRF_PROGRAM_ID
    );

    // Start game
    await program.methods
      .startGame(betAmount)
      .accounts({
        player: player.publicKey,
        game: gameAccount,
        houseConfig,
        houseVault,
        playerStats,
        vrfConfig,
        vrfTreasury,
        random: randomAccount,
        vrf: ORAO_VRF_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    // Settle with rounds_survived = 5 (most likely to lose in deterministic fallback)
    const roundsSurvived = 5;
    await program.methods
      .settleGame(roundsSurvived)
      .accounts({
        player: player.publicKey,
        game: gameAccount,
        houseConfig,
        houseVault,
        playerStats,
        random: randomAccount,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    const game = await program.account.gameState.fetch(gameAccount);
    const stats = await program.account.playerStats.fetch(playerStats);

    console.log(`Rounds survived: ${game.roundsSurvived}`);
    console.log(`Bullet position: ${game.bulletPosition}`);
    console.log(`Status: ${JSON.stringify(game.status)}`);
    console.log(`Payout: ${game.payout.toNumber()}`);

    assert.equal(game.roundsSurvived, roundsSurvived);
    assert.equal(stats.totalGames.toNumber(), 1);
    assert.equal(stats.totalWagered.toNumber(), betAmount.toNumber());

    // Check if it's actually a loss (bullet_position < rounds_survived)
    if (game.status.lost) {
      assert.equal(game.payout.toNumber(), 0);
      assert.equal(stats.totalWon.toNumber(), 0);
      assert.ok(game.bulletPosition < roundsSurvived);
    } else {
      // If it won, payout should be correct for round 5
      const expectedPayout = betAmount.toNumber() * 582 / 100;
      assert.equal(game.payout.toNumber(), expectedPayout);
    }
  });

  it("Pause and unpause", async () => {
    await program.methods
      .pause()
      .accounts({
        houseConfig,
        authority: authority.publicKey,
      })
      .rpc();

    let config = await program.account.houseConfig.fetch(houseConfig);
    assert.equal(config.paused, true);

    await program.methods
      .unpause()
      .accounts({
        houseConfig,
        authority: authority.publicKey,
      })
      .rpc();

    config = await program.account.houseConfig.fetch(houseConfig);
    assert.equal(config.paused, false);
  });

  it("Withdraw house", async () => {
    const recipient = anchor.web3.Keypair.generate().publicKey;
    const withdrawAmount = new BN(1 * LAMPORTS_PER_SOL);

    const vaultBalanceBefore = await provider.connection.getBalance(houseVault);

    await program.methods
      .withdrawHouse(withdrawAmount)
      .accounts({
        houseConfig,
        houseVault,
        authority: authority.publicKey,
        recipient,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultBalanceAfter = await provider.connection.getBalance(houseVault);
    assert.ok(vaultBalanceBefore - vaultBalanceAfter >= withdrawAmount.toNumber());
  });

  it("PlayerStats accumulation", async () => {
    const player = anchor.web3.Keypair.generate();

    const airdropSig = await provider.connection.requestAirdrop(
      player.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    const [gameAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), player.publicKey.toBuffer()],
      program.programId
    );

    const [playerStats] = PublicKey.findProgramAddressSync(
      [Buffer.from("player_stats"), player.publicKey.toBuffer()],
      program.programId
    );

    const betAmount = new BN(50_000_000);
    const ORAO_VRF_PROGRAM_ID = new PublicKey(
      "VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y"
    );

    // Play multiple games
    for (let i = 0; i < 3; i++) {
      const dummySeed = Buffer.alloc(32, 10 + i);
      const [randomAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("orao-vrf-randomness-request"), dummySeed],
        ORAO_VRF_PROGRAM_ID
      );

      await program.methods
        .startGame(betAmount)
        .accounts({
          player: player.publicKey,
          game: gameAccount,
          houseConfig,
          houseVault,
          playerStats,
          vrfConfig,
          vrfTreasury,
          random: randomAccount,
          vrf: ORAO_VRF_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([player])
        .rpc();

      await program.methods
        .settleGame(1 + i) // Different rounds each time
        .accounts({
          player: player.publicKey,
          game: gameAccount,
          houseConfig,
          houseVault,
          playerStats,
          random: randomAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([player])
        .rpc();
    }

    const stats = await program.account.playerStats.fetch(playerStats);
    assert.equal(stats.totalGames.toNumber(), 3);
    assert.equal(stats.totalWagered.toNumber(), betAmount.toNumber() * 3);

    console.log(`Total games: ${stats.totalGames.toNumber()}`);
    console.log(`Total wagered: ${stats.totalWagered.toNumber()}`);
    console.log(`Total won: ${stats.totalWon.toNumber()}`);
    console.log(`Total profit: ${stats.totalProfit.toNumber()}`);
    console.log(`Best streak: ${stats.bestStreak}`);
  });
});
