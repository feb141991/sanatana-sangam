# Sanatana Sangam — Intelligent Engine Project Tracker
*Last updated: April 2026 | Maintained across sessions*

---

## Project Overview

Two AI-powered engines being built as standalone TypeScript packages for the Sanatana Sangam PWA:

| Package | Purpose | Status |
|---|---|---|
| `@sangam/sadhana-engine` | Spiritual practice intelligence — tracking, streaks, panchang, community, AI nudges | ✅ Complete (v1) |
| `@sangam/pathshala-engine` | Learning platform — shastra corpus, recitation scoring, group study, multilingual | ✅ Complete (v1) |

Both packages connect to the same Supabase project. Supabase is the single source of truth for all data, Edge Functions, and cron jobs.

---

## Part 1 — `@sangam/sadhana-engine`

### 1A. Database Migrations

| File | Description | Status |
|---|---|---|
| `000_preflight_check.sql` | Verifies pgvector, pg_cron, pg_net extensions exist | ✅ Run |
| `001_phase1_schema.sql` | Core tables: user_practice, mala_sessions, daily_sadhana, sadhana_events, streaks, sankalpa, recommendations, notifications | ✅ Run |
| `002_phase2_ai.sql` | AI tables: scripture_chunks (pgvector), ivfflat index, device_tokens, user_nudges, festivals | ✅ Run |
| `003_mantras.sql` | Mantras table + 40+ mantras seeded (Gayatri, Mahamrityunjaya, Hare Krishna, etc.) | ✅ Run |
| `004_device_tokens.sql` | OneSignal device token storage for push notifications | ✅ Run |
| `005_patch_idempotency.sql` | Idempotency fixes on earlier migrations | ✅ Run |
| `006_community_intelligence.sql` | Kul views: kul_practice_today, kul_weekly_stats, kul_member_profiles, kul_pending_tasks. pg_cron jobs: daily-kul-nudge, weekly-kul-summary. FIXED: removed CURRENT_DATE from partial index (STABLE not IMMUTABLE) | ✅ Run |
| `007_nitya_karma.sql` | nitya_karma_log (7 boolean steps + generated columns), nitya_karma_streaks, mark_nitya_step() RPC | ✅ Run |
| `008_tirtha.sql` | tirthas table, tirtha_visits, yatra_plans, user_tirtha_progress view. Seeded: 4 Char Dham, 7 Chota Char Dham, 12 Jyotirlingas, 10 Shakti Peeths | ✅ Run |
| `009_memorisation.sql` | memorisation_queue (SM-2 fields), memorisation_history, sm2_review() RPC, memorisation_due view | ✅ Run |
| `010_sanskar.sql` | sanskars table, user_sanskars, all 16 sanskaras seeded. FIXED: SQL apostrophe escaping ('') and malformed JSONB in chudakarma | ✅ Run |

**Extensions required (must be enabled in Supabase dashboard):**
- `pgvector` ✅
- `pg_cron` ✅
- `pg_net` ✅ (was missing, enabled manually)

### 1B. Edge Functions

| Function | Purpose | Status |
|---|---|---|
| `compute-profile` | Computes user sadhana profile from events | ✅ Deployed |
| `ai-personalise` | Today's personalised content (panchang + profile + Gemini) | ✅ Deployed |
| `ai-ask-scripture` | Semantic scripture search via pgvector RAG + Gemini | ✅ Deployed |
| `ai-nudge` | Individual practice nudge (OneSignal push) | ✅ Deployed |
| `ai-kul-nudge` | Community accountability nudge — "your kul is practicing" | ✅ Deployed |
| `ai-kul-summary` | Weekly kul digest — Gemini writes summary, posts to kul feed | ✅ Deployed |
| `ai-kul-task` | Guardian assigns AI-suggested practice task to kul member | ✅ Deployed |
| `ai-nitya-sequence` | Morning 7-step sequence personalised by panchang + tradition | ✅ Deployed |
| `ai-shloka-quiz` | MCQ / fill-in / meaning quiz for shloka memorisation | ✅ Deployed |
| `ai-yatra-guide` | Tirtha pilgrimage guide (planning/arriving/completed contexts) | ✅ Deployed |
| `ai-sanskar-guide` | Personalised guide for any of the 16 sanskaras | ✅ Deployed |
| `ai-practice-plan` | AI-generated 7-day weekly sadhana plan with panchang integration | ✅ Deployed |

**Cron jobs (via pg_cron + pg_net):**
- `daily-kul-nudge` — fires daily, calls `ai-kul-nudge` for all users
- `weekly-kul-summary` — fires Sunday, calls `ai-kul-summary` for all kuls
- 1 additional job (3 total confirmed active)

**Secrets required in Supabase:**
- `GEMINI_API_KEY` ✅
- `ONESIGNAL_APP_ID` ✅
- `ONESIGNAL_API_KEY` ✅

### 1C. Client Modules (`src/`)

