'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

export default function Leaderboard() {
  const { leaderboard, isLoading } = useLeaderboard();

  const shortAddress = (addr: string) => {
    if (!addr) return '-';
    return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  };

  return (
    <div className="panel">
      <h3 className="panel-title">◇ HALL OF DEGENS</h3>

      {isLoading ? (
        <div className="leaderboard-empty">Loading...</div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">No degens yet.</div>
      ) : (
        <ul className="leaderboard-list">
          {leaderboard.slice(0, 10).map((entry, i) => (
            <li
              key={entry.fullAddress}
              className={`leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}`}
            >
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
        .leaderboard-empty {
          text-align: center;
          padding: 1.5rem 0.8rem;
          color: var(--text-muted);
          font-family: var(--pixel-font);
          font-size: 0.5rem;
          line-height: 1.6;
        }

        .leaderboard-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.55rem 0;
          border-bottom: 1px solid var(--border-dim);
        }

        .leaderboard-item:last-child {
          border-bottom: none;
        }

        .leaderboard-item.current-user {
          background: rgba(0, 255, 65, 0.08);
          border-radius: 4px;
          padding-left: 0.4rem;
          padding-right: 0.4rem;
          margin-left: -0.2rem;
          margin-right: -0.2rem;
        }

        .leaderboard-address {
          font-family: var(--pixel-font);
          font-size: 0.44rem;
          color: var(--text-secondary);
        }

        .leaderboard-profit {
          font-family: var(--pixel-font);
          font-size: 0.48rem;
          color: var(--text-muted);
        }

        .leaderboard-profit.positive {
          color: var(--success);
          text-shadow: 0 0 8px var(--success-glow);
        }

        .leaderboard-profit.negative {
          color: var(--danger);
        }
      `}</style>
    </div>
  );
}
