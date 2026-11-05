# E-mail consent, sending and unsubscribe: plan and state (2026-11-06)

Status: Stage 1 (database) written and tested on a scratch database, **not applied anywhere**. Stages 2 and 3 are listed with what each changes.
Not legal advice. Statements about GDPR, UK PECR, India's DPDP Act, CAN-SPAM and similar laws are my understanding and are listed for a lawyer
in section 7.

## 1. Decisions taken (founder, 2026-11-06)

1. **One global opt-in.** Every marketing e-mail switch starts OFF everywhere, and turns on only by a clear action by the person. Location
   never loosens this; it only chooses the **wording** and is **recorded** as evidence.
2. A consent history records, per changed consent: who, when, granted or withdrawn, the path, the wording version shown, the region that applied
   and where it came from (a country code only, never an IP address).
3. Festival e-mail is something a person opts into: default OFF for new profiles, and the 30 existing profiles (all of them the old default,
   none ever asked) are set OFF.
4. The one existing newsletter opt-in is back-filled as source `backfill`, with its own timestamp and **no** wording or region (not known).
5. The history is deleted with the account. Whether to keep proof after deletion is a lawyer question.
6. Region comes from the request's IP country (Vercel adds a country header to requests; not yet checked on this deployment), then the device
   region, then the profile country. Unknown region gets the strictest wording.
7. No confirmation e-mail ("double opt-in") for now; add it for a region only if the lawyer says so.

## 2. The kinds of e-mail

| Class | Examples (template) | Consent needed | Unsubscribe | Today |
|---|---|---|---|---|
| Security and account | new-device sign-in (`new_device_login`), account deletion notices (`account_deletion`) | none | none; no promotional text | 30 sent |
| Service | welcome (`onboarding_welcome`), waitlist confirmation (`waitlist_welcome`) | none | none; one per event, no promotion | 20 + 2 sent, 1 failed |
| Festival and vrat e-mail | `festival_reminder`, `/api/cron/festival-email` | yes, `email_festivals`, default OFF | link, one-click header, in-app switch | 0 sent; the cron is not scheduled anywhere found |
| Newsletter and announcements | marketing campaigns (`newsletter`, `announcement`, `daily_content`) | yes, `marketing_consent` and `email_newsletter` | same | 0 sent; admin-triggered only |
| WhatsApp | campaign variants | separate opt-in (`whatsapp_opt_in`) | n/a | out of scope here; no app switch exists |

A transactional or service e-mail must never carry marketing content. If it does, it needs the marketing consent too.

## 3. Consent flow (target)

- **Give:** a switch in onboarding (off) or Settings, Email (off). The app calls the backend, which calls `set_email_consent` with the path, the
  wording version shown and the region. An older app build that writes the flags directly is still recorded (`client_direct`).
- **Check at send time:** the outbox and the campaign dispatcher re-read the flags, the account state and the suppression list immediately
  before sending. A campaign send with no unsubscribe link is refused.
- **Withdraw:** the link and one-click header in the mail (`unsubscribe_link`, `one_click`), or the in-app switch (`settings`). Withdrawal is
  always allowed, including while an account is being deleted. The web link only withdraws; it never grants, because anyone holding the mail
  could otherwise opt a person in.

## 4. Region policy

Held in code, versioned, and returned to the app by the backend. Two wording versions today:

- `eu-uk-v1`: the EEA, the UK and Switzerland, **and any unknown region** (strictest). States the purpose, that it is optional, and how to withdraw.
- `global-v1`: everywhere else. The same switch, off by default, shorter text.

Both are drafts for a lawyer. Adding a region-specific version later is a data change (a new version string) with no schema change.

## 5. What exists after Stage 1 (migration `20261106090000_email_consent_ledger.sql`)

`email_consent_events` (append-only, service-role only, deleted with the account); a trigger on `profiles` that records every change to
`marketing_consent`, `email_newsletter` or `email_festivals` whatever path made it; `set_email_consent(...)` (service role only, idempotent);
`email_festivals` default OFF and existing rows OFF. Rollback: `supabase/rollbacks/20261106090000_email_consent_ledger_rollback.sql`.

Verified on a scratch Postgres 18 built from the real `comm_prefs` and `email_festivals` migrations, seeded with the production counts of
2026-11-06 (30 profiles, festival e-mail 30/0/0 true/false/null, one newsletter opt-in): the migration applies; festival e-mail ends 0/30/0;
the ledger holds exactly the two back-fill rows; no "withdrawn" row is written by the default change; `supabase/tests/email_consent_ledger.test.sql`
passes; the rollback round trip (apply, rollback, leftovers all zero, re-apply, test) passes; 17 of 17 deliberate breaks of the migration turn the
apply or the test red. **Not** verified: the real migration chain, a Supabase branch, any production database, PostgREST behaviour.

## 6. Stages

1. **Database** (this document's migration): ledger, trigger, `set_email_consent`, festival default. Needs approval before it is applied.
2. **Backend:** `/api/native/email-preferences` (read and change, Bearer and cookie auth); `/api/unsubscribe` records through the ledger and
   offers per-type withdrawal; the campaign dispatcher checks the suppression list; the footer gains the postal address and a reason line.
3. **Native app:** Settings, Email (two switches, last changed); onboarding records its consent through the API with the wording version and
   device region. **Not built:** the later "ask once" prompt (it needs a placement decision on Home), and any WhatsApp switch.

## 7. Open items

Founder: apply the migration (after the pre-flight in its header); the postal address text for the footer; confirm the Resend webhook is
registered and the sending domain has SPF and DKIM (the DNS lookup found no Resend DKIM record on `shoonaya.app` or `shoonaya.com`, and the
code's default sender is `shoonaya.app`); decide the stale campaign `9f6e1d9a-3e18-4ba5-9d5b-703cae5f7a46` (status `dispatching` since 2026-10-08,
no dispatches); schedule the festival cron only after consent has been collected.

Lawyer: pre-set switches (we use none); which regions need double opt-in; a postal address in commercial mail; keeping consent proof after
deletion; wording of `eu-uk-v1` and `global-v1`; DPDP consent and notice requirements ahead of May 2027.
