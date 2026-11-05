# Sanskara tracker: hand-over of a child's records (scope, 2026-11-03)

Status: **Phase 1 database layer written (2026-11-03, migration `20261103110000`, not applied); producer, dispatcher branch and Native banners follow. Early hand-over (section 3): the DATABASE layer is written (2026-11-04, migration `20261104100000`, not applied) and is OFF until the founder inserts an age floor; the route (`/api/native/sanskara/*-early-handover`, 2026-11-04) and the Native card and code entry are written and unit-tested but NOT run on a device; the manager notice (migration `20261104110000`, producer phase, dispatcher check) is written and passes its SQL and unit tests on a scratch database but is NOT applied and NOT seen on a device; privacy-policy wording and the lawyer's review are NOT done (review pack: `docs/SANSKARA_EARLY_HANDOVER_REVIEW_PACK.md`), and D-B to D-E are still the founder's. A manager who has opted in to Sanskara reminders gets one generic push when another manager starts a hand-over; a manager who has not opted in learns of it by opening the child's screen. The manager who started it gets one generic push when the child enters the code (same migration, written 2026-11-05, same status).** Decision D-A is taken: the push requires `wants_sanskara_reminders`, the banner does not. It extends `SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md` (E7, E10, section 13) and
`SANSKARA_TRACKER_BACKEND_DESIGN.md`. Not legal advice.

## 1. What exists today

- At 18 a dependent is frozen (M5 sweep, committed, not applied). Its managers become **former managers** (read-only) for 12 months
  (`birth_date + 18y` to `+ 12 months`, UTC date).
- A former manager calls `sanskara_start_claim` and gets a one-time token (shown once, 7 days or the window end, whichever is sooner; a new
  claim cancels the old). The new adult calls `sanskara_accept_claim(token)`: records move to their own timeline (a rite they already have
  wins; custom milestones all move; 100 records at most), grants end, the dependent is deleted. Every token failure answers the same `SK404`.
- After the window the M5 sweep deletes the dependent. Nothing is kept.
- Native has a hand-over modal (`SanskaraHandoverModal`, modes start/accept, `app/kul/sanskara.tsx`). Not run on a device.

## 2. Gaps at 18 (buildable now, no new policy)

| # | Gap | Consequence |
|---|---|---|
| G1 | Nothing tells a manager the 18th birthday or the window end is coming. | A family that forgets loses the records at window end. |
| G2 | Nothing tells the claim is expiring, or that the window ends soon. | Same. |
| G3 | `accept` returns `dropped_as_duplicates` but the modal ignored it. | A parent's version of a rite would be silently dropped. **Status 2026-11-04:** the case cannot occur yet (production `sanskara_rites` holds only `custom`, and custom milestones always move). The modal now says how many were not added and that the person's own record was kept (Native `acceptResultMessage`, no contract change). Naming the dropped rites would need a new preview function and is deferred until reviewed rites exist (catalogue step 2). |
| G4 | E10: when the last manager leaves, the contract promises "a hand-over to a current Kul member"; it is not built. | The dependent is deleted. |

### Proposed build (Phase 1)
1. **Lifecycle notices to managers**, selected in SQL like `sanskara_reminders_due`, so access is decided by `sanskara_can` and not by TypeScript.
   A new function `sanskara_lifecycle_due(now, horizon, late)` over dependents: D-90, D-30, D-7 and D0 of the 18th birthday ("handover_open"),
   and D-30 and D-7 of the window end ("handover_closing"). Recipients: managers before 18, former managers after. A pending claim suppresses
   the "start a hand-over" prompts and replaces them with an expiry notice.
2. **Own event types and keys** (`sanskara_handover`), not `sanskar_milestone`, so D-7/D-1/D0 keys never overlap the milestone or legacy
   keys (AGENTS 6). Generic text: no child name, no age, no date. Link `/kul/sanskara` only.
