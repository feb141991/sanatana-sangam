# Sadhana Engine — Project Tracker
## Sanatana Sangam Plugin

> Last updated: 12 April 2026
> Status: Phase 1 — Foundation

---

## Key decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 11 Apr 2026 | Dark saffron UI theme (not light) | Prince preferred the dark charcoal + gold aesthetic from the mockup |
| 11 Apr 2026 | Build engine as separate plugin package | Keep existing PWA running untouched; wire in later |
| 11 Apr 2026 | Zero-cost stack using free tiers | GitHub Education Pack + Supabase free + Gemini Flash free + local embeddings |
| 11 Apr 2026 | Gemini Flash as AI layer (not Claude API) | Free tier: 15 req/min, 1M tokens/min. Swap to Claude when budget allows |
| 11 Apr 2026 | Local HuggingFace embeddings (not OpenAI) | Run all-MiniLM-L6-v2 locally, upload vectors to pgvector once |
| 11 Apr 2026 | PWA first, Capacitor APK later | Sideload APK without Play Store for early testing |
| 11 Apr 2026 | 7 practice layers identified | Nitya Karma, Japa, Shastra, Panchang/Vrata, Tirtha, Mandali, Sanskar |
| 11 Apr 2026 | 3 intelligence layers designed | Behavioural tracking, Adaptive AI personalisation, Knowledge engine (pgvector) |

---

## Architecture summary

```
sanatana-sangam/                    ← existing repo (github.com/feb141991/sanatana-sangam)
  src/                              ← existing PWA code (DO NOT TOUCH during engine build)
  packages/
    sadhana-engine/                 ← THIS IS WHAT WE'RE BUILDING
      src/
        core/
          tracker.ts                ← event logging (Phase 1)
          profile.ts                ← practice profile computation (Phase 1)
          streaks.ts                ← streak tracking logic (Phase 1)
        ai/
          personalise.ts            ← daily content generation via Gemini (Phase 2)
          scripture-search.ts       ← pgvector semantic search (Phase 2)
          nudge.ts                  ← adaptive streak recovery (Phase 2)
          practice-plan.ts          ← weekly plan generation (Phase 3)
        content/
          panchang.ts               ← Hindu calendar calculations (Phase 1)
          mantra-library.ts         ← mantra metadata and audio refs (Phase 2)
          text-library.ts           ← scripture content index (Phase 1)
        community/
          mandali.ts                ← group practice tracking (Phase 3)
          sankalpa.ts               ← group commitments (Phase 3)
        types/
          index.ts                  ← all TypeScript types
        utils/
          offline-queue.ts          ← Dexie.js offline buffer (Phase 1)
          sync.ts                   ← sync offline → Supabase (Phase 1)
      supabase/
        migrations/
          001_sadhana_events.sql    ← event log table (Phase 1)
          002_user_practice.sql     ← computed profiles (Phase 1)
          003_scripture_chunks.sql  ← embeddings table (Phase 1)
          004_streaks.sql           ← streak tracking (Phase 1)
          005_recommendations.sql   ← cached AI output (Phase 2)
          006_sankalpa.sql          ← commitments (Phase 3)
        functions/
          compute-profile/          ← nightly cron Edge Function (Phase 1)
          ai-personalise/           ← daily content gen (Phase 2)
          ai-ask-scripture/         ← semantic search (Phase 2)
          ai-nudge/                 ← streak recovery (Phase 2)
        seed/
          gita-chapters.json        ← Bhagavad Gita content (Phase 1)
          mantra-library.json       ← 100+ mantras metadata (Phase 2)
      scripts/
        embed-scriptures.py         ← local embedding generation (Phase 1)
      index.ts                      ← public API exports
      package.json
      tsconfig.json
      README.md
```

---

## Free stack mapping

