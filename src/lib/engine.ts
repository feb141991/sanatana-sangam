// ─── Engine Singletons ────────────────────────────────────────────────────────
//
// Two module-level singletons — one per engine — so the same instance
// is reused across every React component tree, server action, and route.
//
// Both engines are initialised lazily on first call so Next.js doesn't
// blow up during the static-analysis / build phase when env vars may
// not be injected yet.
//
// Usage (client components):
//   import { getSadhanaEngine, getPathshalaEngine } from '@/lib/engine'
//
//   const engine    = getSadhanaEngine()
//   const pathshala = getPathshalaEngine()
// ─────────────────────────────────────────────────────────────────────────────

import type { SadhanaEngine }   from '@sangam/sadhana-engine'
import type { PathshalaEngine } from '@sangam/pathshala-engine'

// ── Env helpers ───────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`[engine] Missing env var: ${key}`)
  return val
}

// ── Singletons ────────────────────────────────────────────────────────────────

let _sadhana:   SadhanaEngine   | null = null
let _pathshala: PathshalaEngine | null = null

// ── getSadhanaEngine ──────────────────────────────────────────────────────────

export function getSadhanaEngine(): SadhanaEngine {
  if (_sadhana) return _sadhana

  // Dynamic import so the heavy engine bundle is NOT included in the
  // server-side render (it's a client-only singleton anyway).
  // We call this synchronously here because the factory is cheap —
  // Supabase client creation does not hit the network.
  const { createSadhanaEngine } = require('@sangam/sadhana-engine') as typeof import('@sangam/sadhana-engine')

  _sadhana = createSadhanaEngine({
    supabaseUrl:              requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey:          requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    aiProvider:               'gemini',
    enableOfflineQueue:       true,
    enablePushNotifications:  false,
    debug:                    process.env.NODE_ENV === 'development',
  })

  return _sadhana
}

// ── getPathshalaEngine ────────────────────────────────────────────────────────

export function getPathshalaEngine(): PathshalaEngine {
  if (_pathshala) return _pathshala

  const { createPathshalaEngine } = require('@sangam/pathshala-engine') as typeof import('@sangam/pathshala-engine')

  _pathshala = createPathshalaEngine({
    supabaseUrl:     requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    debug:           process.env.NODE_ENV === 'development',
  })

  return _pathshala
}

// ── Re-export types so consumers only need one import ─────────────────────────

export type { SadhanaEngine, PathshalaEngine }
