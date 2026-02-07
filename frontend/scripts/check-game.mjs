import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

const PROGRAM_ID = new PublicKey("BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz");
const PLAYER = new PublicKey("9fpynsTdxijRFifMx8HsBijF73kksrGddzAac3aFNjVx");
const RPC = "https://api.devnet.solana.com";

const [gamePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("game"), PLAYER.toBuffer()],
  PROGRAM_ID
);

async function main() {
  const connection = new Connection(RPC, "confirmed");
  
  console.log("Game PDA:", gamePda.toBase58());
  
  const info = await connection.getAccountInfo(gamePda);
  if (!info) {
    console.log("No GameState account found");
    return;
  }
  
  console.log("Account exists, data length:", info.data.length);
  console.log("Owner:", info.owner.toBase58());
  
  // Parse raw data - first 8 bytes are discriminator
  const disc = info.data.subarray(0, 8);
  console.log("Discriminator:", Array.from(disc));
  
  // Expected discriminator from IDL: [144, 94, 208, 172, 248, 99, 134, 120]
  console.log("Expected:     ", [144, 94, 208, 172, 248, 99, 134, 120]);
  
  // After disc: player (32), bet_amount (8), vrf_seed (32), rounds_survived (1), bullet_position (1), status (1+?), ...
  const player = new PublicKey(info.data.subarray(8, 40));
  console.log("Player:", player.toBase58());
  
  const betLamports = info.data.readBigUInt64LE(40);
  console.log("Bet amount:", Number(betLamports) / 1e9, "SOL");
  
  const roundsSurvived = info.data[80]; // offset 8+32+8+32 = 80
  console.log("Rounds survived:", roundsSurvived);
  
  const bulletPosition = info.data[81];
  console.log("Bullet position:", bulletPosition);
  
  const statusByte = info.data[82];
  const statusMap = { 0: "Active", 1: "Won", 2: "Lost" };
  console.log("Status byte:", statusByte, "=", statusMap[statusByte] || "Unknown");
}

main().catch(console.error);