#### `src/core/`
| Module | Class | Key Methods | Status |
|---|---|---|---|
| `tracker.ts` | `SadhanaTracker` | trackJapaSession(), trackAppOpen(), trackNotification(), syncAll() | ✅ |
| `streaks.ts` | `StreakTracker` | getCurrentStreak(), updateStreak(), getStreakHistory() | ✅ |
| `profile.ts` | `ProfileComputer` | computeProfile(), getProfile(), getTraditionConfig() | ✅ |
| `nitya-karma.ts` | `NityaKarma` | getMorningSequence(), markStep(), getTodayLog(), getStreak(), completionPercent() | ✅ |

#### `src/content/`
| Module | Class | Key Methods | Status |
|---|---|---|---|
| `panchang.ts` | `PanchangCalculator` | getToday(), getTodayFull(), getTithiName(), isEkadashi(), getUpcomingVratas() | ✅ |
| `text-library.ts` | `TextLibrary` | getTexts(), getChapters(), getVerses(), getVerse() | ✅ |
| `mantra-library.ts` | `MantraLibrary` | getAll(), getByTradition(), getByDeity(), getByLevel(), getById() | ✅ |
| `tirtha-library.ts` | `TirthaLibrary` | getAll(), getByType(), getNearby(), getYatraGuide(), logVisit(), getProgress(), createPlan() | ✅ |
| `sanskar-guide.ts` | `SanskarGuide` | getAll(), getByLifeStage(), getGuide(), recordSanskar(), getRecommended() | ✅ |

#### `src/ai/`
| Module | Class | Key Methods | Status |
|---|---|---|---|
| `scripture-search.ts` | `ScriptureSearch` | ask(), search(), findSimilar() | ✅ |
| `personalise.ts` | `PersonalisationEngine` | getTodayContent(), getStats(), recordFeedback() | ✅ |
| `nudge.ts` | `NudgeEngine` | registerDevice(), sendNudge(), scheduleDaily(), getHistory() | ✅ |
| `memorization.ts` | `MemorizationEngine` | getDueCards(), getNextQuiz(), submitReview(), getStats(). Implements SM-2 algorithm | ✅ |
| `practice-plan.ts` | `PracticePlan` | getWeeklyPlan(), getTodayPlan(), getUpcomingVratas(), getOrGeneratePlan() | ✅ |

#### `src/community/`
| Module | Class | Key Methods | Status |
|---|---|---|---|
| `kul-intelligence.ts` | `KulIntelligence` | sendKulNudge(), getWeeklySummary(), suggestTask(), createTask(), getLiveActivity(), getDailyKulPulse() | ✅ |
| `sankalpa.ts` | `SankalpaManager` | create(), checkin(), getActive(), getProgress(), markBroken(). SANKALPA_DURATIONS + PURASHCHARANA_TARGETS constants | ✅ |
| `mandali.ts` | `MandaliManager` | scheduleSatsang(), logSeva(), createGroupChallenge(), contributeToChallenge(), getSharedKulMembers() | ✅ |

#### `src/index.ts` — Public API surface
All modules instantiated in `createSadhanaEngine()` and exposed on the `SadhanaEngine` interface:

```ts
engine.tracker        // SadhanaTracker
engine.streaks        // StreakTracker
engine.profile        // ProfileComputer
engine.panchang       // PanchangCalculator
engine.texts          // TextLibrary
engine.sync           // SyncManager
engine.supabase       // raw SupabaseClient
engine.setUser()      // userId binding

engine.search         // ScriptureSearch
engine.personalise    // PersonalisationEngine
engine.nudge          // NudgeEngine
engine.mantras        // MantraLibrary

engine.kul            // KulIntelligence

engine.nityaKarma     // NityaKarma
engine.memorize       // MemorizationEngine
engine.tirthas        // TirthaLibrary
engine.sanskars       // SanskarGuide

engine.practicePlan   // PracticePlan
engine.sankalpa       // SankalpaManager
engine.mandali        // MandaliManager
```

TypeScript: ✅ Zero errors (`tsc --noEmit` clean)

### 1D. Key Technical Decisions Recorded

| Decision | Choice | Reason |
|---|---|---|
| AI provider | Gemini Flash (free tier) | Cost — no OpenAI charges |
| STT (future) | Groq Whisper large-v3 (free tier) | Best free multilingual, handles Sanskrit/Indian languages |
| Push notifications | OneSignal REST API | Free tier sufficient, pre-integrated |
| Panchang calculation | J2000 astronomical (local, no API) | Epoch: 947182440000ms, lunar month: 29.53058867 days |
| Shloka memorisation | SuperMemo SM-2 algorithm | Industry standard for spaced repetition |
| Scripture search | pgvector ivfflat cosine index | Native to Supabase, no external vector DB needed |
| Offline support | Dexie.js IndexedDB | Browser-native, events sync when back online |

### 1E. Integration with Sangam PWA

See **Part 7** for the complete PWA integration guide.

---

## Part 2 — `@sangam/pathshala-engine` ✅ Complete (v1)

### 2A. Build Status

