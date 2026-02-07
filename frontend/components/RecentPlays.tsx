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
    <div className="bg-bg-secondary border-[3px] border-border p-4">
      <div className="font-pixel text-[0.55rem] text-accent mb-4 uppercase text-shadow-[0_0_8px_var(--accent-glow)]">
        LIVE FEED
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {plays.map((play, i) => {
          const profit = play.result === 'won' 
            ? (parseFloat(play.amount) * parseFloat(play.mult) - parseFloat(play.amount)).toFixed(2)
            : play.amount;

          return (
            <div
              key={i}
              className="flex flex-col gap-1 py-2 border-b border-border last:border-0"
            >
              <div className="flex justify-between items-center">
                <span className="font-pixel text-[0.45rem] text-text-secondary">
                  {play.address}
                </span>
                <span className={`font-pixel text-[0.5rem] ${
                  play.result === 'won' ? 'text-success text-glow-success' : 'text-danger'
                }`}>
                  {play.result === 'won' ? `+${profit}` : `-${profit}`} SOL
                </span>
              </div>
              <div className="font-pixel text-[0.4rem] text-text-muted">
                {play.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
