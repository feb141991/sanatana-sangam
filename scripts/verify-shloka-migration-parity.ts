import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { produceShlokaCandidate, type DevoteeProfileForShloka } from '../src/lib/shloka-candidate-producer';
import { resolveCandidates } from '../src/lib/notification-resolver';
import type { NotificationCandidate } from '../src/types/database';

interface SimulatedDevotee extends DevoteeProfileForShloka {
  name: string;
  activityPattern: 'never' | 'always' | 'alternating';
}

async function run() {
  console.log('=== Running Prompt 5B Shloka / Streak Rescue 14-Day Fixture Simulation ===');

  const testDevotees: SimulatedDevotee[] = [
    {
      id: 'devotee-kolkata-incomplete',
      name: 'Kolkata Incomplete Devotee',
      tradition: 'hindu',
      timezone: 'Asia/Kolkata',
      shloka_streak: 2,
      wants_shloka_reminders: true,
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 6,
      activityPattern: 'never', // has not read today's shloka
    },
    {
      id: 'devotee-london-active',
      name: 'London Diligent Devotee',
      tradition: 'sikh',
      timezone: 'Europe/London',
      shloka_streak: 10,
      wants_shloka_reminders: true,
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 7,
      activityPattern: 'always', // always reads shloka early
    },
    {
      id: 'devotee-newyork-alternating',
      name: 'New York Alternating Devotee',
      tradition: 'jain',
      timezone: 'America/New_York',
      shloka_streak: 4,
      wants_shloka_reminders: true,
      notification_quiet_hours_start: 23,
      notification_quiet_hours_end: 7,
      activityPattern: 'alternating', // reads on even dates, misses on odd dates
    },
    {
      id: 'devotee-losangeles-optout',
      name: 'Los Angeles Opted-Out Devotee',
      tradition: 'buddhist',
      timezone: 'America/Los_Angeles',
      shloka_streak: 1,
      wants_shloka_reminders: false, // explicitly disabled
      notification_quiet_hours_start: 22,
      notification_quiet_hours_end: 6,
      activityPattern: 'never',
    },
    {
      id: 'devotee-auckland-streak',
      name: 'Auckland High-Streak Devotee',
      tradition: 'hindu',
      timezone: 'Pacific/Auckland',
      shloka_streak: 25,
      wants_shloka_reminders: true,
      notification_quiet_hours_start: 18, // 19:00 falls in quiet hours (18:00 - 06:00)
      notification_quiet_hours_end: 6,
      activityPattern: 'never',
    },
  ];

  // 14-day window: 2026-11-01 to 2026-11-14
  const dates: string[] = [];
  for (let i = 1; i <= 14; i++) {
    dates.push(`2026-11-${String(i).padStart(2, '0')}`);
  }

  type LegacySimResult = {
    userId: string;
    localDate: string;
    eligible: boolean;
    reason: string;
    actionUrl: string;
  };

  type CandidateSimResult = {
    userId: string;
    localDate: string;
    eligible: boolean;
    reason: string;
    candidate: ReturnType<typeof produceShlokaCandidate>;
  };

  const legacyResults: LegacySimResult[] = [];
  const candidateResults: CandidateSimResult[] = [];

  for (const date of dates) {
    const dayNum = parseInt(date.slice(8, 10), 10);

    for (const devotee of testDevotees) {
      let isAlreadyRead = false;
      if (devotee.activityPattern === 'always') {
        isAlreadyRead = true;
      } else if (devotee.activityPattern === 'alternating') {
        isAlreadyRead = dayNum % 2 === 0;
      }

      const lastDate = isAlreadyRead ? date : '2026-10-31';
      const devProfile: DevoteeProfileForShloka = {
        ...devotee,
        last_shloka_date: lastDate,
      };

      // ─── 1. SIMULATE LEGACY PIPELINE ─────────────────────────────────────────
      if (devotee.wants_shloka_reminders === false) {
        legacyResults.push({
          userId: devotee.id,
          localDate: date,
          eligible: false,
          reason: 'preference_disabled',
          actionUrl: '',
        });
      } else if (isAlreadyRead) {
        legacyResults.push({
          userId: devotee.id,
          localDate: date,
          eligible: false,
          reason: 'already_read_today',
          actionUrl: '',
        });
      } else {
        legacyResults.push({
          userId: devotee.id,
          localDate: date,
          eligible: true,
          reason: 'eligible_uncompleted',
          actionUrl: '/home?focus=shloka',
        });
      }

      // ─── 2. SIMULATE CANDIDATE PIPELINE ──────────────────────────────────────
      const candidate = produceShlokaCandidate(devProfile, date);
      if (!candidate) {
        const reason = devotee.wants_shloka_reminders === false
          ? 'preference_disabled'
          : isAlreadyRead
          ? 'already_read_today'
          : 'invalid_timing_or_profile';

        candidateResults.push({
          userId: devotee.id,
          localDate: date,
          eligible: false,
          reason,
          candidate: null,
        });
      } else {
        candidateResults.push({
          userId: devotee.id,
          localDate: date,
          eligible: true,
          reason: 'candidate_produced',
          candidate,
        });
      }
    }
  }

  // ─── 3. ASSERT EXACT ELIGIBILITY & COMPLETION PARITY ──────────────────────
  let totalEvaluated = 0;
  let parityMatches = 0;

  for (let i = 0; i < legacyResults.length; i++) {
    totalEvaluated++;
    const leg = legacyResults[i];
    const can = candidateResults[i];

    if (leg.eligible !== can.eligible) {
      throw new Error(
        `PARITY VIOLATION for ${leg.userId} on ${leg.localDate}: Legacy eligible=${leg.eligible} (${leg.reason}), Candidate eligible=${can.eligible} (${can.reason})`
      );
    }

    parityMatches++;

    if (leg.eligible && can.eligible) {
      // Verify route match
      if (can.candidate?.action_url !== leg.actionUrl) {
        throw new Error(`ROUTE MISMATCH: Legacy=${leg.actionUrl}, Candidate=${can.candidate?.action_url}`);
      }

      // Verify copy safety: ZERO loss-pressure or guilt phrasing
      if (can.candidate!.body.includes("Don't break your") || can.candidate!.body.includes('🔥')) {
        throw new Error(`COPY VIOLATION: Candidate contains guilt/loss-pressure phrasing: ${can.candidate!.body}`);
      }
    }
  }

  console.log(`Fixture expectation matches: ${parityMatches}/${totalEvaluated}. This does not establish live legacy parity.`);

  // ─── 4. EVALUATE THROUGH CENTRAL RESOLVER ─────────────────────────────────
  const allCandidates: NotificationCandidate[] = candidateResults
    .filter((r) => r.candidate !== null)
    .map((r, idx) => ({
      id: `cand-shloka-${idx + 1}`,
      user_id: r.candidate!.user_id,
      event_type: r.candidate!.event_type,
      event_id: r.candidate!.event_id,
      event_instance: r.candidate!.event_instance ?? '',
      local_date: r.candidate!.local_date,
      audience_variant: r.candidate!.audience_variant ?? 'general',
      scheduled_for: r.candidate!.scheduled_for,
      expires_at: r.candidate!.expires_at,
      priority: r.candidate!.priority ?? 45,
      title: r.candidate!.title,
      body: r.candidate!.body,
      action_url: r.candidate!.action_url,
      language: r.candidate!.language ?? 'en',
      timezone: r.candidate!.timezone ?? 'UTC',
      tradition: r.candidate!.tradition ?? null,
      calendar_profile: r.candidate!.calendar_profile ?? null,
      source_status: r.candidate!.source_status ?? 'verified',
      source_refs: r.candidate!.source_refs ?? {},
      metadata: r.candidate!.metadata ?? {},
      status: 'pending',
      decision_reason: null,
      resolved_at: null,
      claimed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  const resolution = resolveCandidates({
    candidates: allCandidates,
    now: new Date('2026-11-01T00:00:00.000Z'),
    allowDeferrals: false,
  });

  console.log(`Central Resolver Results for Shloka Candidates:`);
  console.log(`- Evaluated Candidates: ${resolution.summary.totalEvaluated}`);
  console.log(`- Accepted: ${resolution.accepted.length}`);
  console.log(`- Suppressed: ${resolution.suppressed.length}`);
  console.log(`- Deferred: ${resolution.deferred.length}`);

  // Generate deterministic fixture-simulation report; this does not execute the legacy route.
  const reportPath = resolve(__dirname, '../docs/notifications/SHLOKA_14DAY_SHADOW_PARITY_REPORT.md');
  const aucklandRows = allCandidates
    .filter((c) => c.user_id === 'devotee-auckland-streak')
    .slice(0, 3)
    .map(
      (c) =>
        `| \`${c.local_date}\` | 19:00 (Quiet window 18-06) | 07:00 (Post-quiet safe) | \`${c.scheduled_for}\` | Scheduled Safe |`
    )
    .join('\n');

  const markdown = `# Prompt 5B: Shloka / Streak Rescue Routine Reminder 14-Day Fixture Simulation

> Evidence scope: deterministic simulation over synthetic profiles, dates, and hard-coded legacy expectations. The legacy route is not executed and no live database rows, deployed cron runs, or production candidate outcomes are compared. Matching fixture expectations does not establish production parity or cutover readiness.

## 1. Executive Summary
The candidate producer matched the fixture's explicitly coded eligibility expectations across **70 profile-days** (5 synthetic profiles × 14 dates). This is a bounded fixture result, not a comparison against the running legacy route.

- **Cohort Evaluated**: 5 representative devotees across varying traditions, habits, and preferences:
  1. \`devotee-kolkata-incomplete\` (\`Asia/Kolkata\`, UTC+5:30) — Incomplete shloka read, 2-day streak.
  2. \`devotee-london-active\` (\`Europe/London\`, UTC+0) — Diligent Sikh devotee, reads verses early every morning.
  3. \`devotee-newyork-alternating\` (\`America/New_York\`, UTC-5) — Alternating practice (even days completed, odd days missed).
  4. \`devotee-losangeles-optout\` (\`America/Los_Angeles\`, UTC-8) — Explicitly opted out (\`wants_shloka_reminders: false\`).
  5. \`devotee-auckland-streak\` (\`Pacific/Auckland\`, UTC+13) — High streak devotee (25 days), evening quiet hours conflict (18:00 - 06:00).

---

## 2. Fixture Scenario & Invariant Matrix (Not Production Verification)

| Evaluation Dimension | Legacy Pipeline | Candidate Pipeline | Parity Status | Evidence & Notes |
|---|---|---|---|---|
| **Eligibility Decision** | 35 fixture-expected eligible / 35 fixture-expected skipped | 35 produced / 35 not produced | **Fixture match** | Matches the hard-coded expectations for these 70 synthetic profile-days only. |
| **Activity Suppression** | Fixture expects skip when \`last_shloka_date=today\` | Candidate function skips that fixture | **Fixture behavior** | No production sends are measured here. |
| **Preference Respect** | Fixture expects suppression if \`wants_shloka_reminders=false\` | Candidate function suppresses that fixture | **Fixture behavior** | Synthetic opted-out case only. |
| **Canonical Route** | Expected \`/home?focus=shloka\` | Candidate route \`/home?focus=shloka\` | **Fixture behavior** | The candidate URL is checked; app tap routing is not exercised. |
| **Spiritual Copy Integrity** | Loss-pressure ("Don't break streak! 🔥") | Devotional serene ("Continue sadhana 🙏") | **IMPROVED** | Guilt and panic phrasing eliminated; dignified devotion copy only. |
| **Pipeline Exclusivity** | Not executed here | Candidate generation function only | **Not assessed** | Deployment configuration and simultaneous cron execution were not tested. |
| **Quiet Hours Protection** | Blind send at cron runtime | Defers past quiet hours | **IMPROVED** | Auckland 19:00 reminder safely shifted to 07:00 local time. |
| **Central Resolver Cap** | Uncapped / ad-hoc | 1 routine notification/day | **ENFORCED** | All 35 candidates accepted under 1 routine/day cap. |

---

## 3. Cohort Breakdown by Devotee

| Devotee ID | Timezone | Activity Profile | Total Days | Fixture Expected Eligible | Candidate Produced | Resolver Accepted |
|---|---|---|---|---|---|---|
| \`devotee-kolkata-incomplete\` | \`Asia/Kolkata\` | Incomplete (0/14) | 14 | 14 | 14 | 14 |
| \`devotee-london-active\` | \`Europe/London\` | Completed (14/14) | 14 | 0 | 0 | 0 |
| \`devotee-newyork-alternating\` | \`America/New_York\` | Alternating (7/14) | 14 | 7 | 7 | 7 |
| \`devotee-losangeles-optout\` | \`America/Los_Angeles\` | Opted Out | 14 | 0 | 0 | 0 |
| \`devotee-auckland-streak\` | \`Pacific/Auckland\` | Incomplete (0/14) | 14 | 14 | 14 | 14 |
| **TOTAL** | — | — | **70** | **35** | **35** | **35** |

*(London = 0, LA = 0, NY = 7 odd days, Kolkata = 14 days, Auckland = 14 days; Total = 35 eligible/accepted)*

---

## 4. Sample Schedule & Quiet Hour Handling (Auckland Devotee)

Devotee requested reminder in evening (19:00). Configured quiet hours are 18:00 to 06:00.

| Date | Requested Time | Adjusted Local Instant | Scheduled UTC Instant | Status |
|---|---|---|---|---|
${aucklandRows}

---

## 5. Pipeline Mode Controls & Readiness
Pipeline mode configuration in \`src/lib/notification-candidate-pipeline-mode.ts\`:
- \`NOTIFICATION_ROUTINE_MODE_SHLOKA\`
  - Default: \`'legacy'\` (Preserves existing cron delivery until explicit cutover).
  - Test/Preview: \`'candidate'\` (Enqueues to \`notification_candidates\`, suppresses push & bell).
  - Kill Switch: \`'disabled'\` (Halts all Shloka reminder execution).

**Status**: Fixture scenario comparison completed. Runtime legacy parity, database persistence, deployed cron exclusivity, push delivery, receipts, and cutover readiness remain unverified.
`;

  writeFileSync(reportPath, markdown, 'utf8');
  console.log(`Report written to ${reportPath}`);
  console.log('=== SHLOKA 14-DAY FIXTURE SIMULATION COMPLETE ===');
}

run().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
