import { Connection, PublicKey } from "@solana/web3.js";

const ORAO_VRF_PROGRAM_ID = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
const RPC = "https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6";

const vrfConfigPda = PublicKey.findProgramAddressSync(
  [Buffer.from("orao-vrf-network-configuration")],
  ORAO_VRF_PROGRAM_ID
)[0];

async function main() {
  const connection = new Connection(RPC, "confirmed");
  
  console.log("VRF Config PDA:", vrfConfigPda.toBase58());
  
  const info = await connection.getAccountInfo(vrfConfigPda);
  if (!info) {
    console.log("VRF config account NOT found");
    return;
  }
  
  console.log("Account data length:", info.data.length);
  console.log("Owner:", info.owner.toBase58());
  
  // NetworkState structure (approx):
  // 8 bytes discriminator
  // 32 bytes authority  
  // 32 bytes treasury
  // ... (fulfill authorities, etc)
  
  const disc = info.data.subarray(0, 8);
  console.log("Discriminator:", Array.from(disc));
  
  const authority = new PublicKey(info.data.subarray(8, 40));
  console.log("Authority:", authority.toBase58());
  
  const treasury = new PublicKey(info.data.subarray(40, 72));
  console.log("Treasury:", treasury.toBase58());
  
  // Try another offset if above looks wrong
  // Some Anchor accounts have config before authority/treasury
  const config = info.data.subarray(72, 104);
  console.log("Field @72:", new PublicKey(config).toBase58());
}

main().catch(console.error);