3. **Same safety shape as M4**: insert trigger validating subject, role and window at insert; send-time check function; cancel on claim
   accepted, dependent deleted, manager removed, consent withdrawn. The dispatcher gate gains a second branch. This is the bulk of the work.
4. **Opt-in**: reuse `wants_sanskara_reminders`? A hand-over notice is a service notice about data the person holds, but they have not asked
   for it. Recommendation: **require `wants_sanskara_reminders`** and show an in-screen banner (not a push) for everyone else, so the prompt
   never depends on a push permission. Founder decision D-A.
5. **Native**: banner on the dependent card from 90 days out ("Hand over"), a closing banner, the dropped-records list (G3, names of rites only), plus the
   existing modal. No new native module (AGENTS 12 / 7), so it can ship over the air.
6. **E10 (G4)** is a different operation (adding an adult manager to a minor), not a transfer to the child. Scope it separately; it should reuse
   `sanskara_add_manager` rules, not claims.

Size: one migration (selector, trigger, send-time check, rollback), one producer route, dispatcher branch, Native banners, tests with mutations.
ROC pre-flight applies: **new function names only; no signature change to existing functions** (PGRST203).

## 3. Early hand-over (before 18, with parent permission)

Yes, it is a reasonable product idea (a 15-year-old keeping their own milestones). It is **not** a small extension, because it creates the thing
the contract excludes: **a minor with an account of their own** (contract section 4 rule 6 and section 13: "outside v1; the app's minimum age is a
separate decision"). **Correction (2026-11-03):** an earlier version of this section said no age rule exists. The Native app has an age-guidance policy,
`lib/age-guidance.ts` version `2026-08-25.parental-guidance-v1`: accounts under 18 are **allowed without an age block**, with a notice asking for a
parent's or guardian's awareness; the app is not directed to children under 13; **verified parental consent is not implemented**; legal review is
**pending**. So under-18 accounts already exist in the product. What does not exist is any decision about *Sanskara* data for them.

### Blocking decisions (not mine to make)
- **D-B May Sanskara give under-18s their own timelines, and from what age?** (Not "what is the minimum age of an account": the app already allows under-18
  accounts under the guidance policy above.) If the answer is no, there is no early hand-over and a child's records wait for 18. If yes, the answer needs an age
  floor, and it needs a way for a parent's permission to be *verified*, which the app does not have today.
- **D-C Legal.** A child's religious data under their own consent. India (DPDP: under 18 needs verifiable parental consent), UK/EU (age of digital
  consent 13 to 16 by country), US (COPPA under 13). Needs a lawyer before any build, as the contract already says.
- **D-D Who keeps access after the transfer.** (a) Parents lose access completely, as at 18 (simplest, strongest for the child, irreversible for
  parents). (b) Parents keep a read-only view until 18 (needs a new grant kind the child cannot silently remove; then "the child owns it" is
  only partly true). Recommendation: (a), with a clear screen for the parents before they agree.
- **D-E Reversibility.** Records move, the dependent is deleted. A "take it back" needs the dependent to be kept, which keeps data nobody manages.
  Recommendation: not reversible; say so before agreeing.

### Proposed design if D-B to D-E allow it
- **Reuse the claim mechanism with a parental-permission gate; new function names** (`sanskara_start_early_claim`, `sanskara_approve_early_claim`,
  `sanskara_accept_early_claim`). Existing functions unchanged.
- **Permission = every current manager approves.** One parent must not override another. The claim is `awaiting_approval` until all managers approve,
  then the token is released to the initiator. Any manager can cancel at any time before acceptance. A manager removed or leaving resets approvals.
- **Age floor** enforced in SQL from the dependent's birth date (the D-B answer, if it is yes), checked at start and at accept, never from the client.
- **Acceptor confirmation (recommended for the early path, and worth adding at 18 too):** accepting does not move anything; it creates a pending
  acceptance the initiating manager confirms, seeing only the acceptor's chosen display name. Closes "the token was sent to the wrong person",
  which matters more for a child's private notes. Adds one step and one table row.
