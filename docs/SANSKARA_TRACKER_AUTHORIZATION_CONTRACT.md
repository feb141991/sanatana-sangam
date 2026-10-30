# Sanskara tracker authorization contract — design (pre-migration)

Status: **v0.3. Design only, except that migrations M1 to M4 now exist and, as observed on 2026-10-30, are applied in the live project (see the addendum in `SANSKARA_TRACKER_BACKEND_DESIGN.md`). v0.3 tightened four rules while writing them: see "Amendments in v0.3" at the end of section 13.** Decisions D1 to D5 in section 12 were
**approved as recommended by the founder on 2026-10-29** ("go ahead with D1 to D5 recommendations"). One thing is still
needed from the founder: a named, qualified reviewer for any tradition-scoped timing (D3), without which the tracker ships
with chosen-date milestones and no suggested timing. Written 2026-10-29. Step 3 is in
`SANSKARA_TRACKER_BACKEND_DESIGN.md`.

This is step 1 of five: (1) this contract, (2) a reviewed, tradition-scoped catalogue with optional reminder timing,
(3) the backend record and notification lifecycle, (4) the Native personal and shared views, (5) end-to-end tests. It
decides **who may create, see, change, complete, delete and share a Sanskara record, who may receive its reminders, and
what happens to all of that when relationships change.** It does not decide catalogue content, timing rules, table
layout or screens; where it creates an obligation for those steps it says so.

## 1. Why a contract first

The tracker records religious practice, children's dates and pregnancy. A mistake here is not a bug, it is a disclosure.
The existing implementation has no authorization model beyond "the row's creator", so every question below was
answered by accident. Because production holds no Sanskara data (section 2), the model can be built correctly instead of
patched.

## 2. Verified starting facts (2026-10-29)

Production, read-only (metadata and counts only, no personal data read):

- `user_sanskaras`: **0 rows**. `user_sanskars`: **0 rows**. `sanskars` (a 16-row catalogue, public read): not used by
  any code. Scheduled `sanskar_milestone` notifications: **none**. Nothing to migrate, nothing already exposed.
