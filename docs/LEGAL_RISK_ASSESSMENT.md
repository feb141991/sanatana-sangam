# Legal Risk Assessment — Shoonaya (Web + Native)

**Date**: 2026-08-25 (rev. 3 — rerun after a day of remediation work)
**Assessor**: Claude (Sonnet 5), code-based + live-database inventory — not a licensed attorney
**Matter**: General legal/regulatory compliance posture across the Shoonaya web app (`Sanatan Sangam/Shoonaya`) and native app (`shoonaya-mobile`)
**Privileged**: No — this is a code/data-derived inventory, not attorney work product

> **This is not legal advice.** Severity/likelihood ratings are judgment
> calls using the framework at the bottom, not a lawyer's. Every ORANGE/RED
> item should be reviewed by qualified counsel before you rely on it for
> compliance decisions.

## Headline finding of this rerun: source fixed ≠ production fixed

This is the thing rev. 2 couldn't have known and this rerun exists to catch.
**Nine web-repo commits made since rev. 2 — including every application-code
fix below — are sitting locally, unpushed.** I confirmed this directly:
`git rev-list --count shoonaya-repo/main..HEAD` returns 9; the remote's
`HEAD` is still `fb214d4`, from before today's work. Vercel deploys from
that remote branch. **Production is still running the code rev. 2 assessed
as broken, for everything except the two direct-to-database Supabase
migrations below**, which take effect independent of an app deploy.

| What | Live in production right now? | Why |
|---|---|---|
| P0 profiles RLS lockdown | **Yes** | Applied directly via Supabase migration, independent of app code |
| `legal_acceptances` table exists | **Yes** (empty) | Same — DB migration, not app code |
| GA4/AdSense/OneSignal consent gate | **No** | App code, unpushed |
| Religious-data consent enforcement | **No** | App code, unpushed |
| Signup acceptance-recording | **No** | App code, unpushed — the table exists but nothing writes to it yet |
| Mandali UGC hardening | **No** | App code, unpushed |
| Native Firebase Analytics removal | Pushed to mobile repo, **not in an app store release** | Needs a new build/submission; existing installed apps are unaffected until users update |

None of this is a criticism of the work — it's real, verified, and ready.
It just isn't protecting a single production user yet. Treat the risk
register below as describing two different points in time per row.

## Risk Register

| ID | Description | Category | Severity | Likelihood | Score | Level | Status |
|---|---|---|---|---|---|---|---|
| P0 | `profiles` table publicly readable by `anon` | Data Privacy / Security | 5 | 5 | 25 — RED | **CLOSED, live** — reconfirmed via anonymous REST call returning `401 permission denied` |
| L-03 | Religious-data consent (tradition/sampradaya/gotra/rashi/etc.) collected and used for personalization with a disconnected, default-on toggle | Data Privacy (special category) | 4 | 4 | 16 — RED | **Fixed in source, not deployed.** `home/personalise` and `ai/chat` now suppress these fields from personalization when `consent_religious_data` is false; default flipped to `false`. Not live until pushed + deployed. Lawful basis / Article 9 condition still not documented — enforcement without an approved basis is a mechanism, not a legal answer. |
| L-04 | GA4/AdSense/OneSignal loading unconditionally, no consent gate | Data Privacy (EU/UK — PECR) | 4 | 4 | 16 — RED | **Fixed in source, not deployed.** `WebConsentManager` defaults all three to denied, gates every script behind an explicit choice. Production still loads all three unconditionally today. |
| L-02 | Guest birth-chart endpoint accepts DOB + birthplace coordinates, no age handling | Data Privacy / Children's Data | 4 | 3 | 12 — ORANGE | **Unchanged.** No age-gate exists in the guest chart flow (`src/app/api/jyotish/chart/route.ts`) in source or production. `AGE_POLICY` in `policy-config.ts` records a founder decision (soft guidance, no blocking, global) but `verifiedParentalConsentImplemented: false` and `minimumAccountHolderAge: null` — still squarely a "get counsel before treating as closed" item. |
| L-01 | iOS `PrivacyInfo.xcprivacy` declares zero collected data types | App Store / Platform Compliance | 3 | 4 | 12 — ORANGE | **Not verified this rerun** — not rechecked against current `app.json`; flag as needs a fresh look before next submission, not carried forward as confirmed either way. |
| L-05 | Mobile signup passive-text consent; no terms-version/acceptance audit trail | Data Privacy / Contract Formation | 3 | 3 | 9 — YELLOW | **Partially fixed, not deployed.** Web now records versioned acceptance receipts (`legal_acceptances`, all three web signup paths) — but this is unpushed, so production has zero rows in a table that exists. Mobile signup still has no equivalent and no version/timestamp capture at all. |
| L-07 | Privacy Policy content gaps (controller entity, lawful basis, retention periods, transfer mechanism, DPO status) | Data Privacy (policy content) | 3 | 3 | 9 — YELLOW | **Unchanged.** This is a document-text/legal-review item, not something engineering enforcement touches. `LEGAL_DOCUMENTS.status` now reads `mechanism_implemented_content_pending_legal_review` — an honest label, not a claim this is resolved. |
| L-08 | Store/community compliance: App Store privacy labels, Play Data Safety form, Mandali UGC moderation coverage | Platform / Trust & Safety | 3 | 3 | 9 — YELLOW | **Mandali write paths hardened in source** (authenticated, rate-limited, server-owned — verified via `verify-compliance-engineering.mjs`, currently passing), **not deployed**. Store forms: cannot be verified from the repo either way — evidence worksheets exist (`STORE_PRIVACY_EVIDENCE.md`) but the doc itself says submission status is unknown from here. |
| — | Retention periods unapproved | Data Privacy (storage limitation) | 3 | 3 | 9 — YELLOW | **Unchanged, correctly so.** `destructiveJobsEnabled: false` globally, every category `pending_approval`, confirmed live in the registry and enforced by a passing compliance check. A more complete 14-category draft (`docs/compliance/registers/RETENTION_SCHEDULE.json`, including the real 7-year statutory hold for payment records) exists from parallel work — still awaiting founder/counsel approval, not silently approved. |
| L-09 | No single governing-law clause in ToS | Corporate / Contract | 2 | 2 | 4 — GREEN | Unchanged. |
| L-10 | No user-facing content-sourcing/copyright disclosure | IP / Content | 2 | 2 | 4 — GREEN | Public source-provenance page/API now exists in source (`src/app/sources`, `src/lib/public-source-disclosures.ts`) with a fail-closed contract — not deployed, but this was low-severity either way. |
| L-11 | Razorpay sole payment processor, cooling-off clause | Corporate / Consumer Protection | 2 | 2 | 4 — GREEN | Unchanged, no gap found. |
| L-12 | Twilio WhatsApp OTP, transactional only | Marketing / Telecom | 1 | 2 | 2 — GREEN | Unchanged, closed. |
| L-13 | Privacy/Terms unsynchronized "last updated" dates | Corporate / Documentation | 1 | 2 | 2 — GREEN | Structurally improved — both now derive from a single `TERMS_VERSION`/`PRIVACY_VERSION` constant instead of freestanding hardcoded strings, reducing future-drift risk. Not deployed yet either. |

