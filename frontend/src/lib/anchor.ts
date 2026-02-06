import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from '../../public/idl/degen_roulette_v2.json';

export const PROGRAM_ID = new web3.PublicKey(
  'DoyhYB794FiGVpJrhJsSaUeWieWHBHmJRUYeiPwfwwx7'
);

export const getProgram = (
  connection: web3.Connection,
  wallet: AnchorWallet
) => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  return new Program(idl as any, provider);
};

export const getHouseConfigPDA = () => {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('house_config')],
    PROGRAM_ID
  );
};

export const getHouseVaultPDA = () => {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('house_vault')],
    PROGRAM_ID
  );
};

export const getGamePDA = (player: web3.PublicKey) => {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), player.toBuffer()],
    PROGRAM_ID
  );
};

export const MULTIPLIERS = [1.15, 1.4, 1.9, 2.8, 5.5];
