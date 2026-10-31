# Shoonaya Agent Instructions

This file is for Codex and other coding agents.

Before changing files, follow `SHOONAYA_WORKFLOW.md` and `SHOONAYA_RULES.md`.


## Shoonaya Project Standards

### 1. Two-Repository Contract Ownership
- Treat `Sanatan Sangam/Shoonaya` as the backend/PWA repository and
  `shoonaya-mobile` as the Native repository.
- Any shared route, DTO, auth, content, notification, profile, or calendar
  change must be audited in both repositories.
- State explicitly which repository owns the canonical contract.
- Never maintain manually edited duplicate catalogues when a generated,
  versioned snapshot can provide Native offline support.

### 2. Calendar Governance
- Never derive an observance date in UI code when canonical,
  profile-qualified occurrence data exists.
- Never change `masaName`, evaluator flags, materialisation flags, council
  decisions, locked rows, or manual overrides outside an explicitly scoped
  calendar task.
- Never publish, notify, award karma, or present a final date for unresolved,
  disputed, fallback, unaudited, unverified, or withheld occurrences.
- Distinguish astronomical instant, local civil date, spiritual date,
  calendar profile, sampradaya, location and timezone.
- Calendar migrations must be tested against a shadow/Supabase branch before
  production.
- Apply committed, file-backed migrations with `supabase db push --linked`
  only after the shadow check and production preflight. Do not apply the SQL
  file through a migration API that assigns its own timestamp: that creates a
  remote history version different from the filename and can make a later
  `db push` replay a guarded data migration. After every application, run
  `supabase migration list --linked` and
  `node scripts/assert-supabase-migration-version.mjs <version>`; confirm the
  newly applied version matches locally and remotely, and review other
  one-sided entries before any `db push`. If an authorized direct application already registered another
  version, first verify the exact SQL and data result, then align the local
  filename to the recorded remote version and update all references; never
  blindly repair or delete migration history.

### 3. Spiritual Content Integrity
- Never fabricate scripture, mantra, quotation, translation, ritual rule,
  source, page number, source tier, rights status or council approval.
- Separate verbatim public-domain text, licensed text, sourced translation
  and Shoonaya-curated explanation.
- Unsupported content must remain withheld or explicitly labelled, never
  filled with generic prose.
- Tradition-specific claims must carry applicable tradition, sampradaya,
  region and source metadata.

### 4. Database and Auth Safety
- Derive user identity server-side; never trust a request-body user ID.
- Shared Native/PWA routes must explicitly support Bearer and cookie auth
  through the established helper.
- Private writes must be atomic, idempotent and protected by database
  constraints, not only application checks.
- Every migration requires RLS review, privilege review, rollback guidance,
  generated type updates and applied/unapplied environment reporting.
- Never expose service-role credentials or production secrets.
- Don’t run `supabase db push`. It would push every unapplied migration, and production already has history drift. Apply migrations individually or through reviewed target scripts only when explicitly approved.
- Private Native API responses must stay `private, no-store`. For backend
  dependency failures, log an allowlisted operation stage, provider error code,
  duration and middleware request ID; never log raw provider messages, tokens,
  user content or user IDs. Return a stable retryable error code and preserve
  the request ID so it can be matched to the Native API-diagnostic record.

### 5. Cache and Identity Isolation
- Every persisted client cache must define its key dimensions: user, guest,
  profile, tradition, timezone/location, language and content version.
- Clear private caches on sign-out or account switch.
- Never display one user's cached profile-qualified data to another user.
- Offline data must disclose when timing/date information may be stale.

### 6. Notification Delivery
- Trace notification creation through eligibility, canonical occurrence,
  user preference, OS permission, local timezone, quiet hours, dedupe,
  database insertion, provider send, receipt checking and tap routing.
- Distinguish in-app notification creation from OS push delivery.
- Never claim delivery from token registration or a successful provider
  ticket alone.
- D-7, D-1 and D0 keys must not overlap with legacy tithi or OneSignal keys.
- Real-device evidence is required before calling Android/iOS push
  release-ready.
