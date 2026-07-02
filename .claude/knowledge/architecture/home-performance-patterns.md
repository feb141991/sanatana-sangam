# Home Page Performance Architecture

**Date:** 2026-06-07
**Session context:** Phase 1 first-load performance optimisations on the home page
**Category:** architecture

## What we decided

### 1. Collapse daily_sadhana into a single range query

Four separate Supabase queries (today, yesterday, latestStreak, 28-day-history) are replaced with one `gte(historyFrom).lte(today)` range query. `todaySadhana`, `yesterdaySadhana`, `latestStreakRow`, and `sadhanaHistory` are all derived in memory from the single result set. This eliminates 3 DB round-trips per home load.

### 2. unstable_cache for shared/public sub-queries

`force-dynamic` is required on the home page (user auth), so ISR/full-page caching is unavailable. `unstable_cache` from `next/cache` is applied at the sub-query level for non-user-specific data:

| Cached function | Table | TTL | Cache key |
|---|---|---|---|
| `getCachedHeroAssets` | `hero_assets` | 15 min | static |
| `getCachedLiveDarshans` | `live_darshans` | 60 sec | static |
| `getCachedObservances(fromDate)` | `observance_occurrences` | 60 min | fromDate arg |
| `getCachedDharmVeer(tradition)` | `dharm_veer` | 60 min | tradition arg |

All cached functions use `createAdminClient()` (service role) — they bypass RLS intentionally because the data is public and user-identity must not leak into a shared cache key.

### 3. Concurrent query grouping pattern

Public cached queries and user-specific queries run together:

```ts
Promise.all([
  cachedPublicGroup,            // all four cached calls above
  Promise.allSettled([          // user-specific queries
    ...userQueries
  ])
])
```

No sequential waterfall — both groups fire at the same time.

### 4. Dynamic imports for interaction-gated components

In `HomeDashboard.tsx`, components that only render after user interaction are declared with `dynamic(() => import(...), { ssr: false })`:
- `MoodJourneySheet`
- `ConfettiOverlay`

Components visible immediately on mount (`MoodPulse`, `BelowFoldSections` — already dynamic from a prior session) remain or stay static as appropriate.

Rule: static = renders on mount; dynamic = only renders after user triggers it.

## Why

Home page cold load was issuing 4+ sequential or loosely parallelised DB queries for data that is either shared (same for all users) or derivable from a single wider query. Sub-query caching is the canonical Next.js App Router answer when the page itself cannot be statically rendered.

Dynamic imports reduce initial JS bundle size — sheets and confetti have non-trivial dependency trees that do not need to be parsed before first paint.

## Constraints this creates

- All four cached functions MUST use `createAdminClient()`, never the user Supabase client — mixing user identity into a shared cache key would serve wrong data or leak information.
- Cache TTLs are intentionally conservative for live data (`live_darshans` = 60 sec). Do not raise them without checking staleness tolerance.
- Dynamic import declarations must appear after `import dynamic from 'next/dynamic'` in the file — module evaluation order matters.
- Any new shared/public table added to the home page should go through the same `unstable_cache` pattern, not a bare fetch.

## What we explicitly rejected

- Per-page ISR (`revalidate = N`) — not possible because the page contains user-specific auth data.
- Merging all queries into one massive RPC — overly coupled; the cache-per-table pattern is more maintainable and composable.
- Keeping all four `daily_sadhana` queries as separate calls — unnecessary DB load with no benefit over in-memory derivation.

---
