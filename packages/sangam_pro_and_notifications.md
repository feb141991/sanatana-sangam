# Sangam Pro & Notification System
## Design Document · April 2026

---

## Part 1 — Notification System Audit

### Infrastructure Stack

| Layer | What's There |
|---|---|
| Push delivery | **OneSignal** (free tier, web push) |
| In-app storage | **Supabase `notifications` table** |
| Realtime | Supabase Realtime → React Query invalidation via `useNotificationsRealtime` |
| Scheduling | **Vercel Crons** (defined in `vercel.json`) |
| Client SDK | `src/lib/onesignal.ts` — init, permission request, login, tag sync |
| Server SDK | `src/lib/onesignal-server.ts` — `sendOneSignalPush()`, batched by 1 000 |

---

### Active Cron Jobs

| Cron | Schedule (UTC) | Target Local Hour | Logic |
|---|---|---|---|
| `festival-reminder` | 3:30 AM + 9:00 AM daily | 9 AM | Fires 7 days and 1 day before any tradition-matching festival |
| `shloka-reminder` | 1:30 PM + 7:00 PM daily | 7 PM | Fires if user has NOT read today's shloka AND `wants_shloka_reminders = true` |
| `nitya-reminder` | 10:30 PM + 6:00 AM daily | 5 AM ±2 h | Fires if user has NOT started any steps today (0 rows in `nitya_karma_log`) |

All three crons respect:
- `notification_quiet_hours_start` / `notification_quiet_hours_end` per user
- User timezone (via `resolveTimeZone` + `canSendInLocalWindow`)
- `onConflict: 'user_id,notification_key'` deduplication so no double-sends

---

### Notification Types in DB

The `notifications.type` column accepts: `'festival' | 'mandali' | 'streak' | 'seva' | 'general'`

Each notification row has:
- `title`, `body`, `emoji`
- `action_url` — deep link opened on tap
- `notification_key` — dedup key (`festival:id:7:2026-04-19`, `streak:2026-04-19`, etc.)
- `local_date`, `sent_timezone`
- `read` boolean

---

### User Preferences (all in ProfileClient → `profiles` table)

| Preference | Where Used |
|---|---|
| `wants_festival_reminders` | Checked in festival-reminder cron ✅ |
| `wants_shloka_reminders` | Checked in shloka-reminder cron ✅ |
| `wants_community_notifications` | Synced as OneSignal tag only — **no cron checks it** ⚠️ |
| `wants_family_notifications` | Synced as OneSignal tag only — **no cron checks it** ⚠️ |
| `notification_quiet_hours_start/end` | Checked in all 3 crons ✅ |

---

### What Is Working ✅

1. **Festival reminders** — tradition-aware (Hindu/Sikh/Buddhist/Jain), 7-day and 1-day warnings, with dedup and push
2. **Shloka streak reminders** — streak-aware body copy ("Don't break your 12-day streak! 🔥"), opt-out respected
3. **Nitya Karma morning nudge** — tradition-personalised Brahma Muhurta / Amrit Vela / Morning Practice copy; skips users who've already started
4. **In-app bell** — reads from notifications table, live badge count via Supabase Realtime
5. **Mark read** — individual and bulk, with optimistic UI
6. **Test notification** — `/api/notifications/test` endpoint wired in ProfileClient
7. **Quiet hours** — per-user time window blocks all sends
8. **OneSignal user login** — `loginToOneSignal(userId)` called on auth, syncs `external_id`

---

### Bugs & Gaps 🔴

#### Critical

**1. `'nitya'` type not in DB enum**
The nitya-reminder cron inserts `type: 'nitya'` but the DB column only accepts `'festival' | 'mandali' | 'streak' | 'seva' | 'general'`. Every nitya notification insert will fail at the DB level with a check-constraint error.