| Need | Tool | Tier | Limit |
|------|------|------|-------|
| Frontend hosting | Vercel | Free hobby | Unlimited deploys |
| Database + Auth | Supabase | Free | 500 MB, 50K users, Edge Functions |
| Vector search | pgvector (Supabase) | Free | Included in Supabase |
| Cron jobs | pg_cron (Supabase) | Free | Included in Supabase |
| AI personalisation | Google Gemini Flash | Free | 15 req/min, 1M tokens/min |
| AI development | Ollama (local) | Free | Unlimited, runs on your Mac |
| Embeddings | HuggingFace local | Free | Run once, upload vectors |
| Push notifications | OneSignal | Free | 10K web push subscribers |
| Code repo | GitHub Pro | Education | Private repos, Actions CI/CD |
| Coding assistant | GitHub Copilot | Education | Free while student |
| IDE | VS Code / WebStorm | Free / Education | WebStorm via JetBrains licence |
| Domain | Namecheap | Education | 1 year free .me domain |
| Reserve cloud | DigitalOcean | Education | $200 credit |
| Reserve cloud | Azure | Education | $100 credit + 25 services |
| Offline storage | Dexie.js | Free | IndexedDB wrapper, open source |

**Total monthly cost: £0**

---

## Phase plan

### Phase 1: Foundation ✅ COMPLETE
> Goal: Start collecting data from live app + prepare scripture content

- [x] Scaffold engine package structure (25 files)
- [x] Create Supabase migration files (6 tables + vector search function)
- [x] Build event tracker module (tracker.ts) — offline-first with Dexie
- [x] Build streak tracking module (streaks.ts) — daily completion + streak logic
- [x] Build offline queue with Dexie.js (offline-queue.ts) — auto-retry, batch sync
- [x] Build sync module (sync.ts) — auto-sync on reconnect, batch uploads
- [x] Seed Bhagavad Gita sample verses as JSON (10 key verses from Ch 1-3)
- [x] Write Python script to generate embeddings locally (embed-scriptures.py + embed-local.py)
- [x] Build panchang calculator (tithi, nakshatra, yoga, karana, vrata detection, festival detection)
- [x] Build practice profile computation (preferred time, tradition, deity, depth, path inference)
- [x] Build text library (verse navigation, reading progress, bookmarks, next verse logic)
- [x] Create nightly cron Edge Function for profile rebuild (compute-profile)
- [x] Build Gita dataset (build-gita.js) — all 700 verses, 289 curated translations + LSA embeddings
- [x] Write integration tests (panchang, text library, types, seed data, profile logic)
- [x] Run embed-local.py — generated 700-verse TF-IDF/SVD embeddings (384-dim, 80.9% variance)
- [x] Upload gita-full.json + embeddings to Supabase pgvector ✓

### Phase 2: Intelligence (current)
> Goal: AI-powered personalisation and scripture search

- [x] Build scripture-search.ts — Ask Scripture client module (cache, similarVerses, getChapter)
- [x] Build personalise.ts — daily content client module (cache-first, regenerate, weekly plan)
- [x] Build nudge.ts — adaptive streak recovery (learns gentle/challenge/community per user)
- [x] Build ai-ask-scripture Edge Function — text search + Gemini Flash explanation
- [x] Build ai-personalise Edge Function — Gemini daily content (shloka, greeting, practice, nudge)
- [x] Build ai-nudge Edge Function — streak recovery, vrata reminders, morning brahma muhurta
- [x] Wire Phase 2 modules into index.ts public API (search, personalise, nudge)
- [x] Phase 2 SQL migration (002_phase2_ai.sql) — recommendations table, full-text search, cron
- [x] Deploy Edge Functions (ai-ask-scripture, ai-personalise, ai-nudge)
- [x] Set GEMINI_API_KEY secret in Supabase
- [x] Run 002_phase2_ai.sql migration (recommendations table, full-text search, view)
- [x] Build mantra-library.ts — filter, search, getDailyMantra, getVrataMantras
- [x] Seed mantra-library.json — 108 mantras, all traditions, with Devanagari + transliteration
- [x] Build upanishads.json — 137 verses, 5 Upanishads (Isha, Kena, Katha, Mundaka, Mandukya)
- [x] 003_mantras.sql migration + seed-mantras.js script
- [x] Wire MantraLibrary into index.ts public API
- [x] DB collision audit — all 4 migrations hardened for live-DB safety
  - [x] 000_preflight_check.sql — read-only diagnostic, run FIRST before any migration
  - [x] 003_mantras.sql — all indexes now use IF NOT EXISTS
  - [x] 004_device_tokens.sql — policy creation wrapped in DO block
  - [x] 005_patch_idempotency.sql — retroactively fixes 001+002 (bare indexes → IF NOT EXISTS,
        policies → DO blocks, cron job → unschedule+reschedule, mantras RLS lockdown)

