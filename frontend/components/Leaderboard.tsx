'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

export default function Leaderboard() {
  const { leaderboard, isLoading } = useLeaderboard();

  const shortAddress = (addr: string) => {
    if (!addr) return '-';
    return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  };

  return (
    <div className="panel leaderboard-panel">
      <h3 className="panel-title">HALL OF DEGENS</h3>

      {isLoading ? (
        <div className="loading-state">Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">No degens yet. Be the first.</div>
      ) : (
        <ul className="leaderboard-list">
          {leaderboard.slice(0, 10).map((entry, i) => (
            <li
              key={entry.fullAddress}
              className={`leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}`}
            >
              <span className="leaderboard-rank">#{i + 1}</span>
              <span className="leaderboard-address">{shortAddress(entry.fullAddress)}</span>
              <span
                className={`leaderboard-profit ${
                  entry.totalProfit > 0 ? 'positive' : entry.totalProfit < 0 ? 'negative' : ''
                }`}
              >
                {entry.totalProfit > 0 ? '+' : ''}
                {entry.totalProfit.toFixed(3)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .leaderboard-panel {
          background: #0f1116;
          border: 1px solid #2f3338;
          border-radius: 12px;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 1.5rem 0.8rem;
          color: rgba(255, 255, 255, 0.45);
          font-family: 'Press Start 2P', monospace;
          font-size: 0.56rem;
          line-height: 1.7;
        }

        .leaderboard-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .leaderboard-item:last-child { border-bottom: none; }

        .leaderboard-item.current-user {
          background: rgba(163, 230, 53, 0.08);
          border-radius: 6px;
          padding-left: 0.4rem;
          padding-right: 0.4rem;
          margin-left: -0.2rem;
          margin-right: -0.2rem;
        }

        .leaderboard-rank {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.5rem;
          color: #a1a1aa;
        }

        .leaderboard-address {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.48rem;
          color: #e4e4e7;
        }

        .leaderboard-profit {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.52rem;
          color: #a1a1aa;
        }

        .leaderboard-profit.positive { color: var(--success); }
        .leaderboard-profit.negative { color: var(--danger); }
      `}</style>
    </div>
  );
}
