'use client';

import { useLiveFeed } from '@/hooks/useLiveFeed';

export function LiveFeed() {
  const { feed } = useLiveFeed();

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-4 flex flex-col h-full max-h-[680px]">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border-default">
        <h3 className="font-display text-sm max-md:text-xs text-accent tracking-wide">LIVE FEED</h3>
        <span className="font-display text-sm max-md:text-xs text-gray-200">GLOBAL</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-gray-400">
        {feed.length === 0 ? (
          <div className="text-center text-gray-200 font-body text-sm max-md:text-xs py-7 leading-relaxed">
            Waiting for blood...
          </div>
        ) : (
          feed.map((item, i) => (
            <div
              key={i}
              className="flex flex-col gap-0.5 p-2 bg-bg-elevated/50 border border-border-default rounded hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center my-0.5">
                <span className="font-mono text-sm max-md:text-xs text-white">{item.player}</span>
                <span className="font-body text-sm max-md:text-xs text-gray-200 ml-1.5">
                  · R{item.roundsSurvived + (item.won ? 0 : 1)} · {item.betAmount?.toFixed(2) || '0.01'} SOL
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-body text-sm max-md:text-xs px-1.5 py-0.5 rounded-sm tracking-wide ${
                    item.won
                      ? 'text-accent bg-accent/10 border border-accent/30'
                      : 'text-danger bg-danger/10 border border-danger/30'
                  }`}
                >
                  {item.won ? 'SAFE' : 'BANG'}
                </span>
                <span className="font-body text-sm max-md:text-xs text-gray-300">·#01</span>
                <span
                  className={`font-body text-sm max-md:text-xs ml-auto ${
                    item.won ? 'text-accent' : 'text-danger'
                  }`}
                >
                  {item.won
                    ? `+${item.profit.toFixed(3)}`
                    : `-${(item.betAmount || 0.01).toFixed(3)}`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