**SAFE MIGRATION ORDER (run in Supabase SQL Editor):**
  1. 000_preflight_check.sql — review output, confirm no table name collisions
  2. 003_mantras.sql — creates mantras table (if not yet run)
  3. 005_patch_idempotency.sql — hardens everything already in DB
  4. 004_device_tokens.sql — device_tokens for OneSignal

- [ ] Run 000_preflight_check.sql — review output for any existing-app table conflicts
- [ ] Run 003_mantras.sql in Supabase SQL Editor
- [ ] Run 005_patch_idempotency.sql to harden 001+002
- [ ] Run 004_device_tokens.sql in Supabase SQL Editor
- [ ] Run seed-mantras.js from Mac to seed 108 mantras
- [ ] Run embed-local.py on upanishads.json to upload vectors to Supabase
- [x] Build OneSignal push notification pipeline
  - [x] 004_device_tokens.sql — device_tokens table + upsert_device_token() SQL function + RLS
  - [x] ai-nudge Edge Function — extended with OneSignal REST delivery (send_push: true)
  - [x] nudge.ts — added registerDevice(), unregisterDevice(), sendPush() methods
- [ ] Set OneSignal secrets in Supabase:
      supabase secrets set ONESIGNAL_APP_ID=your-app-id ONESIGNAL_REST_API_KEY=your-rest-key
- [ ] Redeploy ai-nudge: supabase functions deploy ai-nudge
- [ ] Add OneSignal SDK to PWA + call nudge.registerDevice() on permission grant

### Phase 3: Community Intelligence
> Goal: Mandali features and group practice

- [ ] Build mandali group tracking
- [ ] Build group sankalpa (commitments)
- [ ] Build mandali-level practice leaderboards
- [ ] Build satsang event coordinator
- [ ] Build group japa sessions

### Phase 4: Deep Adaptation
> Goal: Advanced AI features and content depth

- [ ] Weekly practice plan generation
- [ ] Tradition-specific content paths
- [ ] Sanskar lifecycle guide
- [ ] Spaced repetition for shloka memorisation
- [ ] Audio mantra playback integration

---

## Integration plan (when engine is ready)

The existing Sangam PWA connects to the engine by importing its public API:

```typescript
// In existing Sangam app — only when ready to integrate
import { 
  SadhanaEngine,
  useTracker,
  useStreak,
  useTodayContent,
  useAskScripture,
  usePanchang
} from '@sangam/sadhana-engine';

// Initialise once in layout.tsx
<SadhanaEngine supabaseUrl={url} supabaseKey={key}>
  {children}
</SadhanaEngine>

// In Japa screen — track session
const { trackEvent } = useTracker();
await trackEvent('japa_session', { mantra_id: 'gayatri', rounds: 4 });

// In Home screen — get personalised content
const { shloka, greeting, panchang } = useTodayContent(userId);

// In Shastra screen — ask a question
const { results } = useAskScripture("What does Krishna say about fear?");
```

No existing code changes until this integration step. The engine builds and tests independently.

---

## Documents generated

| File | Description |
|------|-------------|
| sangam-design-system-prompt.md | Design system rules for AI tools |
| sangam-reference-code-prompt.md | Reference HTML/CSS for exact replication |
| sangam-intelligent-engine-blueprint.md | Full technical architecture with AI layers |
| sanatana-sangam-dark.jsx | Working dark-theme React mockup (all 5 tabs) |
| This file (tracker) | Project decisions, progress, and plan |

---

## Notes

- Supabase project ID: mnbwodcswxoojndytngу
- Supabase URL: https://mnbwodcswxoojndytngу.supabase.co
- GitHub repo: github.com/feb141991/sanatana-sangam
- Live app: https://sanatana-sangam.vercel.app
- Module manager (MSc): Chris Hargreaves
- Prince's Cranfield MSc runs until ~Sep 2026 — GitHub Education Pack valid during this period