**Fix:** Add `'nitya'` to the DB enum:
```sql
ALTER TYPE notification_type ADD VALUE 'nitya';
-- or if it's a check constraint:
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('festival','mandali','streak','seva','general','nitya'));
```
And update `database.ts` type accordingly.

---

#### Missing Notification Triggers

**2. No `wants_nitya_reminders` preference**
The nitya cron fires for ALL users regardless of whether they want it. Add a `wants_nitya_reminders` column to `profiles` (default `true`) and check it in the cron, just like shloka does.

**3. `wants_community_notifications` / `wants_family_notifications` have no cron**
These prefs are saved and synced to OneSignal tags but never checked server-side. Either:
- Wire them into a Kul/Mandali activity cron (e.g., "3 new family events this week"), or
- Remove the toggles from ProfileClient until the crons exist, to avoid confusing users

**4. No Japa milestone notifications**
When a user completes a mala (108 beads) or hits a Japa milestone (e.g., 1 000 total chants), nothing fires. This is high-value engagement — a completion toast exists client-side but nothing is persisted or pushed.

**5. No streak milestone notifications**
No push fires on a 7-day, 21-day, or 30-day shloka/nitya streak. These are strong re-engagement moments.

**6. No seva score milestone notifications**
Reaching 100, 500, 1 000 seva points could trigger a "Your seva is growing" in-app notification. Currently nothing fires.

**7. No Kul/Mandali event reminders**
`type: 'mandali'` exists in the DB schema but there is no cron that sends it. Family event reminders ("Dadi's birthday tomorrow") are a core KUL use case and are unimplemented.

---

#### Operational Gaps

**8. No retry / failure logging**
If `sendOneSignalPush` fails for a batch, the error is logged to console but the affected user IDs are not queued for retry.

**9. No unsubscribe/resubscribe flow**
When a user revokes browser notification permission, the app has no recovery flow to prompt them to re-enable later.

**10. Nitya-reminder doesn't filter on `wants_nitya_reminders`** *(same as point 2 above)*

---

### Recommended Next Crons to Add

| Cron | Trigger | Type | Priority |
|---|---|---|---|
| `japa-milestone` | On mala completion (108/1 000/10 000) | `seva` | High |
| `streak-milestone` | 7/21/30-day shloka or nitya streak | `streak` | High |
| `kul-event-reminder` | 1 day before a saved Kul event | `mandali` | High |
| `seva-milestone` | 100/500/1 000 seva score | `seva` | Medium |
| `weekly-digest` | Sunday 9 AM — week summary | `general` | Medium (Pro) |

---

---

## Part 2 — Sangam Pro Feature Design

### Current State

The only Pro gate in the codebase is in `NityaKarmaClient`:
- `isPro` prop passed from `page.tsx`
- Currently faked: `const isPro = seva_score >= 500` (placeholder, no real billing)
- What it gates: the 30-day sadhana heatmap (blurred for free users)
- `ProUpgradeSheet` exists as a bottom sheet with a feature list — but no payment flow, no subscription check, no Stripe/Razorpay

The `ProUpgradeSheet` already lists these aspirational features:
- 30-day streak analytics & heatmap
- AI-personalised morning sequences
- Extended sacred audio library
- Personalized panchang insights
- Kul AI family advisor
- Advanced Japa analytics
- Custom nitya karma sequences
- Priority notifications & reminders

---

### Proposed Pro Tier Design

#### Pricing
| Plan | Price | Billing |
|---|---|---|
| **Free** | ₹0 / $0 | — |
| **Sangam Pro** | ₹299/month or ₹2 499/year | Razorpay (India-first) + Stripe (international) |
| **Kul Pro** | ₹499/month or ₹3 999/year | Family plan, up to 6 members |

*Annual saves ~30%. Kul Pro unlocks all family collaboration features.*

---

### Free vs Pro Feature Matrix

#### Nitya Karma

