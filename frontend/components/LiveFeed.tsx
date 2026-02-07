'use client';

import { useLiveFeed } from '@/hooks/useLiveFeed';

export function LiveFeed() {
  const { feed } = useLiveFeed();

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="live-feed">
      <h3 className="feed-title">LIVE FEED</h3>
      <div className="feed-list">
        {feed.length === 0 ? (
          <div className="empty-state">Waiting for blood...</div>
        ) : (
          feed.map((item, i) => (
            <div key={i} className="feed-item">
              <span className="player">{item.player}</span>
              <span className={item.won ? 'profit success' : 'profit danger'}>
                {item.won
                  ? `+${item.profit.toFixed(3)}`
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
          max-height: 700px;
          background: #0d1015;
          border: 1px solid #343840;
          border-radius: 12px;
          padding: 1rem;
        }

        .feed-title {
          font-family: 'Press Start 2P', monospace;
          font-size: 1rem;
          color: var(--accent);
          text-shadow: 0 0 8px rgba(163,230,53,0.4);
          margin: 0 0 0.8rem 0;
          letter-spacing: 1px;
        }

        .feed-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .empty-state {
          text-align: center;
          color: rgba(255, 255, 255, 0.38);
          font-family: 'Press Start 2P', monospace;
          font-size: 0.6rem;
          padding: 2rem 1rem;
          line-height: 1.6;
        }

        .feed-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 0.7rem;
          align-items: center;
          padding: 0.55rem 0.6rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          font-family: 'Space Grotesk', monospace;
          font-size: 0.84rem;
          transition: background 0.2s;
        }

        .feed-item:hover { background: rgba(255, 255, 255, 0.08); }

        .player {
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
        }

        .profit {
          font-weight: 700;
          font-family: 'Press Start 2P', monospace;
          font-size: 0.52rem;
        }

        .profit.success { color: var(--success); }
        .profit.danger { color: var(--danger); }

        .time {
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.74rem;
        }

        @media (max-width: 768px) {
          .feed-item { grid-template-columns: 1fr auto; }
          .time { grid-column: 2; text-align: right; }
        }
      `}</style>
    </div>
  );
}
