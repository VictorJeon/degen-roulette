'use client';

import { useEffect } from 'react';
import { Buffer } from 'buffer';

export function BufferPolyfill() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).Buffer = Buffer;
      (window as any).process = { env: {} };
    }
  }, []);

  return null;
}
