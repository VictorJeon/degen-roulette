const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair } = require("@solana/web3.js");
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
  
  const config = await program.account.houseConfig.fetch(houseConfig);
  const vaultBalance = await connection.getBalance(houseVault);
  
  console.log("House Config:");
  console.log("  Authority:", config.authority.toBase58());
  console.log("  Min Bet:", config.minBet.toNumber() / 1e9, "SOL");
  console.log("  Max Bet %:", config.maxBetPct);
  console.log("  House Edge (bps):", config.houseEdgeBps);
  console.log("  Paused:", config.paused);
  console.log("");
  console.log("House Vault Balance:", vaultBalance / 1e9, "SOL");
  console.log("Max Bet Amount:", (vaultBalance * config.maxBetPct / 10000) / 1e9, "SOL");
}

main();
