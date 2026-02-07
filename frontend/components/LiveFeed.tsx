'use client';

import { useLiveFeed } from '@/hooks/useLiveFeed';

export function LiveFeed() {
  const { feed } = useLiveFeed();

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="live-feed">
      <h3 className="feed-title">LIVE FEED</h3>
      <div className="feed-list">
        {feed.length === 0 ? (
          <div className="empty-state">Waiting for games...</div>
        ) : (
          feed.map((item, i) => (
            <div key={i} className="feed-item">
              <span className="player">{item.player}</span>
              <span className={item.won ? 'profit success' : 'profit danger'}>
                {item.won
                  ? `+${item.profit.toFixed(2)}`
                  : item.roundsSurvived === 0
                    ? 'REKT @R1'
                    : `REKT @R${item.roundsSurvived + 1}`}
              </span>
              <span className="time">{getTimeAgo(item.timestamp)}</span>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .live-feed {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 600px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid var(--accent);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .feed-title {
          font-family: 'Press Start 2P', monospace;
          font-size: 1.2rem;
          color: var(--accent);
          text-shadow: 0 0 10px var(--accent);
          margin: 0 0 1.5rem 0;
          letter-spacing: 2px;
        }

        .feed-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feed-list::-webkit-scrollbar {
          width: 8px;
        }

        .feed-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .feed-list::-webkit-scrollbar-thumb {
          background: var(--accent);
          border-radius: 4px;
        }

        .empty-state {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Space Grotesk', sans-serif;
          padding: 2rem;
        }

        .feed-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          font-family: 'Space Grotesk', monospace;
          font-size: 0.9rem;
          transition: background 0.2s;
        }

        .feed-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .player {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .profit {
          font-weight: 700;
          font-family: 'Press Start 2P', monospace;
          font-size: 0.75rem;
        }

        .profit.success {
          color: var(--success);
        }

        .profit.danger {
          color: var(--danger);
        }

        .time {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.8rem;
        }

        @media (max-width: 1024px) {
          .live-feed {
            max-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .feed-item {
            grid-template-columns: 1fr auto;
            gap: 0.5rem;
          }

          .time {
            grid-column: 2;
            text-align: right;
          }
        }
      `}</style>
    </div>
  );
}
