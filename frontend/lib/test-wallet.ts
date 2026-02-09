import { Keypair, Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

/**
 * Test wallet for E2E tests with real devnet TX signing
 *
 * Creates a mock Phantom wallet that signs transactions with a test keypair
 * instead of prompting the user. Used with ?testMode=true query parameter.
 */

interface TestWalletInterface {
  isPhantom: boolean;
  isConnected: boolean;
  publicKey: PublicKey;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
}

export function createTestWallet(keypairBytes: number[]): TestWalletInterface {
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairBytes));

  const wallet: TestWalletInterface = {
    isPhantom: true,
    isConnected: true,
    publicKey: keypair.publicKey,

    connect: async () => {
      console.log('[Test Wallet] connect() called');
      wallet.isConnected = true;
      return { publicKey: wallet.publicKey };
    },

    disconnect: async () => {
      console.log('[Test Wallet] disconnect() called');
      wallet.isConnected = false;
    },

    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      console.log('[Test Wallet] signTransaction() called');

      if (tx instanceof VersionedTransaction) {
        // VersionedTransaction
        tx.sign([keypair]);
      } else {
        // Legacy Transaction
        tx.sign(keypair);
      }

      return tx;
    },

    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      console.log('[Test Wallet] signAllTransactions() called:', txs.length);
      return Promise.all(txs.map(tx => wallet.signTransaction(tx)));
    },

    signMessage: async (message: Uint8Array) => {
      console.log('[Test Wallet] signMessage() called');
      const signature = nacl.sign.detached(message, keypair.secretKey);
      return { signature };
    },
  };

  return wallet;
}
