'use client';

import { useState, useEffect } from 'react';

interface Play {
  address: string;
  result: 'won' | 'lost';
  amount: string;
  mult: string;
  time: string;
}

export default function RecentPlays() {
  const [plays, setPlays] = useState<Play[]>([]);

  useEffect(() => {
    const generateFakePlays = () => {
      const results: ('won' | 'lost')[] = ['won', 'lost', 'won', 'lost', 'lost', 'won', 'lost', 'lost'];
      const times = ['2s ago', '15s ago', '32s ago', '1m ago', '2m ago', '3m ago', '5m ago', '8m ago'];

      const fakePlays: Play[] = results.map((result, i) => ({
        address: randomAddr(),
        result,
        amount: (Math.random() * 5 + 0.1).toFixed(2),
        mult: (Math.random() * 4 + 1).toFixed(1),
        time: times[i],
      }));

      setPlays(fakePlays);
    };

    generateFakePlays();
  }, []);

  const randomAddr = () => {
    const chars = '0123456789abcdef';
    let addr = '';
    for (let i = 0; i < 8; i++) addr += chars[Math.floor(Math.random() * chars.length)];
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="panel">
      <h3 className="panel-title">LIVE FEED</h3>
      <div className="recent-plays">
        {plays.map((play, i) => {
          const profit = play.result === 'won'
            ? (parseFloat(play.amount) * parseFloat(play.mult) - parseFloat(play.amount)).toFixed(2)
            : play.amount;

          return (
            <div key={i} className="play-item">
              <span className="play-address">{play.address}</span>
              <span className={`play-result ${play.result === 'won' ? 'win' : 'lose'}`}>
                {play.result === 'won' ? `+${profit}` : `-${profit}`} SOL
              </span>
              <span className="play-time">{play.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
