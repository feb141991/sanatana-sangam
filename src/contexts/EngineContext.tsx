'use client'

// ─── EngineContext — cross-engine React context ───────────────────────────────
//
// <EngineProvider userId="..." tradition="hindu">
//   {children}
// </EngineProvider>
//
// Renders inside app/(main)/layout.tsx (server component).
// The server layout fetches userId + tradition from Supabase and passes them
// as props. This component is a CLIENT component so it can hold React state
// and use useEffect.
//
// Inside any client component:
//   const { engine, pathshala, isReady } = useEngine()
//   const pathshala = usePathshala()   // convenience alias
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { SadhanaEngine, PathshalaEngine } from '@/lib/engine'

// ── Context shape ─────────────────────────────────────────────────────────────

interface EngineContextValue {
  /** Sadhana engine — streaks, tracker, panchang, AI nudge … */
  engine:     SadhanaEngine | null
  /** Pathshala engine — corpus, enrollment, shruti, shloka of day … */
  pathshala:  PathshalaEngine | null
  /** true once both engines are initialised and user is set */
  isReady:    boolean
  /** Current authenticated user id (or null if logged out) */
  userId:     string | null
  /** Active tradition (hindu | sikh | buddhist | jain) */
  tradition:  string
}

const EngineContext = createContext<EngineContextValue>({
  engine:    null,
  pathshala: null,
  isReady:   false,
  userId:    null,
  tradition: 'hindu',
})

// ── Provider ──────────────────────────────────────────────────────────────────

interface EngineProviderProps {
  userId:    string | null
  tradition: string
  children:  ReactNode
}

export function EngineProvider({ userId, tradition, children }: EngineProviderProps) {
  const [value, setValue] = useState<EngineContextValue>({
    engine:    null,
    pathshala: null,
    isReady:   false,
    userId,
    tradition,
  })

  useEffect(() => {
    // Dynamic import keeps engine bundles out of SSR payload
    let cancelled = false

    async function init() {
      const [{ getSadhanaEngine }, { getPathshalaEngine }] = await Promise.all([
        import('@/lib/engine'),
        import('@/lib/engine'),
      ])

      if (cancelled) return

      const engine    = getSadhanaEngine()
      const pathshala = getPathshalaEngine()

      // Bind the authenticated user so every engine call is user-scoped
      if (userId) {
        engine.setUser(userId)
      }

      setValue({
        engine,
        pathshala,
        isReady: true,
        userId,
        tradition,
      })
    }

    init().catch(err => {
      console.error('[EngineProvider] Failed to initialise engines:', err)
    })

    return () => { cancelled = true }
  // Re-run when the logged-in user or tradition changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tradition])

  return (
    <EngineContext.Provider value={value}>
      {children}
    </EngineContext.Provider>
  )
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Access both engines and their ready state */
export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContext)
  if (!ctx) throw new Error('useEngine must be used inside <EngineProvider>')
  return ctx
}

/** Convenience: access only the pathshala engine */
export function usePathshala(): PathshalaEngine | null {
  return useContext(EngineContext).pathshala
}

/** Convenience: access only the sadhana engine */
export function useSadhana(): SadhanaEngine | null {
  return useContext(EngineContext).engine
}