- A reminder-preference column must distinguish "never asked" from "asked
  and declined." A migration that changes a column's default may only
  backfill rows that are `NULL`. It must never touch a row already holding
  an explicit `false` — that value is a user's own prior choice, not a
  legacy artifact, and a blanket `WHERE column = false` backfill destroys
  the only record that choice ever existed. Before writing any such
  migration, run a count of `true`/`false`/`NULL` for every row first, so
  the number of real opt-outs at risk is known before the write runs, not
  discovered after.
- OS push permission and an in-app notification category are two separate
  consents. The system permission prompt answers only "can this app push at
  all"; it must never be read as an answer for every individual reminder
  category (quiz, japa, Brahma Muhurta, family remembrance, etc.), each of
  which needs its own default appropriate to how intrusive it is — a 4 AM
  wake reminder is not the same decision as a 10 AM quiz nudge, and
  defaulting both identically ignores that.
- Rolling a new default out to existing users (as opposed to new signups)
  must be a visible, dismissible in-app prompt, never a silent write to
  their row. The prompt preserves real consent; a backfill only overwrites
  the record of what consent existed.
- Why this rule exists: on 2026-10-25/26, two migrations
  (`20261025232000_default_quiz_reminder_enabled`,
  `20261026113000_default_all_notifications_enabled`) backfilled nine
  reminder columns with `UPDATE ... SET x = true WHERE x = false OR x IS
  NULL`, unconditionally overwriting any user's explicit opt-out alongside
  genuinely unset rows, with no way afterward to tell which rows had been
  which. One of the reversed columns, `wants_brahma_muhurta_reminders`, had
  been added as a deliberate opt-in (`20261011133334_brahma_muhurta_reminder_opt_in`)
  two weeks earlier specifically because waking someone at 4 AM needs real
  consent -- this silently reversed that decision without noting it was
  doing so. The project's free tier has no point-in-time recovery, so the
  prior values are unrecoverable. The matching Native-side defect --
  `getNotificationPersistencePayload` setting every reminder flag `true`
  regardless of whether the user tapped "Not now" on the OS prompt -- is
  recorded in shoonaya-mobile's AGENTS.md. This applies equally to human and
  AI-agent contributors.

### 7. Platform and Build Precision
- Keep these states distinct: committed, pushed, deployed, built, installed,
  launched and smoke-tested.
- Distinguish local Android APK/AVD, EAS preview standalone APK,
  Play production AAB, local iOS Simulator build and App Store/TestFlight IPA.
- Never claim an AVD or Simulator is updated without reporting the installed
  artifact/build identity.
- iOS Simulator cannot prove remote push delivery.

### 8. UI and Motion Verification
- Preserve established Shoonaya tokens and shared components.
- Do not redesign unrelated Home, Hero, navigation or profile surfaces.
- Verify Android and iOS, light/dark mode, text scaling, reduced motion,
  loading/error/empty/offline states and 44px touch targets.
- Do not claim pixel parity between PWA and Native; require equivalent
  content, actions, states, accessibility and platform-appropriate quality.
- Do not add animation dependencies or decorative loops without measured need.
- In Native flex rows, any text alongside an icon, badge, or sibling element must
  carry `flex: 1` (or `flexShrink: 1`) and explicit `lineHeight` so it bounds
  within parent padding without clipping or border bleeding.

### 9. Performance Evidence
- Measure before and after: request count, query count, render/mount count,
  bundle impact, cache behavior and server timing.
- Do not claim 60fps, 120Hz, lower CPU, lower memory or better battery life
  without repeatable device profiling.
- Prefer removal of redundant work over adding caching or infrastructure.

### 10. Delivery and Repository Hygiene
- Inspect both working trees before editing.
- Preserve unrelated and parallel changes.
- One scoped objective and one scoped commit per prompt.
- Report every changed file and prove unrelated dirty files were not staged.
- Never push, deploy, apply production migrations, trigger production
  notifications or start paid infrastructure without explicit approval.
