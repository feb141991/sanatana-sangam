# Early hand-over: what the founder and a lawyer need to review (2026-11-04)

Status: **for review. Nothing here is approved. Not legal advice.** The feature is OFF in the code until the founder inserts an age floor
into `sanskara_settings` (`early_handover_min_age`, 10 to 17). Nothing below is live.

Sources: `docs/SANSKARA_HANDOVER_SCOPE.md`, `docs/SANSKARA_TRACKER_AUTHORIZATION_CONTRACT.md` (sections 4, 12, 13),
migration `20261104100000_sanskara_early_handover.sql`, Native `lib/age-guidance.ts`, `src/lib/privacy-content.ts` (policy version 2026-10-12).

## 1. What the feature does, in plain words

A parent or guardian ("manager") who keeps a child's milestones (naming ceremony, first rice, and so on) on a child profile can let the child
take them over **before the child is 18**.

1. A manager starts it. They get a one-time code, shown once, valid 7 days.
2. **Every** manager of that child must agree. One parent cannot override another.
3. The child, in their **own** account, enters the code. Nothing moves yet.
4. The manager who started it sees which account entered the code and confirms it is the child.
5. Only then do the records move to the child's account. **The parents lose all access. It cannot be undone.**
6. Any manager can cancel at any step before step 5.

Safety checks in the database: the feature switch, the age floor and "under 18" are re-checked at every step; adding or removing a manager
resets the approvals; the child's profile date of birth must equal the child's recorded birth date; the child's account must have given
consent for religious data; a wrong, expired or used code always gets the same "not found" answer.

## 2. The four decisions (D-B to D-E) and what I recommend

| # | Question | Recommendation | What it costs you if you choose differently |
|---|---|---|---|
| **D-B** | May the app give under-18s their own timelines, and from what age? The app already allows under-18 accounts (notice only, no age block, no verified parental consent). | Decide the floor only after D-C. 16 is a common starting point for a "teen has a say" product, but that is a product guess, not a legal finding. Until you answer, leave it OFF. | A lower floor raises the consent question (D-C) sharply. No floor = no early hand-over; records wait for 18. |
| **D-C** | Is a child's religious data under the child's own account lawful, and what parental consent is needed? | **Lawyer before switching on.** Questions in section 4. | Do not switch on without it. |
| **D-D** | After the move, do parents keep any view? | **No.** Parents lose access completely, as at 18 (built this way). | A read-only parent view needs a new kind of access the child cannot silently remove, and means "the child owns it" is only partly true. |
| **D-E** | Can it be undone? | **No.** Records move and the child profile is deleted (built this way). The parents' screen says so before they agree. | Undo needs the child profile kept, which keeps data nobody manages. |

## 3. Draft privacy-policy wording (for the lawyer; not published; Drafts A and B revised 2026-11-05)

The public policy today (Children and Sensitive Data section) says younger seekers should use the app with a parent or guardian involved.
It says **nothing** about: family milestone timelines, children's profiles kept by a parent, the hand-over at 18, or the early hand-over.
That gap exists whether or not the early hand-over is switched on, so the first two paragraphs below are needed for the tracker itself.

**Draft A. Milestone timelines (needed now, tracker already exists)**
> You can keep a timeline of milestones for yourself and for a child you look after. For a child you enter a name you choose and a birth
> date. Each milestone has a title, a date and a status, and you can add notes, a place and who performed it. This is religious and family
> information, so we treat it as sensitive and ask for your consent first.
>
> **Who can see it.** You, and any other adult you add as a manager of the child's timeline (they must be in your Kul). A manager can see,
> change, share and delete everything on it. You can also share with members of your own Kul, view only, and stop a share at any time.
> A share never includes notes, place or performer, and it stops if either of you leaves the Kul.
>
> **Reminders** are off until you turn them on, and their text never names the child, the milestone or the date.
>
> **Deleting.** You can delete any milestone at any time. Deleting your account deletes your own timeline. A child's timeline stays with
> its other managers; if you were the only manager, it is deleted.
>
> **Withdrawing consent.** Your own timeline is hidden and deleted after 30 days. A child's timeline is hidden once no manager has given
> consent, but withdrawing does not delete it: it stays until it is deleted or handed over (see below).
>
> **Record of actions.** We keep a short log of sharing, manager changes, hand-overs and deletions (who, what kind and when; never the
> content) for 12 months.

**Draft B. When the child turns 18**
> On the child's 18th birthday the timeline is frozen: nobody can change it, every share ends and reminders stop. For the next 12 months
> the managers can still read it, notes included, so they can hand it over. A manager starts a hand-over and gets a one-time code, shown
> once and valid for 7 days. The person enters the code in their own Shoonaya account, the records move to their own timeline (where they
> already have a record of the same rite, theirs is kept) and the managers lose all access. We hold no contact details for the child, so
> the managers must pass the code on themselves. When the 12 months end, access stops and anything not handed over is deleted.

