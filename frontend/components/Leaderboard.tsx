'use client';

import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  address: string;
  multiplier: number;
  timestamp: number;
}

export default function Leaderboard() {
  // Default dummy data matching reference HTML
  const defaultScores: LeaderboardEntry[] = [
    { address: 'Anonymous', multiplier: 10.0, timestamp: Date.now() },
    { address: 'Anonymous', multiplier: 10.0, timestamp: Date.now() },
    { address: 'Anonymous', multiplier: 5.0, timestamp: Date.now() },
    { address: 'Anonymous', multiplier: 3.0, timestamp: Date.now() },
    { address: 'Anonymous', multiplier: 3.0, timestamp: Date.now() },
  ];

  const [scores, setScores] = useState<LeaderboardEntry[]>(defaultScores);

  useEffect(() => {
    const loadScores = () => {
      const data = JSON.parse(localStorage.getItem('degen_leaderboard') || '[]');
      if (data.length > 0) {
        setScores(data);
      }
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
    <div className="panel">
      <h3 className="panel-title">HALL OF DEGENS</h3>
      <ul className="leaderboard-list">
        {[...Array(10)].map((_, i) => {
          const entry = scores[i];
          return (
            <li key={i} className="leaderboard-item">
              <span className="leaderboard-rank">{i + 1}</span>
              <span className="leaderboard-address">
                {entry ? shortAddress(entry.address) : 'Anon'}
              </span>
              <span className="leaderboard-multiplier">
                {entry ? `${entry.multiplier.toFixed(1)}x` : '-'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
