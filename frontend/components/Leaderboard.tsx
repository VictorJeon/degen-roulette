'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Leaderboard() {
  const { leaderboard, isLoading } = useLeaderboard();
  const { publicKey } = useWallet();

  const shortAddress = (addr: string) => {
    if (!addr) return 'Anon';
    return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  };

  return (
    <div className="panel">
      <h3 className="panel-title">HALL OF DEGENS</h3>
      {isLoading ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <ul className="leaderboard-list">
          {[...Array(10)].map((_, i) => {
            const entry = leaderboard[i];
            const isCurrentUser = entry?.isCurrentUser || false;

            return (
              <li
                key={i}
                className={`leaderboard-item ${isCurrentUser ? 'current-user' : ''}`}
              >
                <span className="leaderboard-rank">{i + 1}</span>
                <span className="leaderboard-address">
                  {entry ? shortAddress(entry.player) : 'Anon'}
                </span>
                <span
                  className={`leaderboard-profit ${
                    entry && entry.totalProfit > 0
                      ? 'positive'
                      : entry && entry.totalProfit < 0
                        ? 'negative'
                        : ''
                  }`}
                >
                  {entry
                    ? entry.totalProfit > 0
                      ? `+${entry.totalProfit.toFixed(2)}`
                      : entry.totalProfit < 0
                        ? entry.totalProfit.toFixed(2)
                        : '0.00'
                    : '-'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <style jsx>{`
        .loading-state {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Space Grotesk', sans-serif;
        }

        .leaderboard-item.current-user {
          background: rgba(163, 230, 53, 0.1);
          border: 1px solid var(--accent);
        }

        .leaderboard-profit {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.75rem;
        }

        .leaderboard-profit.positive {
          color: var(--success);
        }

        .leaderboard-profit.negative {
          color: var(--danger);
        }
      `}</style>
    </div>
  );
}