**Draft C. Early hand-over (only if D-B and D-C allow it)**
> Before 18, a child can take over their own timeline, but only if every adult managing it agrees, the child enters a one-time code in
> their own account, and the manager who started the hand-over confirms it is the child. When the records move, the adults who managed them
> lose access permanently. This cannot be undone. If the child has not taken over within 7 days, the code stops working. We keep a short
> log of the steps (not the contents).

Facts the wording rests on (read from the migrations and the Native app on 2026-11-05; read, not run, and not seen on a device):

1. **Withdrawing consent deletes only a person's own timeline.** `sanskara_job_consent_purge` selects `kind = 'account'`. A child's timeline
   is hidden (`sanskara_can`) but kept. The earlier Draft A said it was deleted after 30 days; that was wrong for a child. **Founder and lawyer
   decision:** should withdrawal also delete a child's timeline? Today it does not.
2. **The app has no screen to delete a whole timeline or to download a copy.** `delete-dependent`, `delete-mine` and `export` exist in the API
   (`src/lib/native-sanskara.ts`), but nothing in the Native app calls them (a search of `app/` and `lib/`). The drafts therefore promise only
   deleting a milestone and deleting the account. Add "delete the whole timeline" and "download a copy" only once a screen offers them. The
   contract (E7) promised an export before the 12 months end, so that is a build gap, not only a wording one.
3. **A former manager can read notes and download a copy** (`sanskara_can`, `former_manager`, contract E7). Draft B says "notes included".
   Whether that is acceptable is question 8 in section 4.
4. **Account deletion:** a child's timeline with no manager left is deleted by a trigger (`sanskara_delete_orphan_dependent`).
5. **Audit log:** sharing, manager changes, claims and deletions only (contract section 7), not every edit. It holds account ids, not content.
6. **"Deleted" means deleted from the live database.** How long the provider's backups keep it is not checked.
7. **Early hand-over rows** (Draft C): there are no "completed" rows, because the confirm step deletes the child profile and the hand-over with
   it. Only cancelled rows persist (account ids, a code hash and timestamps), and they go when the child profile does. The 12-month trail is
   `sanskara_audit`. How long to keep cancelled rows is still the founder's decision (section 6, item 5).

## 4. Questions for the lawyer (D-C)

I can state what the code does; I cannot say what is lawful. Please confirm or correct the following, per place Shoonaya serves.

1. **India (DPDP Act 2023).** My understanding is that a child means under 18 and processing needs verifiable parental consent. Does a
   parent-run child profile satisfy that? Does a child's own account, with parents agreeing inside the app, satisfy it, or is verified
   consent (not just an in-app tap) required? Is religious data treated differently?
2. **UK and EU.** Age of digital consent is 13 to 16 by country. Is parent-agrees-in-app enough for a 13 to 15 year old's own account? Are
   religious beliefs "special category" data needing explicit consent, and from whom?
3. **United States.** COPPA applies under 13. The app says it is not directed to children under 13. Does the early hand-over need a
   different floor (my code allows a floor from 10, so the founder's chosen value matters)? Which states add rules for religious data or minors?
4. **Parent permission.** The app does not verify that a manager is a parent or guardian, and has no verified parental consent system.
   Is "every manager agrees" acceptable evidence, or is the early hand-over blocked until verification exists?
5. **Loss of parental access.** Is it acceptable that parents can never see records again after a move, given a parent's responsibilities
   for a minor? Does D-D need a read-only option?
6. **Wording.** Review drafts A to C, and the confirmation text shown to parents before they agree (Native `lib/sanskaraEarlyHandover.ts`,
   `earlyStartWarning` and `earlyConfirmWarning`).
7. **Retention.** Are 30 days after withdrawal, 12 months for the audit log, and the 12-month former-manager window acceptable?
8. **Access after 18.** For up to 12 months after a child turns 18, the former managers (parents) can read the now-adult's records, notes
   included, and the person is told nothing by us (we hold no contact details for them). Is that acceptable without the adult's own consent?
   Would a shorter window, or hiding notes after 18, be needed? Also: should withdrawing consent delete a child's timeline (section 3, fact 1)?

## 5. What I have not verified

- No lawyer has seen any of this. The age policy in the app (`2026-08-25.parental-guidance-v1`) itself still says legal review is pending.
- The statements about DPDP, GDPR and COPPA above are my understanding, not findings. Treat them as questions.
- The feature has not run on a device or against a real database; the migration is not applied.
- The 3-of-26 finding: only 3 of 26 production profiles have a date of birth, and the child's profile must have one equal to the recorded
  birth date, so most children could not accept a code until they save theirs. Decide whether to keep that check (strong, but blocks many) or
  drop it and rely on the starting manager's confirmation alone (weaker identity check).

## 6. What I need from you

1. D-B: a floor, or "no early hand-over".
2. D-C: send section 4 (and drafts A to C) to a lawyer, or tell me which of these you want rewritten first.
3. D-D and D-E: confirm the built defaults (no parent view, not undoable), or change them.
4. The date-of-birth check: keep or drop.
5. A retention period for finished hand-over rows (suggested 12 months).
6. Whether to publish Draft A and B now. They describe the tracker that already exists, independent of the early hand-over.