| Layer | Items | Status |
|---|---|---|
| Database migrations | 011_pathshala_schema.sql, 012_pathshala_seed.sql | ✅ Run in Supabase |
| Edge Functions | ai-recitation-score, ai-pathshala-explain, ai-shloka-of-day | ✅ Deployed |
| Client package | 9 modules — corpus, enrollment, progress, shruti, explain, shloka-of-day, study-circle, badges, languages | ✅ tsc clean |
| Storage bucket | `pathshala-recordings` (private, 10 MB limit) | ✅ Created |
| Secrets | GEMINI_API_KEY, GROQ_API_KEY | ✅ Set |

### 2B. What Pathshala Is

A complete digital gurukul — structured learning paths through the Sanatana corpus (Vedas, Upanishads, Gita, Mahabharata, Ramayana, Puranas, Tamil pasurams, Hindi dohas, and more), with AI explanation, spaced repetition, voice recitation scoring, and kul/mandali group study.

### 2C. The Corpus — Text Categories

| Category | Texts | Languages |
|---|---|---|
| **Shruti** | 4 Vedas (Samhita, Brahmana, Aranyaka, Upanishad), 108 Upanishads | Sanskrit |
| **Smriti — Itihasa** | Ramayana (7 kandas, ~24k shlokas), Mahabharata (18 parvas, ~100k shlokas) | Sanskrit, Hindi |
| **Smriti — Gita** | Bhagavad Gita (18 chapters, 700 shlokas) — standalone from Bhishma Parva | Sanskrit |
| **Smriti — Purana** | 18 Mahapuranas (Bhagavata, Vishnu, Shiva, Devi Bhagavata priority) | Sanskrit |
| **Darshana** | Yoga Sutras of Patanjali (196 sutras), Brahma Sutras | Sanskrit |
| **Bhakti — North** | Ram Charit Manas (Awadhi), Kabir dohas, Surdas pads, Mirabai bhajans | Hindi/Awadhi |
| **Bhakti — South Tamil** | Nalayira Divya Prabandham (4000 pasurams), Thiruvasagam, Thirukural | Tamil |
| **Bhakti — Bengali** | Chandi, Chaitanya kirtans, Vaishnava padavali | Bengali |
| **Bhakti — Telugu** | Annamayya kirtanas, Vemana padyalu | Telugu |
| **Bhakti — Kannada** | Basavanna vachanas, Madhva Vedanta texts | Kannada |
| **Bhakti — Marathi** | Tukaram abhangas, Dnyaneshwari | Marathi |
| **Bhakti — Gujarati** | Narsi Mehta bhajans | Gujarati |
| **Bhakti — Odia** | Sarala Mahabharata, Panchasakha texts | Odia |
| **Agama** | Shaiva Agamas (28), Pancharatra, Shakta Tantras | Sanskrit |
| **Stotra** | Soundarya Lahari, Shivananda Lahari, Lalita Sahasranama | Sanskrit |

### 2D. Multilingual Architecture — Three Layers

**Layer 1 — Content language** (what texts exist in)
- `scripture_chunks` extended with: `language`, `script`, `transliteration` (IAST), `tradition_region`, `text_category`
- New `pathshala_translations` table: one row per (chunk × language)

**Layer 2 — UI language** (app interface i18n)
- Handled in the PWA via next-intl / i18next
- User profile stores `preferred_ui_language`
- Engine is language-agnostic; translations are a PWA concern
- Ship: English + Hindi first

**Layer 3 — Recitation language** (what the user chants and is scored on)
- Language-specific phonological scoring rubrics
- Groq Whisper detects OR user specifies language

**Supported recitation languages and their scoring dimensions:**

| Language | Script | Scoring Dimensions |
|---|---|---|
| Sanskrit | Devanagari / IAST | Uccharan, Visarga, Sandhi, Laya, Svara (Vedic only) |
| Hindi / Awadhi | Devanagari | Uccharan, Nasal vowels, Retroflex, Fluency |
| Tamil | Tamil script | Short/long vowel, Aytam, Grantha letters |
| Bengali | Bengali script | ব/ভ distinction, Inherent vowel dropping |
| Telugu | Telugu script | Vowel length, Aspirate/unaspirate |
| Kannada | Kannada script | Length distinction, anusvara |
| Malayalam | Malayalam script | Chillu letters, Length |
| Marathi | Devanagari | Similar to Sanskrit, chandrabindu |
| Gujarati | Gujarati script | Similar to Hindi |
| Odia | Odia script | Script-specific phonemes |

### 2E. Feature Pillars

#### Pillar 1 — Structured Curriculum Paths
Users enroll in a predefined learning path. Engine tracks position, daily progress, and completion.

**7 launch paths:**

| Path | Language | Content | Duration |
|---|---|---|---|
| Bhagavad Gita — 18 Chapters | Sanskrit + translations | 700 shlokas | 18 weeks |
| Principal Upanishads | Sanskrit | Isha, Kena, Katha, Mundaka, Mandukya | 10 weeks |
| Mahabharata Story Mode | Hindi (narrative) | All 18 parvas | 52 weeks |
| Ram Charit Manas | Awadhi/Hindi | 7 kandas, doha + chaupai | 24 weeks |
| Nalayira Divya Prabandham | Tamil | 4000 pasurams, 12 Alvars | 40 weeks |
| Yoga Sutras of Patanjali | Sanskrit | 196 sutras + Vyasa bhashya | 8 weeks |
| Kabir & Sant Tradition | Hindi | Dohas, sakhis, pads | 12 weeks |