- `user_sanskaras` carries two uniqueness rules: `UNIQUE (user_id, sanskara_id)` and
  `UNIQUE (user_id, kul_member_id, sanskara_id)`. The first means one account cannot record the same rite for two
  people (two children's Namakarana). `kul_member_id` references `kul_family_members` with `ON DELETE SET NULL`:
  deleting a family-tree person silently turns their record into the recorder's own. The only policy is
  `user_id = auth.uid()`; nothing checks that the tree person belongs to the recorder's Kul.

Kul model (backend main, including the KUL rollout, `73413d7`; Native `e4458a4`):

- A profile belongs to one Kul (`profiles.kul_id`; `auth_kul_id()`, `auth_kul_role()`). A Kul holds at most 6 accounts
  (`kul_member_limit`). `kul_members.role` is `guardian` or `sadhak`: a **Kul administration role**, not guardianship of
  a dependent.
- `kul_family_members` (the family tree) is readable by **every** Kul member (`vamsha_select`) and writable by
  guardians only. It holds names, birth and death dates, birth place and notes. Sensitive Sanskara data must never be
  stored on it.
- A tree person is linked to an account only after that account **accepts an invitation** (migration
  `20261026010000`: `create_family_link_invitation`, `respond_to_family_link_invitation`, `unlink_family_member`).
  The linked account can unlink; removing a member from the Kul clears the link. This is the existing, revocable
  consent primitive.
- Family reminders already have a precedent: `kul-family-remembrance-candidate.ts` uses the candidate pipeline, a
  per-feature opt-in column with a generation counter, and generic localised text that names no one.

The code being replaced (`POST /api/sanskar/schedule`, `POST /api/sanskar/suggest`, `SanskaraClient.tsx`):

- Reminders come from fixed month offsets from a due date (Pumsavana 2 months, Simantonnayana 5, and so on).
- Title and body name the rite and give a date (a lock screen would read "Upcoming Sanskara: Simantonnayana").
- The reminder key includes the event date, so a changed date leaves the old reminder scheduled. Nothing anywhere
  cancels a reminder on completion, edit, deletion or consent withdrawal.
- Gating is the generic `wants_family_notifications` flag, which defaults on.
- `suggest` asks an AI model for the "urgency" of a ritual and is given `tradition` values of hindu, sikh, jain and
  buddhist while the list it works from is the sixteen Hindu samskaras. LLM output is never a source.
- The client catalogue states unsourced claims as fact ("Modern science confirms…", "genetic foundation").

Consent and deletion:

- `profiles.consent_religious_data` exists and is honoured by the AI chat, personalisation and profile routes.
- `user_sanskaras` cascades from `auth.users`. Kul-owned content survives one member's account deletion
  (`src/lib/account-deletion.ts`); a person's Sanskara records are not Kul-owned content.

## 3. Principles

These are fixed. Anything in later sections that conflicts with them is a defect in this contract.

- **P1 Private by default.** A new record is visible only to the people the rules in section 4 name. Nothing is visible
  to a Kul because it exists.
- **P2 One record per person per rite.** There are no "personal" and "Kul" copies. Every view is a projection of the same
  row, so an edit or a revocation is seen everywhere at once.
- **P3 Authority comes from relationships the system verifies**: being the account, managing a dependent, holding a
  grant. Never from a request body, a Kul role, or a family-tree position.
- **P4 Sharing is explicit, named, narrow and revocable.** No share to "the Kul", no link-based share, no re-sharing.
- **P5 Authorization is evaluated at read time and at send time**, by one function, never remembered from an earlier
  moment.
- **P6 Sensitive fields never sit on shared structures** (the tree, a Kul row, a notification payload, analytics).
- **P7 Fail closed.** A failed lookup denies or skips. It is never an empty state, never "allowed" (Native AGENTS.md
  section 18).
- **P8 Minimum disclosure.** Every projection and every notification carries the least that does the job.

## 4. Subjects and who holds authority

A **subject** is the person a timeline is about. There are exactly two kinds in v1.

| Kind | Who it is | Who creates and edits records |
|---|---|---|
| **Account subject** | The account holder. One per account. | Only that account. |
| **Dependent subject** | A minor with no account of their own, managed by one or more accounts. | Its managers (below). |

Rules:

1. **A living adult's records are created and edited only by that adult.** Nobody records a rite for another adult
   (decision D1). An adult who is not in the app is invited to join; their data is theirs from the first entry. This
   removes the creator-versus-owner conflict entirely.
2. **A dependent subject** is created by an account, which becomes its first manager. It requires a birth date (that is
   how majority is determined), may carry a first name or nickname only (no photo, no surname required), and may point
   to a Kul tree person **for display only**. No authority is ever derived from that pointer, so deleting or unlinking
   a tree person changes no access.
3. **Managers** are accounts named in an explicit manager list for that dependent. The creator is the first; a manager
   may add another account that is in their Kul and may remove any manager except the last. A Kul guardian is **not** a
   manager of anyone's child by virtue of the role.
4. **Prenatal rites belong to the pregnant person's own account subject** and are Class A (section 5). The expected due
   date is stored there and nowhere else. When the child is born the parent creates the child's dependent subject and
   birth rites attach to it. A dependent never carries a due date.
5. **Majority.** A dependent becomes an adult at 18 on the civil date in their birth date. A dependent with no birth
   date cannot exist (rule 2). What happens at that moment is event E7 in section 9.
6. A minor with an account of their own is outside v1 (the app's minimum age is a separate decision) and is listed in
   section 13.

## 5. Data classes

| Class | Contents | Rule |
|---|---|---|
| **A, sensitive** | Prenatal records (the whole record), the expected due date, all notes, location and performer fields, and the title of a custom milestone (free text) | Owner or manager only. Never in a Kul projection except a prenatal record's rite name and status by an explicit per-record grant. Due date and notes are never shareable in v1. Never in a notification, analytics event or log. |
| **B, personal** | Rite, planned date, completed date, status for a non-prenatal record | Shareable by grant (section 7). |
| **C, catalogue** | Rite definitions and guidance text | Public. Reviewed content only (step 2). |

Free-text notes are always Class A. A field not listed is Class A until classified.

## 6. Roles and the permission matrix

Roles are **derived** by the single authorization function (section 10), never stored on the record and never supplied
by a client.

- **Owner**: the account of an account subject.
- **Manager**: an account in a dependent's manager list, while the subject is a minor.
- **Viewer**: an account holding a current, valid grant (section 7).
- **Former manager**: a manager of a dependent who has since turned 18, for the limited window in E7 only. Read-only
  access to the Class B and Class A records they managed, plus starting the hand-over claim, and nothing else; they cannot
  grant, edit or subscribe.
- **Nobody**: everyone else, including every other Kul member, every Kul guardian, and the service role acting without
  the authorization function.

| Action | Owner | Manager | Viewer | Everyone else |
|---|---|---|---|---|
| Know a record exists | yes | yes | only those granted | **no** (no counts, no placeholders). A former manager is read-only (E7). |
| Read Class B | yes | yes | granted fields only | no |
| Read Class A | yes | yes | **no** | no |
| Create or edit | yes | yes | no | no |
| Mark complete or reopen | yes | yes | no | no |
| Delete a record | yes | yes | no | no |
| Create, change or stop their own reminder | yes | yes | yes (own reminder only; section 8) | no |
| Grant or revoke view access | yes | yes (any manager; a revoke by any manager stands) | no (no re-share) | no |
| Add or remove a manager | n/a | yes | no | no |
| Start a majority claim for a dependent | n/a | only as a former manager, once the dependent has turned 18 (a claim can be accepted only from the birthday) | no | no |
| Export own data | yes | yes (for the dependent) | no | no |
| Read the list of who can see a record | yes | yes | no | no |
| Erase a dependent (the subject and everything about them) | n/a | yes (any current manager; not a former manager) | no | no |

## 7. Sharing

A **grant** names one grantee account, one subject, a scope and a level.

- **Level**: `view` only in v1. There is no delegated editing; a second parent is a manager, not a viewer.
- **Scope**: `record` (one rite) or `timeline` (every Class B record of the subject, present and future). A `timeline`
  grant **never** includes Class A; a prenatal record needs its own `record` grant.
- **Audience boundary**: the grantee must be a member of the same Kul as the sharer, **at grant time and at every
  read**. A grant while that is false is void, not deleted; it revives only if the membership does.
- **Granter authority**: a grant is also void while the person who made it no longer holds authority over the subject (a
  manager who was removed, or a manager of a child who has turned 18). It revives only if that authority does.
- **No re-share**, no public or token link, no "everyone in my Kul". The limit of a 6-account Kul bounds the audience.
- **Transparency**: the owner or manager can always list who can see what. A grantee sees who shared it.
- **Revocation** takes effect at the next read and stops the grantee's reminders in the same transaction (event E1).
- **Audit**: grants, revocations, manager changes, claims and deletions write a metadata-only audit row (who, what,
  when; never record content), retained 12 months (to be confirmed in the privacy policy).

## 8. Reminders: who may receive them, and what they may say

A reminder exists only as a **subscription**: one account, one record, a lead time and a channel. There is no reminder
that exists because a date was entered (this is the decision to drop the automatic schedule).

1. **Eligibility is checked at creation and again at send time** with the same function as reads. A subscriber who has
   lost access receives nothing.
2. **Opt-in is per feature and per account.** A new column, `wants_sanskara_reminders`, defaults to **false** and is
   separate from `wants_family_notifications` (Native AGENTS.md section 19: a blanket default is not consent). The
   account's `consent_religious_data` must also be true. OS permission, quiet hours and timezone are the
   **recipient's**, taken from their own profile.
3. **Class A records generate reminders only for the owner or a manager**, never for a viewer.
4. **Text is discreet.** Title and body carry no rite name, no person's name, no date, no relationship, no pregnancy or
   due-date wording. The push `data` carries an opaque subscription id and a route, nothing else. Example (English):
   "A family date is coming up. Open Shoonaya to see it." Hindi and Punjabi need native-speaker review before use.
   Timing is always described as guidance, never as a religious rule (step 2 owns the wording).
5. **Completing a record cancels every subscriber's pending reminders for it.** Reopening does not revive them; each
   subscriber re-enables theirs.
6. **Changing or removing a date updates or cancels reminders in place.** The notification pipeline keys every
   notification by its send date, so the guarantee is stated on the reminder, not on the key: **at most one live
   reminder per (subscription, lead time)**, enforced by a partial unique index and an atomic supersede (cancel the
   pending one, create the new one, in one transaction). A retry or an edit therefore cannot produce a second
   notification. The key namespace (`sanskar_milestone:...`) does not overlap the legacy `sanskar:` keys (backend
   AGENTS.md section 6).
7. **Only reviewed timing may generate a lead time.** A rite without reviewed, tradition-scoped timing can still be
   tracked and can carry a reminder at a date the person chose; the app never proposes a date for it (step 2).
8. In-app notification creation and OS push delivery stay distinct, and nothing here claims delivery from a token or a
   provider ticket (backend AGENTS.md section 6).

## 9. What happens when a relationship changes

Every row is a requirement on step 3 and a test in step 5.

| # | Event | Access | Data | Reminders |
|---|---|---|---|---|
| E1 | Owner or manager revokes a grant | Grantee loses read immediately | Unchanged | Grantee's subscriptions for it cancelled in the same transaction |
| E2 | Grantee leaves the Kul or is removed | All grants to them from that Kul are void | Unchanged | Their subscriptions cancelled |
| E3 | Sharer leaves or changes Kul | Every grant they made is void | Unchanged | Grantees' subscriptions cancelled |
| E4 | Record completed | Unchanged | Status complete | All pending reminders for the record cancelled |
| E5 | Date changed or removed | Viewers see the new value | Updated in place | Recomputed or cancelled in place; no new keys |
| E6 | Manager added or removed | Immediate | Unchanged | Removed manager's subscriptions cancelled; the last manager cannot be removed |
| E7 | Dependent reaches 18 | Managers become **former managers**: read-only, for at most 12 months, with an export offered before it ends; every share they made ends (the granter no longer holds authority) | Frozen. If never claimed, deleted when the window ends | All reminders stop |
| E7a | The new adult claims their records | Ownership moves to their account subject; ex-managers lose access unless the new owner shares | Claimed records move; **their own existing record wins any conflict**; nothing is merged automatically | None until they subscribe |
| E8 | Owner sets `consent_religious_data` to false | Shares suspended; hidden from others | Retained inert, owner can export or delete; purged after 30 days unless consent returns (D5) | All suspended |
| E9 | Owner deletes their account | All their grants and subscriptions deleted | Owned records deleted; a dependent with another manager stays with them, with none it is deleted | Cancelled |
| E10 | A manager deletes their account or leaves | Their access ends | A dependent with another manager stays. If they were the last, the flow offers a hand-over to a current Kul member; otherwise the dependent is deleted (deletion over disclosure) | Their subscriptions cancelled |
| E11 | A tree person is deleted, edited or unlinked | **No effect** (authority never comes from the tree) | None | None |
| E12 | Timezone or city changes | None | None | Recomputed from civil dates in the recipient's timezone |
| E13 | Grantee device offline during a revoke | Cached shared data is display-only and marked stale; any action re-checks the server | Cleared at next successful sync, and on sign-out or account switch | Server-side cancel already done |
| E14 | A grantee's account is deleted | Their grants end | None | Their subscriptions deleted |

## 10. Enforcement requirements

- **R1 One authorization function**, `sanskara_can(action, subject, account, record)`, used by every read and write
  function, by the notification producer and the send-time check, and by API routes. A second implementation anywhere
  is a defect.
- **R2 Row-level security enabled and forced on every table; no direct table writes for `authenticated`.** Writes go
  through functions that are atomic and idempotent (the client supplies an idempotency key), with database constraints
  carrying the rules (one record per subject per rite; one manager list entry per account; grant uniqueness), not only
  application checks (backend AGENTS.md section 4).
- **R3 Identity is derived server-side** from the session; a request-body user id is never trusted. Routes serving
  Native support Bearer and cookie auth through the established helper.
- **R4 Reads of someone else's data use a projection function** that returns only permitted fields. Nothing selects the
  base table on behalf of a non-owner.
- **R5 The service role never bypasses R1.** Cron, resolver and admin code call the function; a guard test fails if a
  route reads these tables with the service role without it. The admin account-delete list includes the new tables.
- **R6 No Sanskara data reaches an LLM.** `/api/sanskar/suggest` is retired by step 3; AI chat does not read these tables.
- **R7 Native caches are encrypted at rest** (family and health content), keyed by account, cleared on sign-out and
  account switch, and never authorize a mutation (Native AGENTS.md section 5).
- **R8 Every failure is a safe outcome**: deny, skip, or a retryable error state (Native AGENTS.md section 18).
- **R9 Migrations** need RLS and privilege review, rollback guidance, regenerated types and an applied/unapplied report,
  tested on a shadow branch, never `supabase db push`.

## 11. Test obligations (inherited by step 5)

Each is written first, and shown red against the old behaviour where there is one.

- Two accounts in one Kul: a non-grantee sees nothing, not even a count; a grantee sees exactly the granted fields; a
  Kul guardian sees nothing by role.
- Revocation: immediate for reads; the grantee's pending reminder is gone; a cached copy is cleared and never used to
  act.
- Membership change (E2, E3) and sign-out or account switch (E13).
- Majority (E7, E7a), including the claimant's own record winning a conflict.
- Completion, edit and delete each cancel or move reminders in place (E4, E5); a retried request, a changed date and a
  duplicate delivery each leave at most one live reminder per (subscription, lead time).
- A privacy test over every notification payload and analytics event: no name, rite, date or pregnancy wording.
- Consent withdrawal (E8) and account deletion for owner, manager, last manager and grantee (E9, E10, E14), end to end
  including the admin delete path.
- SQL tests under `supabase/tests` for the function and the policies; mutation checks that break each rule and go red.

## 12. Decisions (approved as recommended, 2026-10-29)

All five were approved as recommended. D3 is approved in the form "ship without suggested timing"; the reviewer is still
to be named before any reviewed timing is added.

| # | Question | Recommendation | If you choose otherwise |
|---|---|---|---|
| **D1** | May anyone record a rite for a living adult who is not them? | **No** (section 4, rule 1). Invite them; their data starts as theirs. | "Creator-private" records about unlinked adults: needs a transfer-on-link flow and answers for duplicates; I would not build it in v1. |
| **D2** | Any Kul-wide visibility in v1? | **None.** Sharing is per grant, to named members. | A default timeline share to the whole Kul would break P4; if wanted, it must be an explicit toggle per subject that excludes Class A. |
| **D3** | Who is the qualified reviewer for tradition-scoped catalogue and timing, and which traditions ship first? | Needs a **named reviewer from you**; I cannot supply one. Until reviewed, ship the tracker with chosen-date milestones and no suggested timing. Sikh, Jain and Buddhist life-cycle ceremonies are separate catalogues, not the sixteen Hindu samskaras. | Shipping the sixteen as-is to every tradition repeats the current defect. |
| **D4** | Reminder defaults | **Off**, opt-in per account (`wants_sanskara_reminders`), discreet generic text, nothing for Class A to viewers. | Reusing `wants_family_notifications` would make a default-on flag the consent for pregnancy-adjacent pushes. |
| **D5** | Majority and retention | Majority at **18**. Former managers keep read-only access until the person claims, and for at most **12 months**, with an export offered; unclaimed records are then deleted. After consent withdrawal, purge after **30 days**. Audit rows kept **12 months**. | A shorter or longer window is a policy choice; it must then be stated in the privacy policy. |

## 13. Out of scope and open risks

- **Legal review.** Religion, pregnancy and children's data are regulated in the places Shoonaya serves (for example
  India, the UK, the EU and several US states). The design (parent-managed dependents, no child account data, no
  profile photo, per-feature opt-in) is meant to be compatible, but this is not legal advice and it **needs a lawyer's
  review before launch**, including the privacy-policy lines for retention, the audit log and deletion.
- **Minors with their own account**, the app's minimum age, and a person who belongs to more than one Kul.
- **Catalogue content, timing rules, translations and the retirement of the AI suggestion route** are step 2 and 3.
- **Table layout, function bodies, the resolver integration and migrations** are step 3. This contract does not fix them,
  only the rules they must enforce.
- **Hindi and Punjabi notification wording** needs native-speaker review (backend notification copy precedent).
- **Amendments in v0.3** (2026-10-29, from writing M1 and M2; each denies more and none grants more): the title of a
  custom milestone is Class A, because it is free text and an unclassified field is Class A (section 5), so a timeline
  grant never covers one; a current manager may erase a dependent (section 6), which the first version left impossible
  without leaving the child's name and birth date behind; a share is void once its granter loses authority (section 7,
  E7), which also ends a parent's shares when the child turns 18; consent to religious data is required of the acting
  account as well as of the subject's side, except to export or erase (section 8, rule 2).
- A former manager (not the manager of a minor) starts the hand-over claim, and a grantee may end a share made to them
  (v0.3, from writing M3; the first narrows who may start a claim, the second only removes access).
- Nothing in this document has been run on a device or against a Supabase database; M1 to M3 were run on a scratch
  Postgres only.