- Report test results as passed, failed and skipped; never present only the
  passed count as the full denominator.

### 11. AI Provider Scope — Sarvam Only
- Sarvam is the sole active AI inference provider (`src/lib/ai/providers/inference.ts`,
  `packages/pramana-serve/src/provider-selector.ts`). `self-hosted` exists as a
  configured-but-optional fallback; no other provider is registered.
- Never add, re-add, or wire in Gemini, OpenAI, Claude-as-a-provider, or any
  other AI provider without an explicit, current request from the founder in
  chat. This has been decided and reverted multiple times across this
  project's history — a Gemini provider class, config fields, and a
  `google-gemini` fallback slot were silently reintroduced at least twice
  after removal, most recently 2026-08-24, before being deleted again. Do
  not treat the mere presence of old provider code, comments, or a stray
  file as license to restore it.
- Before touching `inference.ts`, `provider-selector.ts`, or `pramana-serve/src/providers/`,
  re-check this rule is still true (`grep -ri "gemini\|openai" packages/pramana-serve/src
  src/lib/ai` should return nothing but incidental comments/docstrings) rather
  than assuming a partially-present provider is intentional.

### 12. Image and Binary Asset Integrity
- An image's real format must match its file extension. Browsers and Next's
  image optimiser sniff content, so a JPEG named `.png` appears to work on the
  web, but the Native app copies assets from `public/relics/`, and Android's
  resource compiler (AAPT2) rejects such a file and fails the whole release
  build. Re-export the file in the format its name claims; for an opaque photo
  the matching extension (`.jpg`) is the right fix.
- Cut-out art (`public/relics/`, `public/images/clay-relics/`) must be a real
  PNG or WebP with a true alpha channel. Never commit a generator's
  checkerboard "transparency" preview, a screenshot or a flattened JPEG; open
  the file on a contrasting background before committing it. JPEG cannot carry
  transparency, so renaming cut-out art is not a fix.
- `npm run check:assets` runs first in `prebuild`, so a new offender fails the
  Vercel build instead of reaching users. Run it before committing or copying
  any image, in either repository; `npm run check:assets -- --strict` also
  lists the known offenders.
- Do not report image work as done, or call assets "transparent" or "verified"
  in a commit message, until the check passes and the art has been viewed on
  the page that uses it, in light and dark. A green test suite does not cover
  assets (see 7: committed is not built is not smoke-tested).
- Record provenance for generated or third-party art: tool, date and rights
  status (see 3). Assets copied between repositories carry their defects with
  them; run the check in both.
- `KNOWN_BROKEN_IMAGES` in `src/lib/image-asset-scan.ts` may only shrink. Never
  add a file to it; fix the artwork and delete the entry
  (`src/lib/image-asset-integrity.test.ts` enforces both directions).
- Art that arrives with a baked-in checkerboard is cut out with the Native app's
  `scripts/relic-cutout/` (shoonaya-mobile), then must pass `npm run check:assets`
  and be viewed over a bright contrast colour. Prefer the generator's original
  export with a real alpha channel.
- This is the twin of shoonaya-mobile's `lib/assetFormat.ts` and its AGENTS.md
  section 11; keep the rules in step.
- Why this rule exists: Android production build 46 of the Native app
  (2026-10-06) failed after a ~3 hour EAS queue because eight JPEGs named
  `.png`, each with a checkerboard baked into its pixels, had been copied from
  `public/relics/`. They entered this repository on 2026-05-14 (`1723fa6`) and
  are referenced by `public/landing.html`, the about page, the journal and
  marketing config, the festival emblem map and the kosh page; the live about
  page serves them as fully opaque JPEGs with grey or dark checker backgrounds
  (pixel-checked 2026-10-07). No step checked them. They were replaced with real
  transparent cut-outs on 2026-10-08. This applies equally to human and AI-agent
  contributors.

