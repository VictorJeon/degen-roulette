'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  address: string;
  multiplier: number;
  timestamp: number;
}

export default function Leaderboard() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadScores = () => {
      const data = JSON.parse(localStorage.getItem('degen_leaderboard') || '[]');
      setScores(data);
    };

    loadScores();

    const handleUpdate = () => loadScores();
    window.addEventListener('leaderboard-update', handleUpdate);

    return () => {
      window.removeEventListener('leaderboard-update', handleUpdate);
    };
  }, []);

  const shortAddress = (addr: string) => {
    if (!addr || addr === 'Anonymous') return 'Anon';
    return addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
  };

  return (
    <div className="bg-bg-secondary border-[3px] border-border p-4">
      <div className="font-pixel text-[0.6rem] text-accent mb-4 text-center tracking-wider">
        🏆 LEADERBOARD
      </div>
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => {
          const entry = scores[i];
          return (
            <div
              key={i}
              className="flex justify-between items-center py-2 border-b border-border last:border-0"
            >
              <span className="font-pixel text-[0.45rem] text-text-secondary">
                #{i + 1}
              </span>
              <span className="font-pixel text-[0.5rem] text-text-primary flex-1 ml-2">
                {entry ? shortAddress(entry.address) : '---'}
              </span>
              <span className="font-pixel text-[0.5rem] text-accent text-glow">
                {entry ? `${entry.multiplier.toFixed(1)}x` : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