#### Pillar 2 — Smart Learning Cards (4 types)
- **Meaning cards** — Sanskrit → transliteration → meaning → daily life application
- **Commentary cards** — same verse, three acharya perspectives (Shankara / Ramanuja / Madhva)
- **Story cards** — for Itihasa, character and event context
- **Concept cards** — dharma, karma, moksha, atman defined across texts

#### Pillar 3 — Shruti (Voice Recitation Scoring)

**Mode A — AI Scoring (v1 — building first)**
1. User records audio in browser (MediaRecorder API → webm/mp3)
2. Upload to Supabase Storage
3. Call `ai-recitation-score` Edge Function
4. Groq Whisper (`whisper-large-v3`) transcribes with word-level timestamps
5. Word diff: what was said vs. expected text
6. Gemini analyses phonological errors per language's rules
7. Returns structured score + per-word corrections

**Mode B — Guru Review (v2)**
1. User submits with "Request Guru Review" flag
2. System finds kul guardian (guardian role in kul_members)
3. OneSignal push to guardian
4. Guardian plays audio, sees expected text, submits structured rating
5. Optional: `is_certified = true` — formal mastery certification
6. User notified with feedback

**Mode C — Peer & Kul Group Recitation (v2)**
- Guardian sets kul-wide recitation challenge
- All submissions visible in kul feed
- Guardian selects "Shloka of the Week" winner
- Live satsang mode for mandali meetings

**Scoring dimensions:**
```
Uccharan  — phoneme accuracy          (all languages)
Visarga   — ḥ sound accuracy          (Sanskrit)
Sandhi    — word junction rules        (Sanskrit)
Laya      — rhythm and meter           (all, strict for Sanskrit)
Svara     — udatta/anudatta/svarita    (Vedic Samhitas only)
Fluency   — smooth vs. halting         (all languages)
```

#### Pillar 4 — AI Teacher
Tradition-aware, path-aware, context-aware explanations:
- Knows which path you're on and where
- Knows your tradition, deity, lineage from sadhana engine profile
- Knows your active sankalpa — can connect verse to your current vow
- Commentary comparison: Advaita vs Vishishtadvaita vs Dvaita for relevant verses
- Answers in user's preferred language

#### Pillar 5 — Quiz Ecosystem (4 types)
- **Memorisation quiz** — MCQ/fill/meaning (reuses existing `ai-shloka-quiz`)
- **Comprehension quiz** — tested on passage just read
- **Cross-text quiz** — "Which Purana also tells this story?"
- **Kul quiz night** — synchronous, whole kul answers, live leaderboard

#### Pillar 6 — Engagement Mechanics
- **Reading streaks** per curriculum path (separate from japa streak)
- **Badges**: "Gita Adhikari" (all 18 chapters), "Upanishad Seeker" (5 principal), "Vyas Bhakta" (50 parvas), "Pandit" (5 perfect AI recitation scores), "Veda Pathaka" (Vedic chanting assessment), "Sant Shiromani" (Kabir path complete)
- **Shloka of the Day** — personalised to path position, panchang, tradition. On Ekadashi: always from Gita/Bhagavatam
- **Connection finder** — bridges to sadhana engine: "This verse connects to the mantra you chanted this morning"
- **Kul leaderboard** — who's furthest in group reading circle

#### Pillar 7 — Kul & Mandali Group Study
- Guardian creates a **Pathshala Circle** tied to a path and kul
- Daily portion auto-assigned to each member
- Progress visible across the kul
- Guardian assigns specific shlokas via existing `kul_tasks` system
- Weekly kul trivia generated from that week's group readings

### 2F. Database Schema (Migration 011 + 012 — Built)

**Migration 011 — Pathshala core schema:**
```sql
-- Extend scripture_chunks
language, script, transliteration, tradition_region, text_category

-- New tables
pathshala_translations         -- chunk × language × translated text
pathshala_paths               -- curriculum path definitions (seeded)
pathshala_path_chunks         -- path → chunks ordered (week, day position)
pathshala_enrollments         -- user × path × progress position
pathshala_progress            -- user × chunk × completion + scores
pathshala_recordings          -- Supabase Storage audio refs (Shruti)
pathshala_recitation_reviews  -- AI + guru scores per recording
pathshala_verse_mastery       -- rollup: best scores, certified flag
pathshala_badges              -- badge definitions
pathshala_user_badges         -- earned badges per user
pathshala_study_circles       -- kul × path group reading
pathshala_circle_members      -- circle × user membership
```

**Migration 012 — Seed data:**
```sql
-- 7 curriculum paths
-- Badge definitions (12 launch badges)
-- Update scripture_chunks with language/script/category metadata
-- Initial translations for Gita (Hindi + English) if content available
```

### 2G. Edge Functions (Deployed)