| Feature | Free | Pro |
|---|---|---|
| All core steps (snana, sandhya, etc.) | ✅ Full | ✅ Full |
| Step completion tracking | ✅ Today only | ✅ Full history |
| 30-day sadhana heatmap | 🔒 Blurred | ✅ |
| Streak analytics & best streak | ❌ | ✅ |
| AI-generated morning sequence | ❌ | ✅ Personalised by tradition, season, tithi |
| Custom step ordering | ❌ | ✅ |
| Export sadhana log (PDF/CSV) | ❌ | ✅ |
| Morning reminder (tradition-aware) | ✅ Basic | ✅ + custom time |

#### Japa

| Feature | Free | Pro |
|---|---|---|
| All 4 bead types | ✅ | ✅ |
| Mala counter (unlimited) | ✅ | ✅ |
| Focus mode | ✅ | ✅ |
| Session history (last 7 days) | ✅ | — |
| Full session history + analytics | ❌ | ✅ |
| Weekly/monthly chant totals | ❌ | ✅ |
| Milestone celebrations (1 000/10 000 chants) | ❌ | ✅ |
| Custom mantra targets | ❌ | ✅ |
| Milestone push notifications | ❌ | ✅ |

#### Bhakti / Zen

| Feature | Free | Pro |
|---|---|---|
| All sanctuary backgrounds | ✅ 3 | ✅ All (6+) |
| Ambient sounds | ✅ 2 (Bowl, Om) | ✅ All (Rain, River, Forest, etc.) |
| Timer presets | ✅ 12/24/48 min + custom | ✅ Same + saved presets |
| Session history | ❌ | ✅ |
| Mood tagging after session | ❌ | ✅ |
| Themed soundscapes (Vrindavan, Kashi, Himalaya) | ❌ | ✅ |

#### Panchang

| Feature | Free | Pro |
|---|---|---|
| Daily tithi, nakshatra, yoga | ✅ | ✅ |
| Sunrise/sunset, muhurta | ✅ | ✅ |
| Rahu Kalam, Gulika | ✅ | ✅ |
| Festival calendar | ✅ | ✅ |
| Personalised muhurta recommendations | ❌ | ✅ ("Best time for travel today") |
| Custom location panchang | ✅ 1 location | ✅ Multiple locations |
| Panchang calendar export | ❌ | ✅ |
| Vrat (fasting) personalisation | ❌ | ✅ |

#### Kul (Family)

| Feature | Free | Pro |
|---|---|---|
| Create/join a Kul | ✅ | ✅ |
| Up to 10 family members | ✅ | ✅ |
| Family chat | ✅ | ✅ |
| Family events & calendar | ✅ 3 upcoming | ✅ Unlimited |
| Vansh tree (family tree) | ✅ 2 generations | ✅ Full tree |
| Family event reminders (push) | ❌ | ✅ |
| Kul AI advisor ("What puja for grandfather's anniversary?") | ❌ | ✅ |
| Memory vault (photos, recordings) | ❌ | ✅ |

#### Notifications

| Feature | Free | Pro |
|---|---|---|
| Festival reminders | ✅ | ✅ |
| Daily shloka reminder | ✅ | ✅ |
| Nitya Karma morning reminder | ✅ Basic | ✅ Custom time + snooze |
| Streak milestone alerts | ❌ | ✅ |
| Japa milestone alerts | ❌ | ✅ |
| Weekly sadhana digest (Sunday) | ❌ | ✅ |
| Kul event reminders | ❌ | ✅ |
| Custom quiet hours | ✅ | ✅ |

#### Seva / Profile

| Feature | Free | Pro |
|---|---|---|
| Seva score | ✅ | ✅ |
| Profile badge | — | ✅ Gold "Pro" badge |
| Seva score leaderboard (community) | ❌ | ✅ |
| Early access to new features | ❌ | ✅ |

---

### Implementation Roadmap