### 13. Client-Supplied Dates, and What an Error May Say
- A date or time that comes from a client is validated with `src/lib/iso-date.ts`
  (`parseIsoDate`, `isRealIsoDate`, `parseClockTime`) before it is stored,
  queried or computed on. Never accept a date on its shape
  (`/^\d{4}-\d{2}-\d{2}$/`), and never accept one because `new Date(x)` is not
  `NaN`: JavaScript rolls `2025-02-31` over to 3 March, so both let days that do
  not exist through. Bounds belong to the field (a date of birth is 1900 or
  later and not in the future); say so in the response.
- An engine that takes civil dates must refuse impossible ones itself, not rely
  on its callers. `birthLocalToUTC` does. Without that, the astrology engine
  computes a normal-looking chart for the rolled-over date and nothing fails: a
  wrong Kundali must be an error, never a quiet substitute.
- Reject with 400 and a machine-readable `code` and `reason`
  (`INVALID_DATE_OF_BIRTH`, `INVALID_TIME_OF_BIRTH`, `INVALID_DATE`,
  `INVALID_VALUE`). Postgres data exceptions (SQLSTATE class 22) and check or
  not-null violations (`23514`, `23502`) mean the client sent a value the column
  cannot hold: a 400, not a 500.
- Never return `error.message` from a database, provider or engine failure. It
  can carry table, column, query and value detail. Log the code and message
  server-side and return generic text. A `RangeError` that an engine raises on
  purpose for a bad input is the one safe message to show.
- Test the impossible days for every date field: 31 February, 29 February in a
  non-leap year (and in 2100), 31 April, month 13, day 0, a year before the
  minimum, and a future date. Store the normalised value, not the raw text.
- Why this rule exists: on 2026-10-09 a new Android build could not finish
  onboarding. The Native app sent `18081991` to `profiles.date_of_birth` and
  Postgres rejected it (22008). Auditing the server for the same class showed it
  was looser than the client: the profile route used `new Date(...)`, so
  `2025-02-31` passed and failed in Postgres as a 500 carrying the database's
  text; `calendar/day` and `journal/entry` checked shape only; and the chart
  route checked only that a date was present, so the engine computed a chart
  for the rolled-over date (`1991-02-30` became 2 March 1991) and only Postgres
  rejecting the raw value stopped it being saved; a path that computes without
  storing, such as the web Kundali page, would show it with no error. The Native
  app now validates before it sends (shoonaya-mobile AGENTS.md section 12); the server must not depend on
  that, because old builds, the web client and direct calls exist. This applies
  equally to human and AI-agent contributors.

### 14. Dharma Mitra Must Give the Same Answer Twice
- A person who asks Dharma Mitra the same question twice must get the same answer. People act on these answers, so
  two different answers to one question is a credibility defect, not a style variation.
- `/api/ai/chat` therefore (a) generates with `CHAT_TEMPERATURE` (0), never the provider default; (b) remembers, per
  person, the answer it gave (`ai_chat_answer_cache`, 14 days, first writer wins) and returns it for the same question
  without generating, charging the daily allowance or running retrieval; and (c) answers a request to *choose a date*
  for a wedding, home entry, business start or journey with one fixed, tradition-neutral reply
  (`src/lib/ai/decision-intent.ts`) directing the person to a trusted, qualified teacher or elder. The model never picks
  a date for a decision.
- The remembered-answer key (`buildAnswerCacheKey`) must contain everything that can change the answer: the
  normalised conversation, language settings, the profile fields the prompt uses, the system-prompt fingerprint, the
  grounding corpus version and the model. When you add an input to the prompt or the retrieval, add it to the key.
  When the grounding corpora are re-indexed or replaced, bump `GROUNDING_CORPUS_VERSION`, otherwise people keep being
  served answers written from the old text. The calendar date is in the key only for date-relative questions.
- Remembered answers are never shared between people. The `mode` requests (Dharam Veer, festival rules) and the
  deterministic upcoming-vrat list are not remembered. The question/context are represented by a hash rather than
  stored in plaintext; answer text is stored and may echo user-provided details. A failing or missing cache table must
  never fail a question: the route falls back to generating.