- **Consent on the child's side:** `consent_religious_data` is the child's own tick, recorded with the date and the age rule in force. Whether that
  alone is lawful is D-C.
- **After transfer** the child's timeline is an ordinary account timeline: owner rules, the 30-day purge on their own consent withdrawal, their own
  reminders and quiet hours. Parents' subscriptions are deleted by the existing access-lost hook.
- **Audit**: metadata only (initiated, approved, accepted, cancelled) with no names, as for the other events.
- **Tests**: every manager approval combination, a manager removed mid-flow, age floor on the day before and the day of, token reuse, wrong
  account, race between cancel and accept.

## 4. Order of work and what each needs from you

1. **Phase 1 (G1 to G3)**: needs D-A only. Can start now.
2. **E10 last-manager offer**: separate small scope; needs a decision on whether the recipient must be a current Kul member only (contract says so).
3. **Phase 2 (early hand-over)**: do not start until D-B, D-C, D-D, D-E are answered and a lawyer has seen it.

Not verified in this scope: Native modal behaviour on a device; production volume (0 dependents on 2026-10-30). Read from `lib/age-guidance.ts` (not from a device): the age policy above.

## 5. Manager notice for an early hand-over (2026-11-04)

- **What:** when a manager starts an early hand-over, each OTHER current manager who has not agreed, has opted in to Sanskara reminders
  (`wants_sanskara_reminders`, decision D-A) and has given consent gets one push per hand-over. Same event type as the other Sanskara notices,
  key space `event_id = hand-over id`, `event_instance = 'Eapproval'` (reminders use `L`, 18-year notices `H`). The text is the existing generic,
  reviewed wording: no child, no relationship, no date. Tap opens `/kul/sanskara` (the child's card opens by itself when a manager has something to do).
- **Where:** selector `sanskara_early_approval_due`, send-time check `sanskara_early_approval_still_valid`, insert validator, cancel triggers (migration
  `20261104110000`, rollback in `supabase/rollbacks/`); producer phase in `/api/cron/sanskara-reminders` (hourly, so up to an hour late); dispatcher
  branch in `/api/cron/notification-dispatch`.
- **Cancelled when:** the hand-over leaves "awaiting approval" or is deleted, that manager agrees or is removed, or the recipient turns off the opt-in,
  withdraws consent or enters account deletion. Restarting a hand-over cancels the old one and notifies once more for the new one.
- **The starter's notice (2026-11-05):** when the child has entered the code (`awaiting_confirmation`), the manager who started the hand-over gets one
  generic push that it is waiting for their confirmation. `event_instance = 'Econfirm'`, audience `starter`, metadata key `confirm_handover_id` (the
  approval notice uses `handover_id`; the dispatcher and the cancel triggers tell them apart by that key). Selector `sanskara_early_confirm_due`, send-time
  check `sanskara_early_confirm_still_valid` (starter only, still awaiting confirmation with a child's code entered, unexpired, feature on, age window,
  opt-in generation, `manage_managers` access). Cancelled when the hand-over leaves `awaiting_confirmation` (cancelled, or a manager change sends it back),
  is deleted (what a confirmed hand-over does), the starter is removed, or the starter opts out, withdraws consent or enters deletion. It names no child
  and not the account that entered the code. No age limit: the hand-over expires by itself after 7 days, so a late notice is still useful.
- **Late-added managers (2026-11-05):** the 24-hour window of the approval notice runs from the later of the hand-over start and the day that manager
  was added (`sanskara_subject_managers.added_at`), so a manager added on day 3 is told; an old hand-over is still never announced to long-standing managers.
- **Known gaps:** a cancelled notice is not offered again for the same hand-over (a spent key); the producer is hourly, so a notice can be up to an
  hour late; a manager who has not opted in learns of it by opening the child's screen.
- **Order of work:** the feature is off until an age floor is set, so none of this does anything yet. Deploy the dispatcher branch before applying the
  migration and turning on the producer, as for the 18-year notices.
