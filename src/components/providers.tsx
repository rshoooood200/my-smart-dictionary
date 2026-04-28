'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error-boundary';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  );
}
