import { Connection, PublicKey } from '@solana/web3.js';
import { BorshAccountsCoder } from '@coral-xyz/anchor';
import { IDL } from './idl';
import { DEVNET_ENDPOINT, PROGRAM_ID } from './constants';

export interface PlayerStatsData {
  player: PublicKey;
  totalGames: bigint;
  totalWagered: bigint;
  totalWon: bigint;
  totalProfit: bigint; // Can be negative!
  bestStreak: number;
  bump: number;
}

export async function verifyTransaction(
  signature: string,
  expectedWallet: PublicKey
): Promise<boolean> {
  const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');

  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) {
      return false;
    }

    // Verify PROGRAM_ID in account keys
    const hasProgramId = tx.transaction.message.staticAccountKeys
      .some(key => key.equals(PROGRAM_ID));

    if (!hasProgramId) {
      return false;
    }

    // Verify wallet is signer
    const signerIndices: number[] = [];
    const message = tx.transaction.message;

    // Get all signer indices from message header
    const numSigners = message.header.numRequiredSignatures;
    for (let i = 0; i < numSigners; i++) {
      signerIndices.push(i);
    }

    const isSigner = signerIndices.some(idx => {
      const key = message.staticAccountKeys[idx];
      return key.equals(expectedWallet);
    });

    return isSigner;
  } catch (error) {
    console.error('Transaction verification error:', error);
    return false;
  }
}

export async function fetchPlayerStats(
  wallet: PublicKey
): Promise<PlayerStatsData | null> {
  const connection = new Connection(DEVNET_ENDPOINT, 'confirmed');

  try {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('player_stats'), wallet.toBuffer()],
      PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(pda);

    if (!accountInfo) {
      return null;
    }

    const coder = new BorshAccountsCoder(IDL);
    const decoded = coder.decode('PlayerStats', accountInfo.data);

    return {
      player: decoded.player,
      totalGames: BigInt(decoded.totalGames.toString()),
      totalWagered: BigInt(decoded.totalWagered.toString()),
      totalWon: BigInt(decoded.totalWon.toString()),
      totalProfit: BigInt(decoded.totalProfit.toString()),
      bestStreak: decoded.bestStreak,
      bump: decoded.bump,
    };
  } catch (error) {
    console.error('Fetch PlayerStats error:', error);
    return null;
  }
}