- A repeated first-turn question in the same chat may reuse its original context-free answer only while that first turn
  remains at the start of the submitted history. Do not reuse that answer for a contextual follow-up or infer that a
  truncated history starts at the beginning of a conversation.
- Do not "fix" a wrong remembered answer by shortening the expiry. Correct the cause (prompt, corpus, model) and let
  the fingerprint or corpus version change the key.
- Why this rule exists: on 2026-10-29 the founder raised that the same question could get two different answers. The
  cause was in the code: the Sarvam provider samples at 0.3 by default, nothing remembered an earlier answer, and
  decision questions went to free generation. Temperature 0 alone does not make a hosted model repeat itself word for
  word, which is why the memory exists. Not covered: a person who rephrases the question, or asks it in another
  language, may still get a differently worded answer. The Hindi and Punjabi decision replies need review by a
  native speaker. Rephrased questions, contextual repeats, or a first turn no longer present in submitted history may
  still receive a newly generated answer. This applies equally to human and AI-agent contributors.

## Required Behavior

- Read the relevant `.claude/agents/*.md` role file before implementing specialized work.
- Keep edits scoped to the user request.
- Preserve existing working flows and completion logic.
- Do not revert unrelated user or Claude changes.
- Use existing local patterns before introducing abstractions.
- For reviews, lead with findings, risks, and file references.

## Verification

Run targeted checks for touched files. For code edits, also run `graphify update .` after the change.

If full TypeScript is blocked by the known `ProfileClient.tsx` issue, say that directly and still run useful narrower checks.

## Reporting

Final responses must include what changed, checks run, and remaining risk. Do not claim a clean build unless it was actually verified.

## Calendar Engineering Rules

Binding for anything touching `packages/panchang-engine`, `packages/panchanga-core`,
`packages/dharma-rules`, `src/lib/calendar/*`, or the `observance_*` tables.

Specifications are authoritative: `docs/calendar-domain-model.md`,
`docs/astronomy-conventions.md`, `docs/calendar-profiles.md`,
`docs/festival-rule-schema.md`, `docs/calculation-examples.md`,
`docs/CALENDAR_RULES_AND_VERIFICATION.md` (supersedes the archived
`docs/archive/source-governance.md`). Current state and open work:
`docs/CALENDAR_ENGINE_ASSESSMENT.md`.

1. **Never hard-code Gregorian festival dates.** A date belongs in an occurrence row
   produced by a rule, or in a council-approved `manual_date_override` — nowhere else.
2. **All astronomical timestamps are stored in UTC.** ISO-8601 with `Z`.
3. **All displayed times must use an IANA timezone.** Fixed offsets like `+05:30`
   are forbidden in storage and in computation.
4. **Calculation location and tradition region are separate concepts.** Never derive
   a calendar profile from GPS; never compute a user's timings from a region's
   reference city.
5. **Festival rules must be represented as versioned data**, not code. Adding a
   regional or sampradāya variant must never require an engine change.
6. **Every occurrence must include its rule version and explanation.** An occurrence
   without `versions`, `reasons`, `profile`, and `location` must not be persisted or
   displayed.
7. **Never silently choose between recognised traditions.** Return all recognised
   variants; mark the user's as primary; never imply another is wrong.
8. **Do not modify astronomical conventions without updating the ADR.** Anything
   marked `[C]` in `docs/astronomy-conventions.md` is a breaking change requiring a
   version bump, re-materialisation, and a golden re-run.
9. **Every rule change requires golden test cases.** A rule at `approved` without a
   sourced golden fixture fails CI.
10. **A passing unit test does not prove religious correctness.** Items marked `[S]`
    require a named human reviewer's ratification (`docs/CALENDAR_RULES_AND_VERIFICATION.md`);
    engineering may implement and flag, never ratify.
11. **Do not label a calendar result universal unless it is astronomical data.**
    Layer A is universal; Layers B and C are always profile-qualified.
