'use client';

let walletAddress: string | null = null;

export function setErrorWallet(addr: string | null) {
  walletAddress = addr;
}

function reportError(source: string, message: string, stack?: string, extra?: Record<string, any>) {
  // Fire and forget
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source,
      message,
      stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      wallet: walletAddress,
      extra,
    }),
  }).catch(() => {
    // Silent fail — don't create error loops
  });
}

export function initErrorReporter() {
  if (typeof window === 'undefined') return;

  // Global unhandled errors
  window.onerror = (message, source, lineno, colno, error) => {
    reportError(
      'window.onerror',
      String(message),
      error?.stack,
      { source, lineno, colno }
    );
  };

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    reportError(
      'unhandledrejection',
      reason?.message || String(reason),
      reason?.stack,
      { type: typeof reason }
    );
  });

  // Console.error interception (non-destructive)
  const originalError = console.error;
  console.error = (...args: any[]) => {
    originalError.apply(console, args);
    const message = args.map(a =>
      typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a)
    ).join(' ');

    // Skip noisy React/Next.js internal errors
    if (message.includes('Warning:') || message.includes('Hydration') || message.includes('Fast Refresh')) {
      return;
    }

    reportError('console.error', message.slice(0, 2000));
  };
}

// For manual reporting from catch blocks
export function captureError(error: Error | string, extra?: Record<string, any>) {
  const msg = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;
  reportError('manual', msg, stack, extra);
}
