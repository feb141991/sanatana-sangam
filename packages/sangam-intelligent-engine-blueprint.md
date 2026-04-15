# Sanatana Sangam — Intelligent Sadhana Engine
## Technical Blueprint v1.0

---

## 1. Vision: What makes this a powerhouse, not a static engine

A static engine serves the same content to everyone. An intelligent engine observes, learns, adapts, and guides — like a digital guru who knows your practice rhythm, understands your spiritual temperament (adhikara), and nudges you at exactly the right moment.

### Three intelligence layers

**Layer A — Behavioural Learning (runs locally + Supabase)**
Tracks what the user does: when they open the app, which mantras they chant, how long sessions last, which shlokas they bookmark, when they skip days, what time they pray. No AI needed — pure analytics + rules engine.

**Layer B — Adaptive Personalisation (Claude API via Edge Functions)**
Uses the behavioural data to make intelligent decisions: which shloka to show next, when to suggest a new practice, how to word a streak-recovery message, when to recommend a vrata. Claude processes the user's practice profile and returns personalised guidance.

**Layer C — Knowledge Engine (pgvector + embeddings)**
Embeds all scripture content (Gita, Upanishads, Stotras, Vrata Kathas) as vectors in Supabase. When a user asks a question ("What does Krishna say about fear?"), the system does semantic search across all texts and returns contextually relevant verses with Claude-generated explanations.

---

## 2. Architecture — What goes where

