'use client';

import { Suspense, ReactNode } from 'react';
import { TestModeProvider } from './TestModeProvider';

/**
 * Wrapper for TestModeProvider with Suspense boundary
 * Required for useSearchParams() in Next.js 16
 */
export function TestModeWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <TestModeProvider>{children}</TestModeProvider>
    </Suspense>
  );
}