| Function | Input | What it does | Status |
|---|---|---|---|
| `ai-recitation-score` | audio_url, chunk_id, user_id, language | Groq Whisper STT → word diff → Gemini phonological analysis → structured score + corrections | ✅ Deployed |
| `ai-pathshala-explain` | chunk_id, user_id, commentary_mode? | AI teacher: tradition-aware explanation, optional multi-commentary comparison | ✅ Deployed |
| `ai-shloka-of-day` | user_id | Picks verse from user's path position + panchang + tradition, returns with explanation | ✅ Deployed |
| `ai-pathshala-quiz` | chunk_id?, path_id?, quiz_type | Comprehension / cross-text / tradition quiz generation | 🔲 v2 |
| `ai-kul-trivia` | circle_id, week_number | Generates quiz set from that week's group reading | 🔲 v2 |
| `ai-translate-verse` | chunk_id, target_language | On-demand translation, flagged as ai_generated until verified | 🔲 v2 |

### 2H. Client Module Structure (`@sangam/pathshala-engine`) — Built

```
src/
  core/
    corpus.ts          ✅  listTexts, getVerse, search, getTranslations
    enrollment.ts      ✅  getAllPaths, enroll, advance, getTodayLessons, getNextChunk
    progress.ts        ✅  markRead, getMastery, getCertifiedVerses, getSummary
  ai/
    shruti.ts          ✅  upload, score, uploadAndScore, submitForGuruReview, postGuruReview
    explain.ts         ✅  explain (single commentary), compare (3-acharya side-by-side)
    shloka-of-day.ts   ✅  getToday, getCached, getOrFetch
  community/
    study-circle.ts    ✅  create, join, leave, getLeaderboard, getWeeklyTarget
  content/
    badges.ts          ✅  getAll, getEarned, checkAndAward
  i18n/
    languages.ts       ✅  13 language configs, SUPPORTED_LANGUAGES, getScoringDimensions
  index.ts             ✅  PathshalaEngine interface + createPathshalaEngine()
```

**Public API surface:**
```ts
engine.corpus       // Corpus
engine.enrollment   // Enrollment
engine.progress     // Progress
engine.shruti       // ShrutiEngine
engine.explain      // ExplainEngine
engine.shlokaOfDay  // ShlokaOfDayEngine
engine.studyCircle  // StudyCircleManager
engine.badges       // BadgeManager
engine.supabase     // raw SupabaseClient
```

### 2I. Reuse from Sadhana Engine

| Sadhana Engine component | How Pathshala uses it |
|---|---|
| `scripture_chunks` + pgvector | Core corpus store; Pathshala extends with metadata |
| `ScriptureSearch` | Powers AI Teacher's RAG for contextual explanations |
| `MemorizationEngine` (SM-2) | Reused for shloka memorisation within paths |
| `ai-shloka-quiz` | Reused for memorisation quiz type |
| `KulIntelligence` | Group study circles and kul trivia sit on top |
| `PanchangCalculator` | Shloka of the Day uses panchang for festival-aware selection |
| `PersonalisationEngine` | AI Teacher knows user's tradition/deity/depth |
| `SankalpaManager` | Connection finder — links verses to active sankalpa |

**Mastery model — three axes per verse:**
```
Know the meaning    →  MemorizationEngine  (SM-2 review score)
Say it correctly    →  ShrutiEngine        (recitation AI score)
Live it daily       →  SankalpaManager + NityaKarma
```
A verse is truly "mastered" when all three are green AND optionally `is_certified = true` (guru-confirmed).

---

## Part 3 — Build Order (What to Do Next)

### Immediate next steps

```
Step 1  →  011_pathshala_schema.sql        ✅ Run
Step 2  →  012_pathshala_seed.sql          ✅ Run
Step 3  →  ai-recitation-score             ✅ Deployed
Step 4  →  ai-pathshala-explain            ✅ Deployed
Step 5  →  ai-shloka-of-day               ✅ Deployed
Step 6  →  src/core/corpus.ts             ✅ Built
Step 7  →  src/core/enrollment.ts         ✅ Built
Step 8  →  src/ai/shruti.ts               ✅ Built
Step 9  →  src/ai/explain.ts              ✅ Built
Step 10 →  src/community/study-circle.ts  ✅ Built
Step 11 →  src/index.ts                   ✅ Built (tsc clean)
Step 12 →  PWA integration                🔲 Next — EngineProvider + hooks + screen wiring
Step 13 →  Seed real scripture content    🔲 Next — import actual shloka text into scripture_chunks
Step 14 →  ai-pathshala-quiz              🔲 v2 — comprehension + cross-text quiz
Step 15 →  ai-kul-trivia                  🔲 v2 — kul quiz night
Step 16 →  src/ai/quiz.ts                 🔲 v2 — all quiz types client
```

### Pending for Sadhana Engine (before moving to Pathshala)

- [ ] Deploy any undeployed Phase 4 functions if not already live
- [ ] PWA integration: `EngineProvider` + `useEngine()` hook + auth bridge
- [ ] OneSignal SDK: call `engine.nudge.registerDevice()` on push permission grant
- [ ] Extend tirtha seed data: remaining 41 Shakti Peeths, Divya Desams (108)

---

## Part 4 — Architecture Decisions (Standing)