12. **Use appropriately precise calculations.** Respect the tolerance budget in
    `docs/astronomy-conventions.md` §1.2 — tithi boundaries to ≤ 60 s. Never return
    an estimated boundary; return `null` and a diagnostic.

13. **One concept, one implementation.** Do not add a second copy of astronomy,
    a constant table, a solver, or a data source. If a transitional duplicate is
    genuinely unavoidable (e.g. a corrected implementation beside a load-bearing
    buggy one), you **must** register it in `docs/CALENDAR_ENGINE_ASSESSMENT.md`
    §7 with an explicit retirement gate, and say so in your report. **An
    unregistered duplicate is a defect** — a fix applied to one copy silently
    misses the other, which is exactly how defects D1/D2 were created.

14. **Every change and every review runs `docs/REVIEW_CHECKLIST.md`.** It is the
    coverage contract. §2 is the evidence rule: every reported number must be
    printed by a committed script runnable with one command, no hardcoded
    conclusions, and a source is a citation with query parameters — not a label.
    §3 is the standing invariant list: cardinality, detection capability, both
    directions, detection-vs-behaviour, degenerate inputs, frames and units,
    compensation, scope honesty. Checking a change against its own task
    description is **not a review** — that is a closed loop, and it is how D15's
    cardinality gap, D26 and D28 all reached `main` past a green suite. Sign off
    per §5: for each §3 heading, clear / finding / not-applicable-because.
    **Silence is not an answer.**

15. **Never hand-write physics; always own the dharma.** Every astronomical
    calculation delegates to `astronomia` through the astronomy adapter — the
    only file permitted to import it. Ayanāṁśa, tithi/nakshatra/yoga/karana,
    muhurta windows, the Vedic day boundary, civil-date ownership, §8 policies
    and all of Layers B and C are ours and always will be. **The test:** if it
    would be identical for an observatory in Chile, it belongs to astronomia.
    If a Hindu calendar concept appears in its name or reasoning, it is ours.
    Where astronomia genuinely lacks something, that is a documented exception
    recorded in `docs/CALENDAR_ENGINE_ASSESSMENT.md` §7. See
    `docs/ASTRONOMY_BOUNDARY_PLAN.md`. **All 11 defects D18–D28 were in physics
    we wrote; none were astronomia's** — this rule exists because of that
    evidence, not on principle.

Additional hard constraints:

- **Layer discipline:** Layer A must not import Layer B or C; Layer B must not import
  Layer C. A violation is a defect even if the output looks correct.
- **Before adding a helper, grep for it.** `normalizeAngle`, `computeAstronomy`,
  month-name arrays and boundary solvers already exist. Import, do not redefine.
- **The mobile vendored tarball is a release artefact, not a copy to edit.**
  Re-vendor from source; never hand-modify `vendor/*.tgz` contents.
- **Swiss Ephemeris** must not be enabled without a recorded commercial-licence
  decision. Keep the existing `licenseMode: 'undecided'` guard.
- **No scraping** of commercial panchāṅga services. See
  `docs/CALENDAR_RULES_AND_VERIFICATION.md` ("No scraping, no bulk import").
- **LLM output is never a source.** Triage signal only; it may not set
  `review_status` or write a published date.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Notification Target Integrity (2026-10-30)
