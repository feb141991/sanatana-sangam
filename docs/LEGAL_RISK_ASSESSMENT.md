# Legal Risk Assessment — Shoonaya (Web + Native)

**Date**: 2026-08-24 (rev. 2 — corrected after independent verification)
**Assessor**: Claude (Sonnet 5), code-based + live-database inventory — not a licensed attorney
**Matter**: General legal/regulatory compliance posture across the Shoonaya web app (`Sanatan Sangam/Shoonaya`) and native app (`shoonaya-mobile`)
**Privileged**: No — this is a code/data-derived inventory, not attorney work product

> **This is not legal advice.** Severity/likelihood ratings are judgment
> calls using the framework at the bottom, not a lawyer's. Every ORANGE/RED
> item should be reviewed by qualified counsel before you rely on it for
> compliance decisions.

**Revision note**: A second review of the first version of this document
caught one critical miss (P0 below) and several understated findings. Every
correction below was independently re-verified against the **live**
production database and current source files before being accepted — not
taken on faith. Where the second review's phrasing needed a technical
correction of its own (noted inline), that's reflected too. This is the
authoritative version; treat the first draft as superseded.

## P0 — NEW, CRITICAL: `profiles` table is publicly readable

**This was missing from the first draft and outranks everything else in
this document.**

Verified directly against the live production database (project
`mnbwodcswxoojndytngu`), not just static schema files:

```
polname: "Public profiles are viewable by everyone"
polcmd:  r (SELECT)
roles:   {-}   -- PUBLIC, i.e. every role including anon
using:   true  -- no row filter at all
```

Combined with a live `GRANT ... SELECT ON public.profiles TO anon`
(confirmed via `information_schema.role_table_grants`), this means **any
unauthenticated caller with the publishable/anon key can read every column
of every row in `profiles`** — Row-Level Security restricts rows, not
columns, and there is no column-level grant or view narrowing this. Exposed
columns include: full name, date of birth, precise `home_latitude`/
`home_longitude`, gender, tradition, sampradaya, gotra, ban status, karma
points, and OneSignal player ID, among others.

**Severity: 5 (Critical)** — this is not a theoretical/future exposure, it
is a live, currently-exploitable data leak of an entire user table including
special-category (religious) and precise-location data.
**Likelihood: 5 (Almost Certain)** — no exploit is required beyond a public
API key and a REST call; this isn't a hypothetical attack path, it's the
system's current designed behavior.
**Score: 25 — RED.**

**Recommended action** (engineering, immediate, before anything else in
this document):
1. Confirm in production whether this is actually being exploited (check
   API/PostgREST access logs for anonymous `profiles` reads at volume).
2. Revoke `anon` SELECT on `profiles` directly; replace the "everyone"
   policy with `authenticated`-scoped self-access plus a narrow
   `security_invoker` public-profile view (or RPC) exposing only columns
   that are genuinely meant to be public (e.g. username, avatar, public
   bio) — not the whole row.
3. Add an automated negative test asserting an anonymous client cannot read
   `date_of_birth`, `home_latitude`/`home_longitude`, `tradition`,
   `sampradaya`, `gotra`, or any other sensitive column.
4. Because this may qualify as a reportable data exposure incident under
   GDPR/DPDP/CCPA depending on whether it was ever actually queried by a
   third party, **loop in counsel on breach-notification obligations as
   soon as engineering confirms scope** — this is a "mandatory outside
   counsel" trigger (active/potential incident), not a routine fix.

## Risk Register

