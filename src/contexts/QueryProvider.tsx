'use client'

// ─── QueryProvider — React Query client wrapper ───────────────────────────────
//
// Wraps the app in a single QueryClient so all screens share the same
// in-memory cache.  Configured with sensible defaults for a mobile-first
// sadhana app where data is personal and changes infrequently:
//
//   staleTime  30 min  — data stays "fresh" for 30 minutes
//   gcTime     60 min  — unused data is garbage-collected after 1 hour
//   retry         2   — retry failed queries twice before showing error
//
// Usage: wrap (main)/layout.tsx children with <QueryProvider> BEFORE
// EngineProvider so React Query hooks work inside engine-aware components.
// ─────────────────────────────────────────────────────────────────────────────

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Stable QueryClient per component mount (not a module-level constant)
  // so Next.js App Router creates a new client per request on the server
  // and a single shared client on the client.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:          30 * 60 * 1000,   // 30 minutes
            gcTime:             60 * 60 * 1000,   // 60 minutes
            retry:              2,
            refetchOnWindowFocus: false,           // not needed for mobile sadhana data
          },
        },
      })
  )

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}
