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
  let houseConfigBump: number;
  let houseVaultBump: number;

  before(async () => {
    [houseConfig, houseConfigBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("house_config")],
      program.programId
    );

    [houseVault, houseVaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("house_vault")],
      program.programId
    );
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
    assert.equal(config.maxBetPct, 100);
    assert.equal(config.houseEdgeBps, 200);
    assert.equal(config.paused, false);
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

  it("Init game and play", async () => {
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

    const betAmount = new BN(50_000_000);

    await program.methods
      .initGame(betAmount)
      .accounts({
        houseConfig,
        houseVault,
        game: gameAccount,
        player: player.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    let game = await program.account.gameState.fetch(gameAccount);
    assert.ok(game.player.equals(player.publicKey));
    assert.equal(game.betAmount.toNumber(), betAmount.toNumber());
    assert.equal(game.currentRound, 0);
    assert.deepEqual(game.status, { active: {} });

    for (let i = 0; i < 6; i++) {
      await program.methods
        .pullTrigger()
        .accounts({
          houseConfig,
          game: gameAccount,
          player: player.publicKey,
        })
        .signers([player])
        .rpc();

      game = await program.account.gameState.fetch(gameAccount);

      if (game.status.lost) {
        console.log(`Lost at round ${game.currentRound}`);
        break;
      } else if (game.status.won) {
        console.log(`Won at round ${game.currentRound}`);

        await program.methods
          .cashOut()
          .accounts({
            houseConfig,
            houseVault,
            game: gameAccount,
            player: player.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([player])
          .rpc();
        break;
      }
    }

    assert.ok(game.status.won || game.status.lost);
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
});