#### Phase 1 — Billing Foundation (no UI changes yet)
1. Add `subscription_status` column to `profiles` (`'free' | 'pro' | 'kul_pro'`)
2. Add `subscription_expires_at` timestamp
3. Wire Razorpay webhook → Supabase function to update status
4. Replace `seva_score >= 500` fake gate with real `subscription_status = 'pro'` check
5. Pass `isPro` correctly from all page.tsx server components

#### Phase 2 — Gate existing content
1. Heatmap blur (already done in Nitya) ✅
2. Zen sanctuary count — gate extras behind Pro check
3. Japa session history — show 7-day free, full history Pro
4. Kul family tree depth — gate beyond 2 generations
5. Add `ProUpgradeSheet` component to shared `/components/` (not just Nitya)

#### Phase 3 — Build Pro-only features
1. AI-personalised morning sequence (calls existing `/api/ai/chat` route)
2. Japa analytics screen
3. Weekly digest cron + notification
4. Streak milestone notifications
5. Kul event reminders cron
6. Zen session history + mood tagging

#### Phase 4 — Upgrade/Billing UI
1. Upgrade flow: `ProUpgradeSheet` → Razorpay checkout → success screen
2. Subscription management in ProfileClient (cancel, renew, status)
3. Pro badge in TopBar/Profile

---

### DB Changes Required

```sql
-- 1. Fix notification type enum
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('festival','mandali','streak','seva','general','nitya'));

-- 2. Subscription fields on profiles
ALTER TABLE profiles ADD COLUMN subscription_status TEXT
  NOT NULL DEFAULT 'free'
  CHECK (subscription_status IN ('free','pro','kul_pro'));
ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN razorpay_subscription_id TEXT;

-- 3. Nitya reminder opt-out preference
ALTER TABLE profiles ADD COLUMN wants_nitya_reminders BOOLEAN NOT NULL DEFAULT TRUE;

-- 4. Kul event reminders preference
ALTER TABLE profiles ADD COLUMN wants_kul_reminders BOOLEAN NOT NULL DEFAULT TRUE;

-- 5. Japa session log (for analytics)
CREATE TABLE japa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bead_type TEXT NOT NULL,
  mantra TEXT,
  total_count INTEGER NOT NULL DEFAULT 0,
  malas_completed INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON japa_sessions (user_id, completed_at DESC);

-- 6. Zen session log
CREATE TABLE zen_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sanctuary TEXT,
  ambient TEXT,
  duration_minutes INTEGER NOT NULL,
  mood_after TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON zen_sessions (user_id, completed_at DESC);
```

---

### ProUpgradeSheet — Copy & Structure

The current sheet in NityaKarmaClient should be extracted to a shared component at `src/components/ProUpgradeSheet.tsx`. It should accept a `context` prop so it can show context-relevant lead features:

```tsx
<ProUpgradeSheet
  context="nitya"   // shows "30-day heatmap" as hero feature
  onClose={...}
/>
<ProUpgradeSheet
  context="japa"    // shows "Japa analytics" as hero feature
  onClose={...}
/>
<ProUpgradeSheet
  context="zen"     // shows "Premium sanctuaries" as hero feature
  onClose={...}
/>
```

Upgrade CTA copy:
- Hindi: "Sadhana ko poorna karo" (Make your practice complete)
- English: "Deepen your practice"
- Tagline: "Everything you need for a complete daily sadhana"

---

### Summary: Top 5 Immediate Actions

1. **Fix the `'nitya'` DB enum bug** — every nitya notification is currently failing silently at the DB level
2. **Add `wants_nitya_reminders` preference** — users can't currently opt out of morning nudges
3. **Add `subscription_status` to profiles** — replace the `seva_score >= 500` fake gate
4. **Extract `ProUpgradeSheet` to a shared component** — currently only in Nitya, needed in Japa, Zen, Panchang
5. **Build Kul event reminder cron** — the `mandali` notification type has been in the DB schema from day one but nothing sends it
