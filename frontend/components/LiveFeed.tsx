'use client';

import { useLiveFeed } from '@/hooks/useLiveFeed';
import { useState } from 'react';

export function LiveFeed() {
  const { feed } = useLiveFeed();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="live-feed-panel">
      <div className="feed-header">
        <h3 className="feed-title">LIVE FEED</h3>
        <span className="feed-scope">GLOBAL</span>
      </div>

      <div className="feed-tabs">
        <button
          className={`feed-tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          {activeTab === 'global' && (
            <svg className="feed-tab-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
          GLOBAL
        </button>
        <button
          className={`feed-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          ≡ FRIENDS
        </button>
      </div>

      <div className="feed-list">
        {feed.length === 0 ? (
          <div className="feed-empty">Waiting for blood...</div>
        ) : (
          feed.map((item, i) => (
            <div key={i} className="feed-item">
              <div className="feed-item-top">
                <span className="feed-player">{item.player}</span>
                <span className="feed-round">
                  R{item.roundsSurvived + (item.won ? 0 : 1)} · {item.betAmount?.toFixed(2) || '0.01'} SOL
                </span>
              </div>
              <div className="feed-item-bottom">
                <span className={`feed-result ${item.won ? 'safe' : 'bang'}`}>
                  {item.won ? 'SAFE' : 'BANG'}
                </span>
                <span className={`feed-profit ${item.won ? 'positive' : 'negative'}`}>
                  {item.won
                    ? `+${item.profit.toFixed(3)}`
                    : `-${(item.betAmount || 0.01).toFixed(3)}`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .feed-empty {
          text-align: center;
          color: var(--text-muted);
          font-family: var(--pixel-font);
          font-size: 0.5rem;
          padding: 2rem 1rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