```
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS 14 (FRONTEND)                │
│  PWA + Capacitor wrapper                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Japa    │ │  Shastra │ │ Panchang │ │ Mandali  │   │
│  │  Screen  │ │  Reader  │ │ Calendar │ │  Feed    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │             │            │             │         │
│  ┌────▼─────────────▼────────────▼─────────────▼─────┐  │
│  │           EVENT TRACKER (client-side)              │  │
│  │  Logs: screen views, tap events, session          │  │
│  │  durations, completions, skips, bookmarks         │  │
│  └────────────────────┬──────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        │ Supabase client SDK
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE (BACKEND)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              POSTGRES + pgvector                 │    │
│  │                                                  │    │
│  │  sadhana_events     — raw behavioural log        │    │
│  │  user_practice      — computed practice profile  │    │
│  │  scripture_chunks   — text + embeddings          │    │
│  │  recommendations    — cached AI suggestions      │    │
│  │  streaks            — daily completion tracking   │    │
│  │  sankalpa           — user commitments            │    │
│  │  panchang_cache     — pre-computed calendar       │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │           EDGE FUNCTIONS (Deno)                  │    │
│  │                                                  │    │
│  │  /ai/personalise    — Claude: daily content      │    │
│  │  /ai/ask-scripture  — Claude + pgvector search   │    │
│  │  /ai/streak-nudge   — Claude: recovery messages  │    │
│  │  /ai/practice-plan  — Claude: weekly plan        │    │
│  │  /panchang/compute  — Tithi/nakshatra calc       │    │
│  │  /embed/ingest      — Generate embeddings        │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │           SUPABASE CRON JOBS                     │    │
│  │                                                  │    │
│  │  Daily 3 AM  — compute practice profiles         │    │
│  │  Daily 4 AM  — generate personalised content     │    │
│  │  Daily 4:15  — send push notifications           │    │
│  │  Weekly Sun  — generate weekly practice plans    │    │
│  │  Monthly 1st — update panchang cache             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL APIs                              │
│  Claude API (Anthropic) — intelligence layer            │
│  Voyage/OpenAI — embeddings generation                  │
│  OneSignal/FCM — push notifications                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Behavioural Learning System (Layer A)

### What we track (sadhana_events table)

```sql
CREATE TABLE sadhana_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL,    -- 'japa_session', 'shloka_read', 'app_open', etc.
  event_data JSONB,            -- flexible payload per event type
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Example events:
-- { event_type: 'japa_session', event_data: { mantra_id: 'gayatri', rounds: 4, duration_s: 720, completed: true } }
-- { event_type: 'shloka_read', event_data: { text: 'gita', chapter: 2, verse: 47, bookmarked: true, time_spent_s: 45 } }
-- { event_type: 'app_open', event_data: { time: '05:12', day: 'monday', screen: 'home' } }
-- { event_type: 'streak_break', event_data: { last_active: '2026-04-08', days_missed: 2 } }
-- { event_type: 'vrata_observed', event_data: { vrata: 'ekadashi', fasted: true } }
```

### Computed practice profile (rebuilt nightly by cron)

```sql
CREATE TABLE user_practice (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  
  -- Practice rhythm
  preferred_time TEXT,          -- 'brahma_muhurta' | 'morning' | 'evening' | 'irregular'
  avg_session_duration_s INT,
  consistency_score FLOAT,     -- 0-1, based on last 30 days
  current_streak INT,
  longest_streak INT,
  
  -- Spiritual profile (inferred from behaviour)
  primary_path TEXT,           -- 'bhakti' | 'jnana' | 'karma' | 'dhyana'
  preferred_deity TEXT,        -- inferred from mantra choices
  tradition TEXT,              -- 'vaishnav' | 'shaiv' | 'shakta' | 'smarta' | 'general'
  
  -- Content preferences
  content_depth TEXT,          -- 'beginner' | 'intermediate' | 'advanced'
  language_pref TEXT[],        -- ['sanskrit', 'hindi', 'english']
  favorite_texts TEXT[],       -- ['gita', 'sunderkand', 'vishnu_sahasranama']
  
  -- Engagement patterns
  most_active_day TEXT,
  skip_pattern JSONB,          -- { common_skip_days: ['saturday'], skip_after_days: 5 }
  re_engagement_response TEXT, -- 'responds_to_gentle' | 'responds_to_challenge' | 'ignores'
  
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### How the profile is computed (Edge Function, runs nightly)

```typescript
// /supabase/functions/compute-practice-profile/index.ts

// 1. Query last 30 days of events for user
// 2. Calculate consistency: days_active / 30
// 3. Detect preferred time: mode of app_open times
// 4. Detect tradition: most used mantra deity mapping
// 5. Detect content depth: avg time on shlokas, commentary clicks
// 6. Detect skip pattern: day-of-week analysis of missed days
// 7. Detect re-engagement response: did they return after nudge messages?
// 8. Upsert into user_practice
```

---

## 4. Adaptive Personalisation (Layer B — Claude API)

### Daily personalised content generation

Every morning at 4 AM, a cron job calls Claude for each active user with their practice profile. Claude returns the day's personalised content package.

```typescript
// /supabase/functions/ai-personalise/index.ts

const prompt = `You are a Sanatani spiritual guide within the Sanatana Sangam app.

USER PRACTICE PROFILE:
- Name: ${profile.name}
- Tradition: ${profile.tradition} (${profile.preferred_deity})
- Path: ${profile.primary_path}
- Content depth: ${profile.content_depth}
- Current streak: ${profile.current_streak} days
- Consistency: ${(profile.consistency_score * 100).toFixed(0)}%
- Today's tithi: ${todayPanchang.tithi}
- Today's nakshatra: ${todayPanchang.nakshatra}
- Any special vrata today: ${todayPanchang.vrata || 'none'}
- Last shloka read: ${lastShloka.reference}
- Active sankalpa: ${activeSankalpa?.description || 'none'}

Generate a JSON response with:
1. "shloka" — next appropriate verse (considering their reading progress and today's tithi)
2. "shloka_context" — 2-3 sentence explanation relevant to their life stage and depth level
3. "practice_suggestion" — one specific practice for today based on panchang and their habits
4. "greeting" — personalised morning greeting incorporating today's significance
5. "nudge" — if streak is at risk, a motivational message matching their re-engagement style

Respond ONLY in valid JSON.`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  }),
});
```

### Adaptive streak recovery

When a user breaks their streak, the system doesn't send the same generic "come back!" message. It learns what works for this specific user.

```
User A broke streak 3 times:
  - Time 1: sent gentle message → returned next day ✓
  - Time 2: sent challenge message → didn't return ✗
  - Time 3: sent gentle message → returned next day ✓
  → Profile: responds_to_gentle

User B broke streak 2 times:
  - Time 1: sent gentle message → didn't return ✗
  - Time 2: sent challenge ("Your mandali is counting on you") → returned ✓
  → Profile: responds_to_challenge
```

Claude receives this pattern and generates the right tone for that user.

### Practice plan evolution

Weekly, Claude reviews the user's practice data and suggests progression:

```
Week 1-4: User consistently does 4 rounds of Gayatri japa
Week 5: Claude suggests → "You've been steady at 4 rounds. Consider adding
         a 5th round this week, or try chanting at a slower pace for deeper focus."

Week 1-8: User reads Gita Ch 2 slowly, bookmarks many verses about action
Week 9: Claude suggests → "You're drawn to karma yoga themes. After finishing
         Chapter 2, Chapter 3 (Karma Yoga) will resonate deeply. Also consider
         adding Ishopanishad to your study — it's short and directly addresses action."
```

---

## 5. Knowledge Engine (Layer C — pgvector)

### Scripture embedding pipeline

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE scripture_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_id TEXT NOT NULL,         -- 'gita', 'isha_upanishad', etc.
  chapter INT,
  verse INT,
  sanskrit TEXT,
  transliteration TEXT,
  translation TEXT,
  commentary TEXT,
  word_by_word JSONB,
  tags TEXT[],                   -- ['karma', 'dharma', 'action', 'detachment']
  embedding vector(1536),        -- or 1024 depending on model
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast similarity search
CREATE INDEX ON scripture_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
```

### How "Ask Scripture" works

```typescript
// /supabase/functions/ai-ask-scripture/index.ts

// 1. User asks: "What does Krishna say about dealing with anger?"
// 2. Generate embedding of the question
// 3. Semantic search across all scripture_chunks
// 4. Pass top 5 relevant verses + user's practice profile to Claude
// 5. Claude generates a contextual answer citing specific verses

const relevantVerses = await supabase.rpc('match_scriptures', {
  query_embedding: questionEmbedding,
  match_count: 5,
  match_threshold: 0.7,
});

const prompt = `You are a knowledgeable Sanatani scholar within Sanatana Sangam.

The user asked: "${userQuestion}"

Here are the most relevant verses from our scripture database:
${relevantVerses.map(v => `${v.text_id} ${v.chapter}.${v.verse}: ${v.translation}`).join('\n')}

The user's tradition: ${profile.tradition}
Their depth level: ${profile.content_depth}

Provide a thoughtful answer that:
1. Cites specific verses with references
2. Explains in language appropriate to their depth level
3. Connects to their tradition where relevant
4. Suggests a practical application`;
```

---

## 6. What to install — Technical setup checklist

### Already in your stack (no new installs)
- Next.js 14 (App Router) — frontend
- Supabase (Postgres, Auth, Edge Functions, Realtime, Cron) — backend
- Vercel — hosting
- TypeScript — language

### New additions needed

#### For AI intelligence layer
```bash
# Anthropic SDK for Claude API calls (in Edge Functions)
# No npm install needed — use fetch() directly in Deno Edge Functions
# Just set the API key:
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx

# For embeddings (choose one):
# Option A: Use Anthropic's Voyage embeddings
supabase secrets set VOYAGE_API_KEY=pa-xxxxx

# Option B: Use OpenAI embeddings (cheaper, well-tested with pgvector)
supabase secrets set OPENAI_API_KEY=sk-xxxxx
```

#### For pgvector (scripture search)
```sql
-- Run in Supabase SQL editor — pgvector is already available
CREATE EXTENSION IF NOT EXISTS vector;

-- Also enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### For push notifications
```bash
# OneSignal (free tier: 10K subscribers)
npm install @onesignal/node-onesignal
supabase secrets set ONESIGNAL_APP_ID=xxxxx
supabase secrets set ONESIGNAL_API_KEY=xxxxx

# Alternative: Firebase Cloud Messaging (free, unlimited)
npm install firebase-admin
```

#### For offline-first (local practice data)
```bash
# Dexie.js — IndexedDB wrapper for offline storage in PWA
npm install dexie dexie-react-hooks

# This stores japa sessions, reading progress, and streaks locally
# Syncs to Supabase when back online
```

#### For Capacitor wrapper (APK generation later)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Sanatana Sangam" "com.sangam.app"
npx cap add android

# For haptic feedback on japa beads
npm install @capacitor/haptics

# For push notifications in native wrapper
npm install @capacitor/push-notifications
```

#### For Hindu calendar calculations
```bash
# Option A: Use an astronomical calculation library
npm install astronomy-engine

# Option B: Pre-compute with a Python script and cache in Supabase
pip install ephem  # PyEphem for lunar calculations

# The panchang needs: tithi, nakshatra, yoga, karana, paksha, masa
# These require lunar position calculations based on user's location + timezone
```

#### For development workflow
```bash
# Supabase CLI (if not already installed)
brew install supabase/tap/supabase  # macOS
# or
npm install -g supabase

# Claude Code (for AI-assisted development)
npm install -g @anthropic-ai/claude-code

# Supabase agent skills for Claude Code
claude plugin marketplace add supabase/agent-skills
claude plugin install supabase@supabase-agent-skills
```

---

## 7. AI cost estimation

### Claude API costs (using Sonnet for personalisation)

| Task | Frequency | Input tokens | Output tokens | Cost/month |
|------|-----------|-------------|---------------|------------|
| Daily personalisation | 1x/user/day | ~800 | ~500 | $0.003/user |
| Weekly practice plan | 1x/user/week | ~1200 | ~800 | $0.002/user |
| Ask Scripture | ~5x/user/month | ~2000 | ~600 | $0.008/user |
| Streak nudges | ~3x/user/month | ~400 | ~200 | $0.001/user |
| **Total per user/month** | | | | **~$0.014** |

At 1,000 users: ~$14/month
At 10,000 users: ~$140/month
At 100,000 users: ~$1,400/month

This is extremely affordable. The key is caching — daily content is generated once per profile cluster, not per individual user, until scale requires it.

### Embedding costs (one-time)

| Text | Chunks | Embedding cost |
|------|--------|---------------|
| Bhagavad Gita (700 verses) | ~700 | $0.07 |
| 10 major Upanishads | ~500 | $0.05 |
| Vishnu Sahasranama + commentary | ~200 | $0.02 |
| Hanuman Chalisa + commentary | ~50 | $0.005 |
| Sunderkand | ~300 | $0.03 |
| Vrata kathas (50 stories) | ~500 | $0.05 |
| **Total one-time cost** | **~2,250** | **~$0.23** |

---

## 8. Build priority — What to build first

### Phase 1: Foundation (Weeks 1-3)
- [ ] Event tracking system (sadhana_events table + client SDK)
- [ ] Scripture content pipeline (ingest Gita Ch 1-3 with embeddings)
- [ ] Panchang calculation engine (tithi, nakshatra for user's location)
- [ ] Basic practice profile computation (cron job)
- [ ] Offline storage with Dexie.js (japa sessions, reading progress)

### Phase 2: Intelligence (Weeks 4-6)
- [ ] Claude Edge Function for daily personalised shloka
- [ ] Ask Scripture feature (pgvector search + Claude explanation)
- [ ] Adaptive streak messaging (gentle vs challenge based on user response)
- [ ] Push notification pipeline (morning reminder, vrata alerts)

### Phase 3: Community Intelligence (Weeks 7-9)
- [ ] Mandali group practice tracking
- [ ] Group sankalpa challenges with shared progress
- [ ] Practice leaderboards (mandali-level, not individual)
- [ ] Satsang event coordinator with reminders

### Phase 4: Deep Adaptation (Weeks 10-12)
- [ ] Weekly practice plan generation
- [ ] Tradition-specific content paths (Vaishnav vs Shaiv vs Shakta)
- [ ] Sanskar lifecycle guide with AI-assisted vidhi
- [ ] Spaced repetition for shloka memorisation
- [ ] Audio mantra playback with speed control

---

## 9. What makes this future-proof

### Extensible by design
- New texts added by embedding them — no code changes
- New features added as Edge Functions — independent deployment
- New traditions supported by expanding the profile taxonomy
- New languages added to the prompt template — Claude handles translation

### Self-improving
- Every user interaction feeds the behavioural model
- Claude's responses are rated by user engagement (did they act on the suggestion?)
- Low-performing recommendations get deprioritised automatically
- The system gets better at predicting what each user needs over time

### Ready for future AI capabilities
- When multimodal models improve: add image recognition of temple architecture
- When voice models mature: add guided mantra pronunciation correction
- When agents become standard: "Plan my Char Dham yatra" becomes a multi-step agent task
- When on-device AI arrives: move personalisation to the phone for zero-latency

---

## 10. What this is NOT

- Not a chatbot. The AI is invisible — users see personalised content, not a chat interface.
- Not a content farm. Every piece of scripture is authentic, sourced, and referenced.
- Not a replacement for a guru. The system guides practice, it doesn't interpret dharma.
- Not a data harvester. Practice data stays with the user. Mandali data is opt-in.

The engine is the invisible hand that makes Sangam feel alive — like the app knows you, grows with you, and cares about your practice. That's the difference between an app people use and an app people love.
