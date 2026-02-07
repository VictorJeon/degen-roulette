import type { Idl } from '@coral-xyz/anchor';
import idl from '../idl/degen_roulette_v2.json';

export const IDL = idl as Idl;

export type DegenRouletteV2 = {
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
    description: string;
  };
  instructions: Array<{
    name: string;
    discriminator: number[];
    accounts: Array<any>;
    args: Array<any>;
  }>;
  accounts: Array<{
    name: string;
    discriminator: number[];
  }>;
  errors: Array<{
    code: number;
    name: string;
    msg: string;
  }>;
  types: Array<{
    name: string;
    type: any;
  }>;
};

export type GameState = {
  player: string;
  betAmount: bigint;
  bulletPosition: number;
  currentRound: number;
  status: GameStatus;
  createdAt: bigint;
  bump: number;
};

export type GameStatus =
  | { idle: {} }
  | { waitingVrf: {} }
  | { active: {} }
  | { won: {} }
  | { lost: {} };

export type HouseConfig = {
  authority: string;
  minBet: bigint;
  maxBetPct: number;
  houseEdgeBps: number;
  paused: boolean;
  bump: number;
};
