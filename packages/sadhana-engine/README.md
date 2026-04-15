# @sangam/sadhana-engine

Intelligent sadhana practice engine for Sanatana Sangam.

## What is this?

A standalone plugin that adds behavioural tracking, streak management, AI personalisation, and scripture search to the Sangam PWA. It runs independently and connects when you're ready.

## Status: Phase 3 Complete ✅

### Phase 1 — Core Foundation
- [x] Package structure + TypeScript types
- [x] Event tracker (offline-first with Dexie.js queue)
- [x] Streak tracker + daily sadhana table
- [x] SQL migrations (schema + pgvector + RLS)
- [x] Practice profile computation (`compute-profile` Edge Function)
- [x] Panchang calculator (J2000 astronomical — no DB dependency)
- [x] Scripture content seeding (700 Gita verses + Upanishads)
- [x] Local TF-IDF/LSA embeddings (384-dim, no HuggingFace API cost)

### Phase 2 — AI Intelligence
- [x] Semantic scripture search (`ai-ask-scripture` Edge Function)
- [x] AI personalisation (`ai-personalise` Edge Function + two-layer panchang)
- [x] Adaptive nudge engine (`ai-nudge` Edge Function + OneSignal push)
- [x] Mantra library (seeded + tradition/deity/level filters)
- [x] Device token management + OneSignal integration
- [x] Notification deduplication via `notification_key`

### Phase 3 — Community Intelligence
- [x] Migration 006: four SQL views over existing kul tables
- [x] `ai-kul-nudge` Edge Function (community accountability push)
- [x] `ai-kul-summary` Edge Function (weekly kul digest + bot post)
- [x] `ai-kul-task` Edge Function (guardian assigns AI practice task)
- [x] `KulIntelligence` client module (`src/community/kul-intelligence.ts`)

## Setup

```bash
# From your Sangam repo root
cd packages/sadhana-engine
npm install

# Run the SQL migration in Supabase SQL Editor
# Copy contents of supabase/migrations/001_phase1_schema.sql
```

## Usage (when integrating)

```typescript
import { createSadhanaEngine } from '@sangam/sadhana-engine';

const engine = createSadhanaEngine({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  aiProvider: 'gemini',
  enableOfflineQueue: true,
  enablePushNotifications: false,
  debug: true,
});

// Set current user after auth
engine.setUser(user.id);

// Track a japa session
await engine.tracker.trackJapaSession({
  mantra_id: 'gayatri',
  mantra_name: 'Gayatri Mantra',
  rounds_completed: 4,
  beads_count: 432,
  duration_seconds: 720,
  completed: true,
  started_at: new Date().toISOString(),
});

// Check streak
const streak = await engine.streaks.getCurrentStreak(user.id);

// Mark today's shloka as done
await engine.streaks.markDone(user.id, 'shloka');
```

## Phase 3 — Community Intelligence

```typescript
// ── Community accountability nudge ──
// Checks if kul mates practiced today; writes in-app notification + optional push
const nudge = await engine.kul.sendKulNudge(userId, { sendPush: true });
if (nudge.nudged) {
  console.log(nudge.message); // "3 members of Gita Sangha practiced (1,296 japa). Join them."
}

// ── Live kul pulse (who's practicing right now) ──
const activity = await engine.kul.getLiveActivity(kulId);
const active = activity.filter(m => m.practiced_today);
// → show "5 members practicing today"

// ── Daily kul header stats ──
const pulse = await engine.kul.getDailyKulPulse(kulId, userId);
// → { members_practiced: 3, total_members: 8, total_japa_today: 1296 }

// ── Weekly stats ──
const stats = await engine.kul.getWeeklyStats(kulId);
// → { total_japa_7d: 14040, active_members_7d: 6, top_streak: 21, ... }

// ── Weekly summary digest ──
// Generates Gemini post → kul_messages + member notifications
const summary = await engine.kul.getWeeklySummary(kulId, { sendPush: false });

// ── Guardian task flow ──
// Step 1: Guardian reviews suggestion before assigning
const preview = await engine.kul.suggestTask(guardianId, memberId, kulId);
console.log(preview.suggestion.title);          // "Chant 11 rounds of Mahamrityunjaya for 7 days"
console.log(preview.member_snapshot.streak);    // 14
console.log(preview.suggestion.guardian_note);  // "Your streak shows you're ready..."

// Step 2: Guardian confirms → create in DB + notify member
const result = await engine.kul.createTask(guardianId, memberId, kulId, {
  override: { due_days: 14 }, // optional override
});
if (result.created) {
  console.log(`Task created: ${result.task_id}`);
}

// ── Member completes a task ──
const ok = await engine.kul.completeTask(taskId, memberId);

// ── View pending tasks ──
const tasks = await engine.kul.getPendingTasks(kulId, memberId);
tasks.forEach(t => console.log(`${t.urgency}: ${t.title}`));

// ── View member profile ──
const profile = await engine.kul.getMemberProfile(kulId, memberId);
// → { tradition, primary_path, consistency_score, sessions_last_7d, ... }
```

## Architecture

See `sangam-intelligent-engine-blueprint.md` for the full technical design.

## Cost

£0. Uses Supabase free tier, Gemini Flash free API, local HuggingFace embeddings, and GitHub Education Pack credits.
