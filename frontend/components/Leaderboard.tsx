'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

export default function Leaderboard() {
  const { leaderboard, isLoading } = useLeaderboard();

  const shortAddress = (addr: string) => {
    if (!addr) return '-';
    return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  };

  // Split leaderboard into two sections
  const topDegens = leaderboard.slice(0, 7);
  const rankList = leaderboard.slice(7, 12);

  return (
    <>
      {/* Hall of Degens */}
      <div className="panel">
        <h3 className="panel-title">HALL OF DEGENS</h3>

        {isLoading ? (
          <div className="leaderboard-empty">Loading...</div>
        ) : topDegens.length === 0 ? (
          <div className="leaderboard-empty">No degens yet.</div>
        ) : (
          <ul className="leaderboard-list">
            {topDegens.map((entry) => (
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
      </div>

      {/* Secondary Rank Section */}
      {rankList.length > 0 && (
        <div className="panel rank-panel">
          <h3 className="panel-title rank-title">
            <span className="rank-icon">◇</span>
            RANK
          </h3>
          <ul className="leaderboard-list">
            {rankList.map((entry) => (
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
        </div>
      )}

      <style jsx>{`
        .leaderboard-empty {
          text-align: center;
          padding: 1.3rem 0.6rem;
          color: var(--text-muted);
          font-family: var(--pixel-font);
          font-size: 0.46rem;
          line-height: 1.6;
        }

        .leaderboard-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.48rem 0.25rem;
          border-bottom: 1px solid var(--border-dim);
          transition: background 0.12s;
        }

        .leaderboard-item:hover {
          background: var(--neon-glow-subtle);
        }

        .leaderboard-item:last-child {
          border-bottom: none;
        }

        .leaderboard-item.current-user {
          background: rgba(0, 255, 65, 0.06);
          border-left: 2px solid var(--neon);
          padding-left: 0.4rem;
          margin-left: -0.15rem;
        }

        .leaderboard-address {
          font-family: var(--pixel-font);
          font-size: 0.42rem;
          color: var(--text-secondary);
          letter-spacing: 0.3px;
        }

        .leaderboard-profit {
          font-family: var(--pixel-font);
          font-size: 0.46rem;
          color: var(--text-muted);
        }

        .leaderboard-profit.positive {
          color: var(--success);
          text-shadow: 0 0 6px var(--success-glow);
        }

        .leaderboard-profit.negative {
          color: var(--danger);
        }

        .rank-panel {
          border-top: 2px solid var(--border-neon);
        }

        .rank-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .rank-icon {
          font-size: 0.5rem;
          animation: iconPulse 2s ease-in-out infinite;
        }

        @keyframes iconPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; text-shadow: 0 0 8px var(--neon-glow); }
        }
      `}</style>
    </>
  );
}
