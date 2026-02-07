const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require("@solana/web3.js");
const fs = require("fs");

// Withdraw SOL from HouseVault PDA back to authority wallet.
// Usage: node withdraw-house.js [amountSOL]
// Default: 0.2 SOL

async function main() {
  const amountSol = Number(process.argv[2] ?? "0.2");
  if (!Number.isFinite(amountSol) || amountSol <= 0) throw new Error("Invalid amountSOL");

  const connection = new anchor.web3.Connection("https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6", "confirmed");

  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(fs.readFileSync(process.env.HOME + "/.config/solana/degen-roulette.json"))
    )
  );

  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const idl = JSON.parse(fs.readFileSync("./target/idl/degen_roulette_v2.json"));
  const programId = new PublicKey(idl.address);
  const program = new anchor.Program(idl, provider);

  const [houseConfig] = PublicKey.findProgramAddressSync([Buffer.from("house_config")], programId);
  const [houseVault] = PublicKey.findProgramAddressSync([Buffer.from("house_vault")], programId);

  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
  const amount = new anchor.BN(lamports);

  console.log(`Withdrawing ${amountSol} SOL from house vault...`);
  console.log("Authority:", walletKeypair.publicKey.toBase58());
  console.log("HouseVault:", houseVault.toBase58());

  const beforeWallet = await connection.getBalance(walletKeypair.publicKey);
  const beforeVault = await connection.getBalance(houseVault);
  console.log("Before - wallet:", beforeWallet / LAMPORTS_PER_SOL, "SOL");
  console.log("Before - vault:", beforeVault / LAMPORTS_PER_SOL, "SOL");

  const tx = await program.methods
    .withdrawHouse(amount)
    .accounts({
      houseConfig,
      houseVault,
      authority: walletKeypair.publicKey,
      recipient: walletKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([walletKeypair])
    .rpc();

  console.log("✅ Withdraw success TX:", tx);

  const afterWallet = await connection.getBalance(walletKeypair.publicKey);
  const afterVault = await connection.getBalance(houseVault);
  console.log("After - wallet:", afterWallet / LAMPORTS_PER_SOL, "SOL");
  console.log("After - vault:", afterVault / LAMPORTS_PER_SOL, "SOL");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