**Two RED items remain** (L-03, L-04) — technically closeable today by a
single `git push` + Vercel deploy, but they are RED until that happens, not
after. P0 is the only item that moved to genuinely closed-in-production this
cycle.

## What actually changed since rev. 2 (source-level)

- Religious-data consent: suppress-only enforcement in the two
  highest-value personalization surfaces; default flipped to `false`.
- Versioned Terms/Privacy acceptance mechanism: table, constants, recording
  wired into every web signup path. No reacceptance-prompt UI yet for
  existing users on a version bump.
- Web consent manager: GA4/AdSense/OneSignal now default-denied,
  category-separated, gated behind an explicit choice.
- Native Firebase Analytics removed (pushed to mobile repo; not in a
  released build).
- Mandali posts/comments/reports/connections/nearby/search/feed moved to
  authenticated, rate-limited, server-owned routes.
- A parallel, more complete compliance-registers effort appeared
  (`docs/compliance/`) — 14-category retention schedule with statutory
  exceptions, a processing-activities register, a vendor register, a
  checksummed evidence manifest. Worth a dedicated read-through before
  relying on it; not independently audited item-by-item in this rerun.

## What's still fully open, unchanged

Children's-data verified consent, religious-data lawful basis approval,
Terms/Privacy document-text legal review, retention period approval, and
store-console form submission. All five require a decision or action only
you (or counsel, or App Store Connect/Play Console access) can make —
nothing here is an engineering gap anymore, they're waiting on people, not
code.

## Outside counsel recommendation — unchanged from rev. 2

L-02 (children's data) remains the one item I'd flag as squarely
"mandatory engagement" territory the moment any product decision here
firms up further. L-03/L-07 (special-category lawful basis, policy
content) remain "strongly recommended" once you're ready to have that
conversation.

## Immediate, non-legal recommendation

Push the nine pending web commits and deploy. Every RED and several YELLOW
items in this register are sitting in `git log` right now, not protecting
anyone. This is the single highest-leverage action available before the
next legal question even needs asking.

---

## Appendix — Framework used

**Severity** 1 Negligible · 2 Low · 3 Moderate · 4 High · 5 Critical.
**Likelihood** 1 Remote · 2 Unlikely · 3 Possible · 4 Likely · 5 Almost
Certain. **Score = Severity × Likelihood**: 1-4 GREEN (Low), 5-9 YELLOW
(Medium), 10-15 ORANGE (High), 16-25 RED (Critical).

## Appendix — Verification method for this rerun

- P0: reconfirmed live via a real anonymous REST call against production
  (`401 permission denied for table profiles`), not re-derived from memory.
- Push status: `git fetch shoonaya-repo main` + `git rev-list --count
  shoonaya-repo/main..HEAD` = 9; remote HEAD confirmed still `fb214d4`.
- L-03, L-04: read the actual current source
  (`src/app/api/home/personalise/route.ts`, `src/app/api/ai/chat/route.ts`,
  `src/components/privacy/WebConsentManager.tsx`, `src/lib/web-consent.ts`)
  rather than trusting commit messages.
- L-05: confirmed `legal_acceptances` migration applied and table exists in
  production via live grant check; confirmed zero application code paths
  currently write to it until deploy.
- Retention: reran `node scripts/verify-compliance-engineering.mjs` —
  10 checks pass, 2 pending-decision warnings, matching what's claimed here.
- L-01, L-08 (store forms), and the new `docs/compliance/` register cluster
  were **not** independently re-verified item-by-item this rerun — flagged
  as open/unverified rather than asserted either way.
