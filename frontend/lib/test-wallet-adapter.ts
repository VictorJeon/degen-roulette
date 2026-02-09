import {
  BaseMessageSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from '@solana/wallet-adapter-base';
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import testKeypairData from '../playwright/fixtures/test-keypair.json';

/**
 * TestWalletAdapter
 *
 * Synchronously initialized wallet adapter for E2E testing.
 * Loads the test keypair directly at construction time to avoid race conditions.
 * This ensures publicKey is available immediately when wallet-adapter-react
 * initializes, allowing autoConnect to work properly.
 */
export class TestWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = 'Test Wallet' as WalletName;
  url = 'https://test.wallet';
  icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiA3VjEzQzIgMTguNTUgNS44NCAxOS43NCA5IDIwIiBzdHJva2U9IiMwMEZGNDEiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=';
  supportedTransactionVersions = new Set(['legacy', 0] as const);

  private _keypair: Keypair;
  private _publicKey: PublicKey | null = null;
  private _connecting = false;
  private _connected = false;
  private _readyState: WalletReadyState = WalletReadyState.NotDetected;

  constructor() {
    super();

    // Synchronously load keypair at construction time
    this._keypair = Keypair.fromSecretKey(Uint8Array.from(testKeypairData));

    // Check if test mode was enabled by head script (set before React loads)
    if (typeof window !== 'undefined' && (window as any).__TEST_MODE_ENABLED__) {
      this._readyState = WalletReadyState.Installed;
      console.log('[TestWalletAdapter] Test mode enabled - readyState set to Installed');
      console.log('[TestWalletAdapter] Wallet name:', this.name);
    } else {
      console.log('[TestWalletAdapter] Test mode disabled - readyState is NotDetected');
    }

    console.log('[TestWalletAdapter] Initialized with keypair for:', this._keypair.publicKey.toString());
  }

  get publicKey() {
    return this._publicKey;
  }

  get connecting() {
    return this._connecting;
  }

  get connected() {
    return this._connected;
  }

  get readyState(): WalletReadyState {
    return this._readyState;
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return;

      console.log('[TestWalletAdapter] Connecting...');
      this._connecting = true;

      // Set publicKey and connected state
      this._publicKey = this._keypair.publicKey;
      this._connected = true;

      // Set window.solana for smoke tests
      if (typeof window !== 'undefined') {
        (window as any).solana = {
          isPhantom: true,
          isConnected: true,
          publicKey: this._publicKey,
          connect: async () => ({ publicKey: this._publicKey }),
          disconnect: async () => {},
          signTransaction: (tx: any) => this.signTransaction(tx),
          signAllTransactions: (txs: any) => this.signAllTransactions(txs),
          signMessage: async (msg: Uint8Array) => ({
            signature: nacl.sign.detached(msg, this._keypair.secretKey)
          }),
        };
        (window as any).__TEST_WALLET_READY__ = true;
        window.dispatchEvent(new CustomEvent('test-wallet-ready'));
        console.log('[TestWalletAdapter] window.solana and __TEST_WALLET_READY__ set');
      }

      console.log('[TestWalletAdapter] Connected:', this._publicKey.toString());
      this.emit('connect', this._publicKey);
    } catch (error: any) {
      console.error('[TestWalletAdapter] Connection error:', error);
      this.emit('error', error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this._connected) {
      this._publicKey = null;
      this._connected = false;
      this.emit('disconnect');
      console.log('[TestWalletAdapter] Disconnected');
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    console.log('[TestWalletAdapter] Signing transaction with keypair');

    // Sign directly with our keypair
    if (transaction instanceof VersionedTransaction) {
      transaction.sign([this._keypair]);
    } else {
      (transaction as Transaction).sign(this._keypair);
    }

    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    console.log('[TestWalletAdapter] Signing', transactions.length, 'transactions');
    return Promise.all(transactions.map(tx => this.signTransaction(tx)));
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    console.log('[TestWalletAdapter] Signing message with keypair');
    const signature = nacl.sign.detached(message, this._keypair.secretKey);
    return signature;
  }
}
