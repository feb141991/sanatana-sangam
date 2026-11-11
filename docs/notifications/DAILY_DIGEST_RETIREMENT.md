# Daily digest: retired

**Status (2026-11-10): the code change is COMMITTED ON A BRANCH, NOT DEPLOYED. Two production data changes WERE made, with the
founder's approval (section 3).** Until the code is deployed the cron still runs: see section 4 for the stopgap.

## 1. What it was

A daily cron (`/api/digest/generate`, 23:00 UTC) asked the Sarvam AI for a "dharmic digest" for every distinct tradition, level,
date and tithi, stored the text (`daily_digest_variants`, and `recommendations` of type `daily_digest` per account), and queued a
push, "Dharmic Digest · <tithi>", for 11:00 local time to **every profile it found**, with no preference check and no Settings
switch. A second route, `/api/digest/today`, generated and cached the same text on demand for a website card that nothing imports.

## 2. Why it was retired (founder decision 2026-11-08)

- **Volume.** It was the largest single sender of counted pushes: 331 queued in 30 days to all 32 accounts, 132 sent in the last 14
  days. It had no off switch, which the product's own rule for reminders (a category the person chose) does not allow.
- **Content integrity (AGENTS section 3).** All 142 variants written in the 30 days before retirement were AI-generated (none used the
  fallback), and each asked the model for a "surprising fact" about a deity or tithi. No council reviewed any of it, and none carried a
  source. The fallback text hard-coded further unsourced scripture claims. Unsupported content "must remain withheld".
- **Cost.** One AI batch a day for a message that could not be turned off or checked.

## 3. What was done

Code (branch `notif-retire-digest`, not deployed):
- the cron is removed from `vercel.json`, and from the admin cron catalogue (otherwise the admin view reports a missed run);
- `src/app/api/digest/` (both routes), `src/lib/digest-variant.ts` and its test are deleted;
- `RETIRED_NOTIFICATION_TYPES` in `notification-delivery-policy.ts` makes the dispatcher skip any `daily_digest` row still in the queue
  with the reason `notification_type_retired` (after the existing account-deletion check), so retirement does not depend on the queue being empty;
- a guard test fails if a digest cron, route, catalogue entry or any source naming `daily_digest` comes back.

Production data, 2026-11-10, approved in chat:
- **Purged** 713 `recommendations` rows of type `daily_digest` (32 accounts) and all 362 `daily_digest_variants` rows. 251 other
  `recommendations` rows were left untouched. Nothing referenced either table by a foreign key. This cannot be undone.
- **Cancelled** the 3 pending `daily_digest` schedule rows (3 accounts, due 10:00-11:00 UTC that day), before they were due.
  Already-sent and already-skipped rows are history and were not touched.

## 4. What is still open

- **The cron runs until this is deployed.** If the change is not live before 23:00 UTC, the cron regenerates one day of digest text and
  queues tomorrow's pushes. Stopgap that needs no deploy of code: set `NOTIFICATIONS_DISABLE_TYPES=digest` in the production environment
  and redeploy; the route then returns before it calls the AI or queues anything. After the real deploy, re-run the purge once:
  `delete from public.recommendations where type = 'daily_digest'; delete from public.daily_digest_variants;`
  (check the counts first; it removes whatever the cron wrote in the meantime).
- **Kept on purpose, no destructive change:** the `daily_digest_variants` table itself and the generic content-generation job tables.
  Dropping them is a separate migration decision.
- `src/components/home/DailyDigestCard.tsx` is dead code (nothing imports it; it called the removed `/today` route). It is part of the
  retired website frontend, so it was left alone (AGENTS section 1); delete it if you want it gone.
- `docs/PRIVACY_SECURITY_BASELINE.json` still lists the two routes: regenerate it with `npm run baseline:privacy` after merging.
  `NOTIFICATION_ARCHITECTURE_AUDIT.md` and `CADENCE_ROLLOUT_AUDIT.md` are dated records and still mention the digest.
- The cadence rule (`ENGAGEMENT_CADENCE_POLICY.md`) counts `daily_digest` as one of the "other" nudges; nothing queues it any more.

## 5. Bringing a digest back

Not without reviewed content and a preference. A returning digest needs: text from sourced, council-reviewed material (not generated
facts); its own Settings switch, off by default and shown in onboarding; removal from `RETIRED_NOTIFICATION_TYPES`; and the guard test
updated deliberately, with the reason.