| Concern | Decision |
|---|---|
| AI | Gemini Flash (free tier) for all generative tasks |
| STT | Groq Whisper large-v3 (free tier, ~2hr audio/day) — handles Sanskrit, Hindi, Tamil, Bengali, Telugu, Kannada, Malayalam, Marathi, Gujarati, Odia |
| Vector search | pgvector (ivfflat, cosine) — native to Supabase, no external service |
| Audio storage | Supabase Storage — recitation audio blobs |
| Offline queue | Dexie.js IndexedDB — events survive connectivity loss |
| Push | OneSignal REST API (free tier) |
| Panchang | J2000 local astronomical — no external API, works offline |
| Memorisation | SuperMemo SM-2 — implemented as Postgres RPC |
| Recitation scoring | Groq Whisper (transcript) → word diff → Gemini (phonological analysis per language) |
| Guru review | Kul guardian role — any kul member with guardian status can review |
| Multi-language UI | next-intl / i18next in PWA — engine is language-agnostic |
| Package structure | Two separate packages sharing one Supabase project |

---

## Part 5 — Secrets & Config Reference

| Secret | Where used | Status |
|---|---|---|
| `GEMINI_API_KEY` | All Edge Functions | ✅ Set |
| `ONESIGNAL_APP_ID` | ai-nudge, ai-kul-nudge | ✅ Set |
| `ONESIGNAL_API_KEY` | ai-nudge, ai-kul-nudge | ✅ Set |
| `GROQ_API_KEY` | ai-recitation-score | ✅ Set |

---

## Part 6 — Key Bugs Fixed (Reference)

