'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { web3, BN } from '@coral-xyz/anchor';
import {
  getProgram,
  getHouseConfigPDA,
  getHouseVaultPDA,
  getGamePDA,
  MULTIPLIERS,
} from '@/lib/anchor';

const LAMPORTS_PER_SOL = 1_000_000_000;

export const GameBoard = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const wallet = useAnchorWallet();

  const [betAmount, setBetAmount] = useState('0.01');
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentRound, setCurrentRound] = useState(0);

  const fetchGameState = async () => {
    if (!publicKey || !wallet) return;

    try {
      const program = getProgram(connection, wallet);
      const [gamePDA] = getGamePDA(publicKey);

      const game = await program.account.gameState.fetch(gamePDA);
      setGameState(game);
      setCurrentRound(game.currentRound);
    } catch (error) {
      // Game doesn't exist yet
      setGameState(null);
      setCurrentRound(0);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchGameState();
    }
  }, [connected, publicKey]);

  const initGame = async () => {
    if (!publicKey || !wallet) {
      setMessage('지갑을 연결해주세요');
      return;
    }

    setLoading(true);
    setMessage('게임 초기화 중...');

    try {
      const program = getProgram(connection, wallet);
      const [houseConfig] = getHouseConfigPDA();
      const [houseVault] = getHouseVaultPDA();
      const [gamePDA] = getGamePDA(publicKey);

      const betLamports = new BN(parseFloat(betAmount) * LAMPORTS_PER_SOL);

      await program.methods
        .initGame(betLamports)
        .accounts({
          houseConfig,
          houseVault,
          game: gamePDA,
          player: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      setMessage(`${betAmount} SOL 베팅 완료! 방아쇠를 당겨보세요...`);
      await fetchGameState();
    } catch (error: any) {
      console.error(error);
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pullTrigger = async () => {
    if (!publicKey || !wallet || !gameState) return;

    setLoading(true);
    setMessage('방아쇠를 당기는 중...');

    try {
      const program = getProgram(connection, wallet);
      const [houseConfig] = getHouseConfigPDA();
      const [gamePDA] = getGamePDA(publicKey);

      await program.methods
        .pullTrigger()
        .accounts({
          houseConfig,
          game: gamePDA,
          player: publicKey,
        })
        .rpc();

      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchGameState();

      const updatedGame = await program.account.gameState.fetch(gamePDA);

      if (updatedGame.status.lost) {
        setMessage('💀 탕! 죽었습니다...');
      } else if (updatedGame.status.won) {
        const multiplier = MULTIPLIERS[updatedGame.currentRound - 1];
        setMessage(`🎉 생존! ${multiplier}x 배당을 현금화할 수 있습니다!`);
      } else {
        const nextMultiplier = MULTIPLIERS[updatedGame.currentRound];
        setMessage(`✅ 안전! 다음 라운드: ${nextMultiplier}x`);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cashOut = async () => {
    if (!publicKey || !wallet || !gameState) return;

    setLoading(true);
    setMessage('현금화 중...');

    try {
      const program = getProgram(connection, wallet);
      const [houseConfig] = getHouseConfigPDA();
      const [houseVault] = getHouseVaultPDA();
      const [gamePDA] = getGamePDA(publicKey);

      await program.methods
        .cashOut()
        .accounts({
          houseConfig,
          houseVault,
          game: gamePDA,
          player: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      const multiplier = MULTIPLIERS[gameState.currentRound - 1];
      const payout = (gameState.betAmount.toNumber() / LAMPORTS_PER_SOL) * multiplier;

      setMessage(`🎰 ${payout.toFixed(4)} SOL 획득!`);
      await fetchGameState();
    } catch (error: any) {
      console.error(error);
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isActive = gameState?.status?.active;
  const isWon = gameState?.status?.won;
  const isLost = gameState?.status?.lost;
  const canPlay = connected && !isActive && !isWon;
  const canPullTrigger = isActive;
  const canCashOut = isWon;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game Status */}
      <div className="bg-cyber-dark border-2 border-cyber-cyan rounded-lg p-8 mb-6 neon-border">
        <div className="text-center">
          <div className="text-6xl mb-4">🔫</div>
          <h2 className="text-2xl text-cyber-cyan mb-4">
            {isActive && `라운드 ${currentRound} / 6`}
            {isWon && '승리!'}
            {isLost && '패배'}
            {!gameState && '새 게임 시작'}
          </h2>

          {gameState && (
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-cyber-cyan text-sm">베팅액</p>
                <p className="text-white text-xl">
                  {(gameState.betAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </p>
              </div>
              <div>
                <p className="text-cyber-cyan text-sm">현재 라운드</p>
                <p className="text-white text-xl">{currentRound} / 6</p>
              </div>
              <div>
                <p className="text-cyber-cyan text-sm">배당률</p>
                <p className="text-cyber-pink text-xl font-bold">
                  {currentRound > 0 ? `${MULTIPLIERS[currentRound - 1]}x` : '-'}
                </p>
              </div>
            </div>
          )}

          {message && (
            <div className="bg-cyber-darker border border-cyber-cyan rounded p-3 mb-4">
              <p className="text-cyber-cyan">{message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Multipliers Table */}
      <div className="bg-cyber-dark border-2 border-cyber-pink rounded-lg p-6 mb-6 neon-border">
        <h3 className="text-cyber-pink text-xl mb-4 text-center">배당률 테이블</h3>
        <div className="grid grid-cols-6 gap-2">
          {MULTIPLIERS.map((mult, idx) => (
            <div
              key={idx}
              className={`text-center p-3 rounded border ${
                currentRound === idx + 1
                  ? 'bg-cyber-cyan text-cyber-dark border-cyber-cyan'
                  : 'bg-cyber-darker border-cyber-cyan text-cyber-cyan'
              }`}
            >
              <div className="text-xs">R{idx + 1}</div>
              <div className="font-bold">{mult}x</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {!connected ? (
          <div className="text-center text-cyber-cyan">
            <p>지갑을 연결하여 게임을 시작하세요</p>
          </div>
        ) : (
          <>
            {canPlay && (
              <div className="flex gap-4">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  step="0.01"
                  min="0.01"
                  className="flex-1 bg-cyber-dark border-2 border-cyber-cyan rounded px-4 py-3 text-white text-lg focus:outline-none focus:border-cyber-pink"
                  placeholder="베팅액 (SOL)"
                />
                <button
                  onClick={initGame}
                  disabled={loading}
                  className="px-8 py-3 bg-cyber-pink text-white rounded font-bold text-lg hover:bg-opacity-80 transition-all disabled:opacity-50 neon-border"
                >
                  {loading ? '처리 중...' : '게임 시작'}
                </button>
              </div>
            )}

            {canPullTrigger && (
              <button
                onClick={pullTrigger}
                disabled={loading}
                className="w-full px-8 py-4 bg-cyber-cyan text-cyber-dark rounded font-bold text-xl hover:bg-opacity-80 transition-all disabled:opacity-50 neon-border"
              >
                {loading ? '처리 중...' : '🔫 방아쇠 당기기'}
              </button>
            )}

            {canCashOut && (
              <button
                onClick={cashOut}
                disabled={loading}
                className="w-full px-8 py-4 bg-green-500 text-white rounded font-bold text-xl hover:bg-opacity-80 transition-all disabled:opacity-50 neon-border"
              >
                {loading ? '처리 중...' : '💰 현금화'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