| ID | Description | Category | Severity | Likelihood | Score | Level | Status |
|---|---|---|---|---|---|---|---|
| **P0** | **`profiles` table publicly readable by `anon` — see above** | **Data Privacy / Security** | **5** | **5** | **25 — RED** | **Open — urgent** |
| L-03 | Onboarding writes `tradition`, `date_of_birth`, `gotra`, `rashi`, `nakshatra` (`buildOnboardingProfilePayload`, `lib/onboarding-contract.ts`) with **no consent capture in that flow at all**. `consent_religious_data` only exists as a separate Settings toggle that **defaults to `true`** (`app/settings.tsx` `INITIAL_SETTINGS`) and does not gate collection or clear data when turned off | Data Privacy (special category) | 4 (High) | 4 (Likely) | **16 — RED** | Open — confirmed, not just "needs verification" |
| L-04 | Not just "no cookie banner": Google Analytics 4, Google AdSense, and OneSignal all load **unconditionally** on every page load in `src/app/layout.tsx`, before any consent choice exists. GA has a **hardcoded fallback measurement ID** (`'G-548KZ0TBHD'`) independent of env config, and AdSense's script has no gate at all | Data Privacy (EU/UK — PECR) | 4 (High) | 4 (Likely) | **16 — RED** | Open — confirmed, worse than originally stated |
| L-02 | Guest (unauthenticated, `session_token`-based) `POST /api/jyotish/chart` accepts `date_of_birth`, `birth_lat`, `birth_lng` with zero age handling — confirmed in `src/app/api/jyotish/chart/route.ts`. Correction from v1: this is **birthplace** coordinates, not necessarily the user's current device location; still sensitive, but that distinction matters legally | Data Privacy / Children's Data | 4 (High) | 3 (Possible) | **12 — ORANGE** | Open |
| L-01 | iOS `PrivacyInfo.xcprivacy` declares `NSPrivacyCollectedDataTypes: []` while the app collects location, photos, and account data. Correction from v1: this is **not** about Firebase Analytics — that library is genuinely Android-only (`Platform.OS !== 'android'` guard in `lib/analytics.ts`) — the gap is the app's own first-party collected-data declaration | App Store / Platform Compliance | 3 (Moderate) | 4 (Likely) | **12 — ORANGE** | Open |
| L-06 | ~~ATT/`expo-tracking-transparency` missing~~ — **downgraded, likely not a real gap**. ATT is required for cross-company tracking/advertising attribution specifically, not merely for having an analytics SDK present; since Firebase Analytics is Android-only in this app, `NSPrivacyTracking: false` may already be technically correct. Needs one factual confirmation, not a code change by default | App Store / Platform Compliance | 2 (Low) | 2 (Unlikely) | **4 — GREEN** | Open — verify only |
| L-05 | Mobile signup/login has only passive "by continuing you agree" link text (`app/(auth)/login.tsx`), no explicit checkbox, **and no durable record of accepted Terms version/timestamp anywhere** (web checkbox exists but I found no `terms_version`/`accepted_at` persistence either) | Data Privacy / Contract Formation | 3 (Moderate) | 3 (Possible) | **9 — YELLOW** | Open |
| L-07 | Privacy Policy content gaps: no stated controller legal entity/postal address, no per-purpose lawful basis / Article 9 condition, no concrete per-category retention periods, no international-transfer mechanism statement, no explicit right-to-complain-to-ICO statement, "secure, audited cloud environments" phrasing not verified as factually supportable, DPO appointment status not confirmed before using that title | Data Privacy (policy content) | 3 (Moderate) | 3 (Possible) | **9 — YELLOW** | Open |
| L-08 | Store/community compliance gates not verified: App Store privacy nutrition label accuracy, Google Play Data Safety declaration (including third-party SDK collection), and Mandali (community/UGC) feature's filtering/reporting/blocking/published-contact/moderation-response coverage — Apple explicitly requires all four for UGC apps under App Review Guideline 1.2 | Platform / Trust & Safety | 3 (Moderate) | 3 (Possible) | **9 — YELLOW** | Open — needs a dedicated pass, not covered in this review |
| L-09 | No single governing-law/exclusive-jurisdiction clause in ToS despite India/UK/US region-specific appendices | Corporate / Contract | 2 (Low) | 2 (Unlikely) | **4 — GREEN** | Open |
| L-10 | No user-facing content-sourcing/copyright disclosure page (internal `rightsStatus`/tier governance exists but isn't surfaced to users) | IP / Content | 2 (Low) | 2 (Unlikely) | **4 — GREEN** | Open |
| L-11 | Razorpay is the sole payment processor; UK 14-day cooling-off clause already present — no gap found, spot-check only | Corporate / Consumer Protection | 2 (Low) | 2 (Unlikely) | **4 — GREEN** | Closed / low concern |
| L-12 | Twilio used only for WhatsApp OTP (transactional auth), not marketing SMS | Marketing / Telecom | 1 (Negligible) | 2 (Unlikely) | **2 — GREEN** | Closed / low concern |
| L-13 | Privacy Policy and Terms of Service have unsynchronized "last updated" dates | Corporate / Documentation | 1 (Negligible) | 2 (Unlikely) | **2 — GREEN** | Open |

**Three RED items now** (P0, L-03, L-04) — all confirmed against live
data or current source, none hypothetical. This is a materially different
risk posture than v1, which had zero RED items.

## Corrections to the first draft (for transparency)

- **L-03** moved from "needs verification, YELLOW (9)" to **confirmed,
  RED (16)** — the onboarding write path and the disconnected, default-on
  consent toggle are both real and directly verified in source.
- **L-04** moved from "no cookie banner, YELLOW (9)" to **confirmed
  active pre-consent tracking, RED (16)** — GA4/AdSense/OneSignal loading
  unconditionally is a materially worse finding than a missing banner alone.
- **L-01** stays ORANGE but the *reasoning* was corrected — it's not caused
  by Firebase Analytics (Android-only, confirmed), it's the app's own
  first-party data types not being declared.
- **L-06 (ATT)** downgraded from a stated gap to "verify only" — ATT's
  trigger condition (cross-company tracking/attribution) doesn't
  automatically apply just because an analytics SDK exists, and the SDK in
  question isn't even active on iOS.
- **L-02** kept at the same score but the description was corrected:
  birthplace coordinates are not the same legal thing as real-time device
  location, and the "Significant Data Fiduciary" framing in v1 overstated
  precision about India's DPDP children's-data rule — that needs
  jurisdiction-specific counsel confirmation, not my characterization.
- **New**: L-05 now explicitly includes the missing terms-version/
  timestamp audit trail (not just the passive-text issue). **New**: L-07
  (policy content gaps) and L-08 (store labels + UGC moderation gates) are
  net-new findings from the second review, both independently plausible
  and not yet verified item-by-item by me — flagged as open, not closed.

## What's already well-handled (unchanged from v1 — still true)

- Account deletion is a real, working, 30-day-cool-off hard-delete
  pipeline; data export is a real JSON payload, not a stub.
- Jurisdiction-aware policy content exists (India DPDP, UK/EU GDPR, US
  CCPA/CPRA/COPPA appendices) — more mature than most apps at this stage,
  even with the content gaps noted in L-07.
- No unauthorized AI vendor — confirmed only Sarvam.
- Quiet hours and per-category notification preferences are real and
  enforced by every reminder cron.
- No marketing SMS.

## Recommended order (supersedes v1's)

1. **P0 — fix and assess breach-notification exposure immediately.** This
   is not sequenced with the rest; it's ahead of everything.
2. Stop GA4/AdSense/OneSignal from loading before a consent choice exists
   (L-04); redesign religious-data consent as an enforced, onboarding-time
   gate rather than a disconnected, default-on Settings toggle (L-03).
3. Add age handling before any DOB/birth-profile path, guest or
   authenticated (L-02) — product/policy decision with counsel, not a
   unilateral engineering patch.
4. Fix the iOS privacy manifest's collected-data-types declaration (L-01);
   separately confirm (don't necessarily build) the ATT question (L-06).
5. Add terms-version/timestamp persistence (L-05); have UK/India/US privacy
   counsel review and fill the Privacy Policy content gaps (L-07).
6. Run a dedicated App Store/Play Store label + Mandali UGC-moderation
   compliance pass (L-08) — out of scope for this review, needs its own.

## Outside counsel recommendation

**P0 escalates the entire assessment.** Per this skill's engagement
criteria, a live, confirmed exposure of a full user table including
special-category data is squarely a "mandatory engagement" trigger once
engineering confirms whether the exposure was ever actually queried by an
unknown party — that's a breach-assessment question, not a code question.
L-02 and L-03/L-07 remain strongly-recommended-for-counsel as stated in v1.

---

## Appendix — Framework used

**Severity** 1 Negligible · 2 Low · 3 Moderate · 4 High · 5 Critical.
**Likelihood** 1 Remote · 2 Unlikely · 3 Possible · 4 Likely · 5 Almost
Certain. **Score = Severity × Likelihood**: 1-4 GREEN (Low), 5-9 YELLOW
(Medium), 10-15 ORANGE (High), 16-25 RED (Critical).

## Appendix — Verification method for this revision

Every claim in the second review was independently re-checked before being
accepted, not taken on the reviewer's word:
- P0: queried live `pg_policy` and `information_schema.role_table_grants`
  on production project `mnbwodcswxoojndytngu` directly (not the static
  `supabase/public_schema.sql` dump, which is stale — last committed
  2026-07-24 while migrations exist through 2026-08-23).
- L-03: read `lib/onboarding-contract.ts` (`buildOnboardingProfilePayload`)
  and `app/settings.tsx` (`INITIAL_SETTINGS`) directly.
- L-04: read `src/app/layout.tsx` in full — confirmed unconditional GA4,
  AdSense, and OneSignal script injection and the hardcoded GA fallback ID.
- L-02: read `src/app/api/jyotish/chart/route.ts` in full.
- L-01/L-06: read `ios/Shoonaya/PrivacyInfo.xcprivacy` and
  `lib/analytics.ts` in full, confirmed the Android-only guard clause.
- L-07/L-08: not independently re-verified item-by-item in this revision —
  flagged as plausible open items pending a dedicated pass, per the
  reviewer's citations, rather than asserted as confirmed the way P0/L-02/
  L-03/L-04/L-01 were.
