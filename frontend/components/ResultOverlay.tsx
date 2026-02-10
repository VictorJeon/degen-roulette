'use client';

interface ResultOverlayProps {
  won: boolean;
  betAmount: number;
  payout: number;
  multiplier: number;
  roundsSurvived: number;
  onNewGame: () => void;
  onShowFair?: () => void;
}

export function ResultOverlay({
  won,
  betAmount,
  payout,
  multiplier,
  roundsSurvived,
  onNewGame,
  onShowFair,
}: ResultOverlayProps) {
  const profit = payout - betAmount;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/94 z-[1000] animate-[fadeIn_0.35s_ease-out]">
      <div
        className={`flex flex-col items-center gap-5 p-9 bg-bg-elevated border-2 rounded-xl min-w-[360px] relative max-md:min-w-0 max-md:w-[90%] max-md:p-7 max-md:gap-4 max-sm:w-[calc(100%-2rem)] max-sm:p-5 max-sm:gap-4 ${
          won ? 'border-accent' : 'border-danger'
        } ${!won ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
      >
        <h2
          className={`font-display text-[2.8rem] m-0 tracking-[6px] max-md:text-2xl max-md:tracking-[3px] max-sm:text-xl max-sm:tracking-[2px] max-[360px]:text-lg ${
            won ? 'text-accent' : 'text-danger'
          }`}
        >
          {won ? 'YOU LIVE.' : 'YOU DIED.'}
        </h2>

        <div className="grid grid-cols-2 gap-3 max-md:gap-2.5 max-sm:gap-2">
          {won ? (
            <>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-bg-surface border border-border-default rounded-lg min-w-[120px] max-md:min-w-[100px] max-md:p-2.5 max-sm:min-w-[90px] max-sm:p-2">
                <span className="font-pixel text-sm max-md:text-xs text-gray-200 tracking-wide">PAYOUT</span>
                <span className="font-body text-sm max-md:text-xs text-accent">+{payout.toFixed(3)} SOL</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-bg-surface border border-border-default rounded-lg min-w-[120px] max-md:min-w-[100px] max-md:p-2.5 max-sm:min-w-[90px] max-sm:p-2">
                <span className="font-pixel text-sm max-md:text-xs text-gray-200 tracking-wide">PROFIT</span>
                <span className="font-body text-sm max-md:text-xs text-accent">+{profit.toFixed(3)} SOL</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-bg-surface border border-border-default rounded-lg min-w-[120px] max-md:min-w-[100px] max-md:p-2.5 max-sm:min-w-[90px] max-sm:p-2">
                <span className="font-pixel text-sm max-md:text-xs text-gray-200 tracking-wide">MULTIPLIER</span>
                <span className="font-pixel text-sm max-md:text-xs text-white">{multiplier.toFixed(2)}x</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-bg-surface border border-border-default rounded-lg min-w-[120px] max-md:min-w-[100px] max-md:p-2.5 max-sm:min-w-[90px] max-sm:p-2">
                <span className="font-pixel text-sm max-md:text-xs text-gray-200 tracking-wide">ROUNDS</span>
                <span className="font-body text-sm max-md:text-xs text-white">{roundsSurvived}</span>
              </div>
            </>
          ) : (
            <>
              <div className="col-span-2 flex flex-col items-center gap-1.5 p-3 bg-bg-surface border border-border-default rounded-lg min-w-[200px] max-md:min-w-[180px] max-sm:min-w-[160px] justify-self-center">
                <span className="font-pixel text-sm max-md:text-xs text-gray-200 tracking-wide">DIED AT</span>
                <span className="font-body text-sm max-md:text-xs text-danger">ROUND {roundsSurvived + 1}</span>
              </div>
              <div className="col-span-2 flex flex-col items-center gap-1.5 p-3 bg-bg-surface border border-border-default rounded-lg min-w-[200px] max-md:min-w-[180px] max-sm:min-w-[160px] justify-self-center">
                <span className="font-pixel text-sm max-md:text-xs text-gray-200 tracking-wide">LOST</span>
                <span className="font-body text-sm max-md:text-xs text-danger">-{betAmount.toFixed(3)} SOL</span>
              </div>
            </>
          )}
        </div>

        <button
          className="font-display text-base px-8 py-4 bg-bg-surface border-2 border-accent rounded text-accent cursor-pointer transition-all uppercase tracking-[5px] mt-2 min-w-[300px] shadow-[0_0_20px_rgba(0,255,65,0.15)] hover:bg-bg-elevated hover:shadow-[0_0_30px_rgba(0,255,65,0.25)] hover:-translate-y-0.5 active:translate-y-0 max-md:text-xs max-md:px-6 max-md:py-3 max-md:tracking-[3px] max-md:min-w-[240px] max-md:min-h-[48px] max-sm:text-2xs max-sm:px-5 max-sm:py-3 max-sm:tracking-[2px] max-sm:min-w-[200px] max-[360px]:text-[0.6rem] max-[360px]:min-w-[180px]"
          onClick={onNewGame}
          data-testid="play-again-button"
        >
          PLAY AGAIN
        </button>

        {onShowFair && (
          <button
            className="font-pixel text-sm max-md:text-xs text-gray-100 tracking-wide bg-bg-surface border border-border-default px-3 py-1.5 cursor-pointer transition-colors rounded flex items-center gap-1.5 hover:border-accent hover:text-accent"
            onClick={onShowFair}
            data-testid="result-provably-fair-button"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            Provably Fair
          </button>
        )}
      </div>
    </div>
  );
}
