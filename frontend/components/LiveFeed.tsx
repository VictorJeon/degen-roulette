'use client';

import { useLiveFeed } from '@/hooks/useLiveFeed';
import { useState } from 'react';

export function LiveFeed() {
  const { feed } = useLiveFeed();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

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
          <svg className="feed-tab-icon" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}>
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
          FRIENDS
        </button>
      </div>

      <div className="feed-list">
        {feed.length === 0 ? (
          <div className="feed-empty">Waiting for blood...</div>
        ) : (
          feed.map((item, i) => (
            <div key={i} className="feed-item">
              <div className="feed-item-top">
                <div className="feed-player-info">
                  <span className={`feed-badge ${item.won ? 'global' : ''}`}>
                    {item.won ? '✓' : ''} GLOBAL
                  </span>
                  <span className="feed-friends-label">·FRIENDS</span>
                </div>
              </div>
              <div className="feed-item-middle">
                <span className="feed-player">{item.player}</span>
                <span className="feed-round">
                  · R{item.roundsSurvived + (item.won ? 0 : 1)} · {item.betAmount?.toFixed(2) || '0.01'} SOL
                </span>
              </div>
              <div className="feed-item-bottom">
                <span className={`feed-result ${item.won ? 'safe' : 'bang'}`}>
                  {item.won ? 'SAFE' : 'BANG'}
                </span>
                <span className="feed-hash">·#01</span>
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
        .feed-player-info {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .feed-badge {
          font-family: var(--pixel-font);
          font-size: 0.36rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }

        .feed-badge.global {
          color: var(--neon);
        }

        .feed-friends-label {
          font-family: var(--pixel-font);
          font-size: 0.34rem;
          color: var(--text-dim);
        }

        .feed-item-middle {
          display: flex;
          align-items: center;
          margin: 0.15rem 0;
        }

        .feed-player {
          font-family: var(--pixel-font);
          font-size: 0.42rem;
          color: var(--text-primary);
        }

        .feed-round {
          font-family: var(--pixel-font);
          font-size: 0.38rem;
          color: var(--text-muted);
          margin-left: 0.3rem;
        }

        .feed-item-bottom {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .feed-result {
          font-family: var(--pixel-font);
          font-size: 0.38rem;
          padding: 0.12rem 0.35rem;
          border-radius: 2px;
          letter-spacing: 0.5px;
        }

        .feed-result.safe {
          color: var(--success);
          background: rgba(0, 255, 65, 0.12);
          border: 1px solid rgba(0, 255, 65, 0.3);
          text-shadow: 0 0 4px var(--success-glow);
        }

        .feed-result.bang {
          color: var(--danger);
          background: rgba(255, 0, 64, 0.12);
          border: 1px solid rgba(255, 0, 64, 0.3);
          text-shadow: 0 0 4px var(--danger-glow);
        }

        .feed-hash {
          font-family: var(--pixel-font);
          font-size: 0.34rem;
          color: var(--text-dim);
        }

        .feed-profit {
          font-family: var(--pixel-font);
          font-size: 0.44rem;
          margin-left: auto;
        }

        .feed-profit.positive {
          color: var(--success);
          text-shadow: 0 0 6px var(--success-glow);
        }

        .feed-profit.negative {
          color: var(--danger);
        }

        .feed-empty {
          text-align: center;
          color: var(--text-muted);
          font-family: var(--pixel-font);
          font-size: 0.46rem;
          padding: 1.8rem 1rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