| Bug | Root cause | Fix applied |
|---|---|---|
| Migration 006 IMMUTABLE error | `WHERE event_date >= CURRENT_DATE` in partial index predicate — CURRENT_DATE is STABLE not IMMUTABLE | Removed WHERE clause; plain index still supports range queries at runtime |
| Migration 010 syntax error | Shell-style `'\''` apostrophe escaping in SQL string literals (SQL uses `''`) + malformed JSONB key in chudakarma | Python replace script across the file |
| `nitya-karma.ts` TS error | `NityaKarmaLog` cast to `Record<string, unknown>` without double cast | Added `as unknown as Record<string, unknown>` |
| `offline-queue.ts` TS error | `OfflineEvent extends SadhanaEvent` but overrides `id` as `number` vs `string` | Rewrote `OfflineEvent` as standalone interface, destructured away `id` in `addEvent()` |
| `tracker.ts` TS error | `syncOne()` typed as `SadhanaEvent` but called with `OfflineEvent` | Widened parameter to accept `{ id?: string \| number; user_id; event_type; event_data }` |
| Wrong table in seeding check | Suggested `scripture_verses` (doesn't exist) — correct table is `scripture_chunks` | Corrected query |

---

---

## Part 7 — PWA Integration Guide

Both engines are standalone TypeScript packages. The Sangam PWA wires them in through a React context layer, then every screen consumes them through hooks. No screen talks to Supabase directly — everything goes through an engine method.

### 7A. Install Both Packages

In the PWA's `package.json` (monorepo workspace setup):

```json
{
  "dependencies": {
    "@sangam/sadhana-engine": "workspace:../packages/sadhana-engine",
    "@sangam/pathshala-engine": "workspace:../packages/pathshala-engine"
  }
}
```

If not a monorepo yet, copy the `src/` folders in as `lib/sadhana-engine/` and `lib/pathshala-engine/` — the internal import paths are the same.

### 7B. Create the Two Singletons

**`lib/sadhana-engine.ts`**
```ts
import { createSadhanaEngine } from '@sangam/sadhana-engine'

export const sadhanaEngine = createSadhanaEngine({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})
```

**`lib/pathshala-engine.ts`**
```ts
import { createPathshalaEngine } from '@sangam/pathshala-engine'

export const pathshalaEngine = createPathshalaEngine({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})
```

Both engines share the same Supabase project, same env vars.

### 7C. EngineProvider + Dual Hooks

**`contexts/EngineContext.tsx`**
```tsx
import { createContext, useContext, useEffect } from 'react'
import { sadhanaEngine } from '@/lib/sadhana-engine'
import { pathshalaEngine } from '@/lib/pathshala-engine'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'

const EngineContext = createContext({ sadhana: sadhanaEngine, pathshala: pathshalaEngine })

export function EngineProvider({ children }: { children: React.ReactNode }) {
  const session = useSupabaseSession()

  // Auth bridge — engines need userId for all personalised queries
  useEffect(() => {
    const userId = session?.user?.id ?? null
    sadhanaEngine.setUser(userId)
    // pathshalaEngine queries always pass userId explicitly,
    // but storing it here avoids prop-drilling
  }, [session])

  return (
    <EngineContext.Provider value={{ sadhana: sadhanaEngine, pathshala: pathshalaEngine }}>
      {children}
    </EngineContext.Provider>
  )
}

export const useEngine = () => useContext(EngineContext).sadhana
export const usePathshala = () => useContext(EngineContext).pathshala
```

**`app/layout.tsx`** (or `_app.tsx`):
```tsx
import { EngineProvider } from '@/contexts/EngineContext'

export default function RootLayout({ children }) {
  return (
    <EngineProvider>
      {children}
    </EngineProvider>
  )
}
```

### 7D. Auth Bridge — Supabase Session → Engine

The engines don't manage auth themselves — Supabase Auth is handled by the PWA. The bridge is just:

```ts
// In EngineProvider useEffect, or in your auth hook:
supabase.auth.onAuthStateChange((_event, session) => {
  sadhanaEngine.setUser(session?.user?.id ?? null)
})
```

After `setUser()` is called, every engine method that needs `userId` will use it automatically. Before login the engines still work — corpus browsing, panchang, mantra library all work unauthenticated.

### 7E. Screen-by-Screen Wiring Map

#### Sadhana Engine → PWA Screens

| Screen | Hook | Engine methods used |
|---|---|---|
| **Home / Dashboard** | `useEngine()` | `engine.panchang.getToday()`, `engine.personalise.getTodayContent()`, `engine.streaks.getCurrentStreak()` |
| **Japa Counter** | `useEngine()` | `engine.tracker.trackJapaSession()`, `engine.streaks.updateStreak()` |
| **Nitya Karma / Morning Routine** | `useEngine()` | `engine.nityaKarma.getMorningSequence()`, `engine.nityaKarma.markStep()`, `engine.nityaKarma.getTodayLog()` |
| **Mantra Library** | `useEngine()` | `engine.mantras.getAll()`, `engine.mantras.getByTradition()`, `engine.mantras.getByDeity()` |
| **Kul Home** | `useEngine()` | `engine.kul.getLiveActivity()`, `engine.kul.getDailyKulPulse()`, `engine.kul.getWeeklySummary()` |
| **Kul Tasks** | `useEngine()` | `engine.kul.suggestTask()`, `engine.kul.createTask()`, `engine.mandali.logSeva()` |
| **Sankalpa** | `useEngine()` | `engine.sankalpa.create()`, `engine.sankalpa.checkin()`, `engine.sankalpa.getActive()`, `engine.sankalpa.getProgress()` |
| **Memorisation / Flashcards** | `useEngine()` | `engine.memorize.getDueCards()`, `engine.memorize.getNextQuiz()`, `engine.memorize.submitReview()` |
| **Tirtha / Pilgrimages** | `useEngine()` | `engine.tirthas.getAll()`, `engine.tirthas.getYatraGuide()`, `engine.tirthas.logVisit()` |
| **Sanskar Guide** | `useEngine()` | `engine.sanskars.getRecommended()`, `engine.sanskars.getGuide()`, `engine.sanskars.recordSanskar()` |
| **Weekly Sadhana Plan** | `useEngine()` | `engine.practicePlan.getOrGeneratePlan()`, `engine.practicePlan.getTodayPlan()` |
| **Satsang / Mandali** | `useEngine()` | `engine.mandali.scheduleSatsang()`, `engine.mandali.createGroupChallenge()` |
| **Ask Scripture (AI chat)** | `useEngine()` | `engine.search.ask()`, `engine.search.search()` |
| **Push notification opt-in** | `useEngine()` | `engine.nudge.registerDevice(oneSignalPlayerId)` |

#### Pathshala Engine → PWA Screens

| Screen | Hook | Engine methods used |
|---|---|---|
| **Pathshala Home** | `usePathshala()` | `engine.shlokaOfDay.getOrFetch()`, `engine.enrollment.getActive()`, `engine.badges.getEarned()` |
| **Curriculum Browser** | `usePathshala()` | `engine.enrollment.getAllPaths()`, `engine.corpus.listTexts()` |
| **Enroll in Path** | `usePathshala()` | `engine.enrollment.enroll(pathId, userId)` |
| **Daily Lesson** | `usePathshala()` | `engine.enrollment.getTodayLessons()`, `engine.progress.markRead()`, `engine.enrollment.advance()` |
| **Verse Detail / AI Teacher** | `usePathshala()` | `engine.explain.explain(chunkId, userId, language)`, `engine.explain.compare(chunkId, userId, language)` |
| **Recitation Recorder** | `usePathshala()` | `engine.shruti.uploadAndScore(file, chunkId, userId, language)` |
| **Recitation History** | `usePathshala()` | `engine.shruti.getRecordings(userId, chunkId)`, `engine.shruti.getStats(userId)` |
| **Guru Review (guardian)** | `usePathshala()` | `engine.shruti.postGuruReview(recordingId, scores, feedback)` |
| **Badge Showcase** | `usePathshala()` | `engine.badges.getEarned(userId)`, `engine.badges.getAll()` |
| **Kul Study Circle** | `usePathshala()` | `engine.studyCircle.getForKul(kulId)`, `engine.studyCircle.getLeaderboard(circleId)` |
| **Progress Summary** | `usePathshala()` | `engine.progress.getSummary(userId, pathId)`, `engine.progress.getFullyMastered(userId)` |
| **Mastery Dashboard** | `usePathshala()` | `engine.progress.getCertifiedVerses(userId)`, `engine.shruti.getMastery(userId, chunkId)` |

### 7F. Cross-Engine Connections (The Bridges)

These are moments where both engines talk to each other in a single screen:

| Feature | How it works |
|---|---|
| **Shloka of Day + Sankalpa** | `pathshala.shlokaOfDay.getOrFetch()` returns `sankalpa_connection` field — written by Gemini to link the verse to the user's active vow. The active sankalpa is fetched from `sadhana.sankalpa.getActive()` and passed to the Edge Function. |
| **AI Teacher knows your practice** | `pathshala.explain.explain()` receives `userId` and fetches the user's tradition/deity from `sadhana.profile.getProfile()` inside the Edge Function via Supabase. No extra wiring needed in the PWA. |
| **Connection Finder** | On the Verse Detail screen, call `sadhana.search.findSimilar(verse.embedding)` to surface mantras or past reflections that echo the verse. |
| **Kul Tasks → Pathshala** | Guardian uses `sadhana.kul.createTask()` with `task_type: 'recitation'` and `metadata: { chunk_id }`. The task deep-links to the Pathshala recitation screen. |
| **Memorisation continuity** | `sadhana.memorize` is the SM-2 flashcard engine. Pathshala `progress.getMastery()` shows recitation scores. The Verse Detail screen shows both side-by-side — reading mastery (SM-2) + pronunciation mastery (Shruti score). |
| **Panchang-aware lesson** | Pathshala daily lesson skips to Ekadashi-appropriate content when `sadhana.panchang.isEkadashi()` is true. Check panchang once on app boot and pass as context. |

### 7G. Integration Status (Updated April 2026)

#### ✅ Completed

| Item | File | Status |
|---|---|---|
| Engine singletons | `src/lib/engine.ts` | ✅ Done |
| EngineProvider + hooks | `src/contexts/EngineContext.tsx` | ✅ Done |
| ReactQueryProvider | `src/contexts/QueryProvider.tsx` | ✅ Done |
| Noto fonts (7 scripts) | `src/app/layout.tsx` | ✅ Done |
| Main layout wired | `src/app/(main)/layout.tsx` | ✅ Done |
| useNativeAudio (Capacitor) | `src/hooks/useNativeAudio.ts` | ✅ Done |
| Capacitor setup (native) | `capacitor.config.ts`, `android/`, `ios/` | ✅ Done |
| **Japa Counter** | `src/app/(main)/japa/` | ✅ Done — `engine.tracker.trackJapaSession()`, mala counter with progress ring |
| **Nitya Karma** | `src/app/(main)/nitya-karma/` | ✅ Done — `engine.nityaKarma.getMorningSequence()`, step checklist |
| **Pathshala Home** | `src/app/(main)/pathshala/` | ✅ Done — shloka of day, active paths, browse + enroll |
| **AI Chat → RAG** | `src/app/(main)/ai-chat/AIChatClient.tsx` | ✅ Done — `engine.search.ask()` with verse chip display, fallback to plain Gemini |
| Home quick-access | `HomeDashboard.tsx` | ✅ Done — links to Japa, Nitya Karma, Pathshala, Kul |
| BottomNav updated | `src/components/layout/BottomNav.tsx` | ✅ Done — 7 tabs including Pathshala |

#### 🔲 Remaining

| Item | Engine method | Priority |
|---|---|---|
| Pathshala daily lesson screen | `pathshala.enrollment.getTodayLessons()`, `pathshala.progress.markRead()` | HIGH |
| Pathshala recitation screen | `pathshala.shruti.uploadAndScore()` + `useNativeAudio` | HIGH |
| Pathshala AI teacher modal | `pathshala.explain.explain(chunkId, userId, language)` | HIGH |
| Wire Library → corpus | `pathshala.corpus.listTexts()` replaces static `library-content.ts` | MEDIUM |
| Wire Kul → engine.kul | `engine.kul.getLiveActivity()`, `engine.kul.getDailyKulPulse()` | MEDIUM |
| Sankalpa screen (new) | `engine.sankalpa.create()`, `engine.sankalpa.checkin()` | MEDIUM |
| Memorisation / Flashcards (new) | `engine.memorize.getDueCards()`, `engine.memorize.getNextQuiz()` | MEDIUM |
| Tirtha detail + logVisit | `engine.tirthas.getYatraGuide()`, `engine.tirthas.logVisit()` | MEDIUM |
| Sanskar Guide screen (new) | `engine.sanskars.getRecommended()`, `engine.sanskars.getGuide()` | LOW |
| Weekly Sadhana Plan screen (new) | `engine.practicePlan.getOrGeneratePlan()` | LOW |
| Push notification opt-in | `engine.nudge.registerDevice(oneSignalPlayerId)` | LOW |
| Seed scripture corpus | Import real shloka text into `scripture_chunks` (pgvector) | NEEDED for RAG |
| Seed pathshala_paths | Add learning path rows so Pathshala Browse tab shows content | NEEDED for Pathshala |
| Migrations 013–015 | Sikh / Buddhist / Jain tradition layers | v2 |

---

*This document is the single source of truth for the Sanatana Sangam intelligent engine project.*
*Engines: ✅ Complete. PWA integration: 🔄 In progress — core screens done, lesson/recitation/community next.*
