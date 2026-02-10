'use client';

import { useLeaderboard } from '@/hooks/useLeaderboard';

export default function Leaderboard() {
  const { leaderboard, isLoading } = useLeaderboard();

  const shortAddress = (addr: string) => {
    if (!addr) return '-';
    return addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  };

  const topDegens = leaderboard.slice(0, 7);
  const rankList = leaderboard.slice(7, 12);

  return (
    <>
      {/* Hall of Degens */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-4">
        <h3 className="font-display text-sm max-md:text-xs uppercase text-accent mb-3 pb-2 border-b border-border-default tracking-wide">
          HALL OF DEGENS
        </h3>

        {isLoading ? (
          <div className="text-center py-5 px-2 text-gray-200 font-body text-sm max-md:text-xs leading-relaxed">Loading...</div>
        ) : topDegens.length === 0 ? (
          <div className="text-center py-5 px-2 text-gray-200 font-body text-sm max-md:text-xs leading-relaxed">No degens yet.</div>
        ) : (
          <ul className="list-none">
            {topDegens.map((entry) => (
              <li
                key={entry.fullAddress}
                className={`flex justify-between items-center py-2 px-1 border-b border-border-default last:border-b-0 hover:bg-white/[0.02] transition-colors ${
                  entry.isCurrentUser ? 'bg-accent/5 border-l-2 border-l-accent pl-2 -ml-1' : ''
                }`}
              >
                <span className="font-mono text-sm max-md:text-xs text-gray-100 tracking-wide">{shortAddress(entry.fullAddress)}</span>
                <span
                  className={`font-body text-sm max-md:text-xs ${
                    entry.totalProfit > 0 ? 'text-accent' : entry.totalProfit < 0 ? 'text-danger' : 'text-gray-200'
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
        <div className="bg-bg-surface border border-border-default rounded-xl p-4 border-t-2 border-t-border-default">
          <h3 className="font-display text-sm max-md:text-xs uppercase text-accent mb-3 pb-2 border-b border-border-default tracking-wide flex items-center gap-1.5">
            <span className="text-sm max-md:text-xs">◇</span>
            RANK
          </h3>
          <ul className="list-none">
            {rankList.map((entry) => (
              <li
                key={entry.fullAddress}
                className={`flex justify-between items-center py-2 px-1 border-b border-border-default last:border-b-0 hover:bg-white/[0.02] transition-colors ${
                  entry.isCurrentUser ? 'bg-accent/5 border-l-2 border-l-accent pl-2 -ml-1' : ''
                }`}
              >
                <span className="font-mono text-sm max-md:text-xs text-gray-100 tracking-wide">{shortAddress(entry.fullAddress)}</span>
                <span
                  className={`font-body text-sm max-md:text-xs ${
                    entry.totalProfit > 0 ? 'text-accent' : entry.totalProfit < 0 ? 'text-danger' : 'text-gray-200'
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
    </>
  );
}
