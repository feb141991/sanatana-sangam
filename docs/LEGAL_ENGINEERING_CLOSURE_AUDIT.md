# Legal Engineering Closure Audit

Generated 2026-08-24 after independently re-running the privacy baseline,
focused tests, repository typechecks and the profile-containment shadow
harness. This is an engineering release assessment, not legal advice or a
store submission.

## Findings

### P0 - Production profiles exposure remains live

The source migration and shadow tests are complete, but production has not
been changed. `npm run baseline:privacy` still reports `profilesAccess.state =
EXPOSED`: an anonymous request could count 16 profile rows while selecting
sensitive columns. Applying the reviewed two-stage migration, verifying live
grants/RLS, preserving logs and obtaining incident/counsel assessment remain
manual gates.

### P1 - Sensitive-profile consent is not an approved contract

The previous default-true Settings value is removed, but there is no approved
purpose/version, withdrawal handling, legacy-record rule or server-enforced
receipt. The code keeps this explicitly `pending_approval`; it does not
fabricate consent for existing users. Sensitive onboarding/profile writes must
not be described as consent-compliant until Prompt 2's decisions are supplied
and enforced.

### P1 - Age policy is implemented as guidance; legal review remains open

The founder approved non-blocking parental guidance on 2026-08-25: Shoonaya is
not directed to children under 13, users under 18 are asked to continue with a
parent or guardian involved, and account creation remains available. The same
versioned wording now appears at active DOB entry surfaces and in Terms and
Privacy content. This does not implement or claim verified parental consent.
Target-market legal review, immutable Terms acceptance, reacceptance rules,
chart-subject handling and legacy-record treatment remain open.

### P1 - Retention enforcement cannot start without approved periods

The lifecycle registry covers the discovered categories and deliberately sets
every retention period to `null` with `destructiveJobsEnabled: false`. The
existing cancellable 30-day account-deletion workflow remains the canonical
full-account path. Category cleanup/anonymization jobs are not authorized.

### P2 - Mandali write safety is materially improved, not a completed operation

Native and PWA post, edit, comment and report writes now use authenticated
backend routes with server-derived identity, payload limits, rate limits,
target validation and block-aware comment enforcement. Public support contact,
moderator staffing/SLA, appeals and a full adversarial cache/pagination audit
remain operational or follow-up work; no App Review approval is claimed.

## Risk Register Status

| Area | Status | Remaining gate |
|---|---|---|
| Reproducible privacy/security inventory | CLOSED BY ENGINEERING | Keep deterministic CI green |
| Profiles base-table exposure | OPEN DEFECT IN PRODUCTION | Apply reviewed migrations; verify metadata/logs; counsel incident assessment |
| Web optional trackers | ENGINEERING COMPLETE / DEPLOYMENT PENDING | Deploy and browser-network QA; counsel reviews categories/copy |
| Native Firebase Analytics | CLOSED BY ENGINEERING | Analytics removed; Firebase Core and FCM retained |
| Religious-profile consent | ENGINEERING COMPLETE / LEGAL DECISION PENDING | Approve purpose/version/withdrawal/legacy rules, then enforce |
| Age and birth-data boundary | PRODUCT POLICY IMPLEMENTED / LEGAL REVIEW PENDING | Validate the non-blocking guidance policy for launch markets; add stronger enforcement only if required |
| Terms/privacy receipts | ENGINEERING COMPLETE / LEGAL DECISION PENDING | Approve document versions/copy/reacceptance, then implement receipts |
| Mandali UGC safety | OPEN FOLLOW-UP | Operational moderation/contact plus broader adversarial verification |
| Data lifecycle registry | ENGINEERING COMPLETE / LEGAL DECISION PENDING | Approve per-category periods and exceptions before jobs |
| Apple/Play evidence | STORE OR OPERATIONAL ACTION PENDING | Re-run prebuild/build, complete console forms and review final binaries |
| Public content provenance | CLOSED BY ENGINEERING FOR VERIFIED ITEMS | Native links to backend-owned source page; unresolved metadata fails closed |
| Compliance drift checks | CLOSED BY ENGINEERING | CI checks facts, not legal conclusions |

## Founder Actions

1. Independently review and explicitly approve the two profile-containment
   migrations before production application.
2. Obtain decisions for religious-data consent, Terms versions and retention
   periods, and obtain launch-market legal review of the founder-approved age
   guidance policy using `docs/COMPLIANCE_DECISION_GATES.md`.
3. Deploy web consent and Mandali API changes, then perform browser/device
   network QA.
4. Complete App Store Privacy and Google Play Data Safety forms from the
   generated engineering evidence; do not copy unresolved assumptions.
5. Define the Mandali support contact, moderation ownership, response target
   and appeals procedure.

## Verification Boundary

Production data was read only through aggregate/schema checks. No production
migration, deletion, notification, paid branch, store submission or legal
policy decision was performed by this remediation.
