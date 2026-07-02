'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './ThemeProvider';
import { ZenithSensoryProvider } from '@/contexts/ZenithSensoryContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user" respects the OS "reduce motion" accessibility setting
          globally across ALL framer-motion animations in the app. When the user
          has enabled "Reduce Motion" in their OS, all animations are skipped.
          This also avoids shipping animation JS for those users → smaller effective bundle. */}
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <ZenithSensoryProvider>
            {children}
          </ZenithSensoryProvider>
        </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