- Notification URLs carry event context: weekly summaries open `/my-progress`; Pitru Paksha candidates carry the reviewed occurrence civil date in `/panchang?date=YYYY-MM-DD`. Never replace that date with the delivery/tap date. The legacy producer preserves its existing calculation-context date; this is not a new calendar approval or a change to its eligibility rules.
- Mandali locators are not access grants. `/api/mandali/notification-target` rechecks the current profile, membership, both block directions, mutes, hidden content, comment parent/deletion and connection participants before returning an item. Failure to read safety state must fail closed, never become empty exclusions. Use public usernames, not private legal names.
- Trigger-generated `action_url` flows to push `data.url` unchanged. Unknown legacy target formats and block/report acknowledgements open the recipient's own notification receipt; never guess a post from an undocumented key or reveal blocked/reported content.
- Key formats are read from the writing trigger, not assumed. `trg_notify_mandali_comment` (AFTER INSERT on `post_comments`) writes type `mandali_comment`, key `mandali_comment:<comment_id>`; there is no `mandali_mention` type. The definition of `notify_mandali_comment` exists only in production, not in `supabase/migrations`: a drift to close separately. A connection-request view describes the other person (`counterparty`), never the requester.
- Origin: the 2026-10-29 notification review found weekly summaries still opening Home, dated Pitru notifications losing their event date, and all Mandali targets opening the hub. The implementation review also found `getUserSafetyState` discarded query errors, which could bypass block/mute/hidden exclusions when resolving a notification. Guards live in `mandali-notification-target.test.ts`, the producer tests, and `scripts/notification-routing/verify-migration.sh`. Device delivery remains a separate release gate.

## A Deleted Account Is Not an Outage (2026-10-30)
- Bearer tokens are verified locally against the pinned JWKS, so a deleted account's token stays valid until it expires. A native route that must have a profile row (`home-summary`, `progress-summary`, `profile/bootstrap`, `shloka/today`) repairs a missing one through `resolveAuthProfile` (`src/lib/auth-profile.ts`). When that insert fails with SQLSTATE `23503` naming `profiles_id_fkey`, the database has said the `auth.users` row is gone: answer **401 `AUTH_REQUIRED`** through `getDeletedAccountResponse()` so the client refreshes, is refused, and signs out. Every other failure -- a stalled read, a timeout, a missing client, any other constraint or code -- stays a retryable **503 `PROFILE_UNAVAILABLE`**. A slow database must never sign anybody out; match the constraint name, never the code alone, and never infer "deleted" from "the profile read failed".
- `ensureAuthProfile` stays as a wrapper returning `null` for every non-ready outcome. The web sign-in callbacks (`auth/callback`, `auth/destination`) keep it: they handle freshly authenticated users, who cannot be deleted accounts. A new route that repairs a profile for an existing session uses `resolveAuthProfile`, not the wrapper.
- A screen that needs one slice of Home (today's shloka, a streak) calls a route that computes only that slice. It must not call `home-summary` and discard the rest: a slow calendar, observance or Dharm Veer query then holds an unrelated screen open. `shloka/today` returns the same `sacredText` that `home-summary` builds, from the same `buildDailySacredText(profile, getDayOfYear())` call, with no calendar work.
- Origin: on 2026-10-30 (23:30-23:34 UTC) a Supabase stall made `home-summary` answer 503 for every user, and at 23:36:04 UTC a separate session for a deleted account (profile insert failing `profiles_id_fkey`) was answered with the same retryable 503, so the app retried it forever. The Shloka screen, which read only `sacredText` from `home-summary`, hung with it. Guards: `src/lib/auth-profile.test.ts`, the deleted-account cases in `home-summary.test.ts`, `progress-summary.test.ts`, `api-auth-routes.test.ts` and `shloka/today/today.test.ts` (each mutation-checked: matching any `23503`, never reporting `user_deleted`, or answering 401 for a stall makes one fail).
- Not verified: a deleted account's device actually reaching the sign-in screen. Reading `@supabase/auth-js` 2.110.0 shows a non-retryable refresh failure removes the session and emits `SIGNED_OUT`; that has not been observed on a device.

## Sanskara Public Error Reasons (2026-10-31)
- Map Sanskara refusals by both SQLSTATE and the exact reason. SK409 includes version conflicts, reused request IDs and duplicates; SK422 includes limits and other rule refusals. An unknown reason gets generic text for its SQLSTATE, never raw database text.
- A new reason in a Sanskara migration must have reviewed public text in SANSKARA_REASON_ERRORS; native-sanskara.test.ts scans the migrations and fails when coverage is missing. Origin: Native prompt preparation found version conflicts were reported as reused request IDs and every rule refusal as a limit.
- save-private uses the private row version, or 0 when no private row exists. Never substitute the record version.
