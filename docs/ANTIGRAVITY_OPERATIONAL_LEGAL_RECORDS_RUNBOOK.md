# Antigravity Runbook: Shoonaya Operational and Legal Records

## Execution instruction

Execute this runbook sequentially. Do not skip a phase, merge phases, or turn
an unresolved decision into an approved policy. Stop at every review gate and
report findings before continuing. This work produces auditable operational
records and evidence; it does not provide legal advice or claim legal
compliance.

Read first:

- `AGENTS.md`
- `SHOONAYA_WORKFLOW.md`
- `SHOONAYA_RULES.md`
- `docs/LEGAL_RISK_ASSESSMENT.md`
- `docs/PRIVACY_SECURITY_BASELINE.md`
- `docs/PRIVACY_SECURITY_BASELINE.json`
- `docs/COMPLIANCE_DECISION_GATES.md`
- `docs/LEGAL_ENGINEERING_CLOSURE_AUDIT.md`
- `docs/DATA_LIFECYCLE_REGISTRY.json`
- `docs/UGC_SAFETY_ENGINEERING_EVIDENCE.md`
- Native: `docs/STORE_PRIVACY_EVIDENCE.md`

Audit both repositories:

- Canonical backend/PWA: `/Users/Business(C)/Sanatan Sangam/Shoonaya`
- Native: `/Users/Business(C)/shoonaya-mobile`

The backend/PWA repository owns the canonical compliance-record contracts.
Native contributes evidence and store disclosures but must not maintain a
second manually edited compliance catalogue.

## Non-negotiable safety boundary

Never commit or print:

- production personal data, user IDs, emails, names, IP addresses, precise
  locations, dates of birth, prompts, reflections, posts or push tokens;
- API keys, service-account JSON, `.p8` files, certificates, passwords,
  cookies, JWTs, database URLs containing credentials or environment values;
- signed contracts, vendor invoices, identity documents, counsel advice,
  litigation strategy, privileged correspondence or handwritten signatures;
- screenshots containing personal data or secret-bearing dashboards;
- raw production logs or database exports.

Use aggregate counts and schema metadata only. Redact samples. Do not query
production row contents for this task. Do not apply migrations, deploy, send
notifications, change vendor configuration or trigger destructive jobs.

## Where records must live

### 1. Sanitized, version-controlled operational records

Create and maintain these in the canonical repository:

```text
docs/compliance/
  README.md
  COMPLIANCE_RECORDS_INDEX.md
  registers/
    PROCESSING_ACTIVITIES_REGISTER.md
    PROCESSING_ACTIVITIES_REGISTER.json
    VENDOR_PROCESSOR_REGISTER.md
    VENDOR_PROCESSOR_REGISTER.json
    INTERNATIONAL_TRANSFERS_REGISTER.md
    RETENTION_SCHEDULE.md
    RETENTION_SCHEDULE.json
    CONSENT_AND_LEGAL_VERSION_REGISTER.md
    STORE_DECLARATION_MATRIX.md
  assessments/
    DATA_PROTECTION_IMPACT_ASSESSMENT.md
    CHILDREN_AND_AGE_DESIGN_ASSESSMENT.md
    RELIGIOUS_DATA_ASSESSMENT.md
    AI_AND_AUTOMATED_GUIDANCE_ASSESSMENT.md
    UGC_AND_COMMUNITY_SAFETY_ASSESSMENT.md
  procedures/
    DATA_INCIDENT_RESPONSE_PLAN.md
    DATA_SUBJECT_REQUEST_PROCEDURE.md
    RETENTION_AND_DELETION_PROCEDURE.md
    UGC_MODERATION_AND_APPEALS_PROCEDURE.md
    VENDOR_ONBOARDING_AND_REVIEW_PROCEDURE.md
    LEGAL_DOCUMENT_CHANGE_PROCEDURE.md
  evidence/
    EVIDENCE_MANIFEST.json
    ENGINEERING_CONTROL_MATRIX.md
  templates/
    INCIDENT_RECORD_TEMPLATE.md
    DATA_SUBJECT_REQUEST_TEMPLATE.md
    VENDOR_REVIEW_TEMPLATE.md
    LEGAL_APPROVAL_RECORD_TEMPLATE.md
```

Only sanitized facts, roles, processes, decisions, document IDs and links may
be stored here. These files may reference a confidential document by ID, for
example `DPA-SUPABASE-001`, but must not contain the confidential document.

### 2. Confidential legal vault outside Git

Recommend and document this restricted structure in the founder's chosen
private business storage, such as Google Drive, SharePoint or another
access-controlled document system:

```text
Shoonaya Legal & Compliance/
  01 Corporate and registrations/
  02 Counsel advice and approvals/
  03 Signed vendor DPAs and contracts/
  04 International transfer documents/
  05 DPIA approvals and signed decisions/
  06 Incidents and regulator correspondence/
  07 Store submissions and regulator filings/
  08 Historical policy versions/
```

Requirements:

- least-privilege access;
- MFA for every member;
- named access, no public links;
- access review at least quarterly;
- version history enabled;
- confidential document IDs matching the sanitized Git index;
- backup and recovery ownership recorded;
- counsel advice kept separate from general operational records.

Do not create or upload confidential documents during this runbook. Add
placeholders such as `VAULT-DPA-SUPABASE-001: missing` to the sanitized index.

### 3. Runtime evidence in Supabase and provider consoles

User-specific evidence belongs in secure, append-only application storage,
not Markdown:

- Terms and Privacy acceptance receipts;
- versioned sensitive/religious-data consent and withdrawal receipts;
- deletion requests and cancellation/completion audit events;
- moderation actions and appeals;
- notification preferences and delivery records;
- security and administrative audit events.

Store-submission answers remain canonical in App Store Connect and Google Play
Console. Keep only a sanitized dated snapshot and evidence checklist in Git.
Never duplicate provider credentials in the record set.

---

## Phase 0: Establish reproducible ground truth

### Objective

Generate a factual inventory from code, schemas, migrations, manifests,
configuration and package lockfiles before drafting policy records.

### Required audit

Trace these categories across both repositories:

1. account and authentication data;
2. profile and religious/spiritual data;
3. DOB, birth time/place, Jyotish and family/Kul data;
4. current and foreground location;
5. mood, journal, reflections and sankalpa;
6. Japa, Panchang, practice, quiz and progress history;
7. Mandali/community content and safety actions;
8. AI prompts, generated content, RAG retrieval and TTS;
9. notifications, device tokens and delivery receipts;
10. analytics, diagnostics, cookies and advertising;
11. uploads, profile images, share cards and media;
12. payments, subscriptions and store purchases;
13. guest-mode and unauthenticated records;
14. logs, backups, cron/workflow state and administrator access.

For each category print, from a committed one-command script:

- collection surface;
- API route and authentication mode;
- storage table/bucket/provider;
- fields or data-class names, never row contents;
- purpose visible in code;
- recipients/vendors;
- deletion path;
- existing retention rule or `PENDING_DECISION`;
- web/native ownership;
- evidence file and line references;
- confidence: `VERIFIED`, `PARTIAL`, `NOT_FOUND`, `DECISION_REQUIRED`.

Extend the existing deterministic privacy baseline instead of creating a
parallel scanner. Every count in the report must be emitted by the script.

### Verification

- baseline runs twice with byte-identical JSON output;
- no secret or PII pattern appears in generated files;
- both repository HEADs and dirty states are recorded;
- every included vendor is proven from package/config/runtime code;
- every claimed deletion path is traced end to end.

### Stop gate

Stop and present the generated inventory, drift and unknowns. Do not draft
records until the inventory receives independent review.

---

## Phase 1: Create the records index and ownership model

### Objective

Create `docs/compliance/README.md` and
`docs/compliance/COMPLIANCE_RECORDS_INDEX.md` as the navigation and control
plane for all records.

Every record index entry must include:

- record ID;
- title and category;
- canonical location;
- confidentiality: `SANITIZED_GIT`, `CONFIDENTIAL_VAULT`, or
  `RUNTIME_SYSTEM`;
- owner role and backup owner role;
- approver role;
- status: `DRAFT`, `FACT_VERIFIED`, `DECISION_REQUIRED`, `COUNSEL_REVIEW`,
  `APPROVED`, `SUPERSEDED`, or `RETIRED`;
- effective date and next review date;
- linked system/vendor;
- related code evidence;
- linked confidential vault IDs, never vault contents;
- change trigger;
- last evidence refresh commit.

No founder/counsel name may be invented. Use role placeholders where the
owner is not explicitly documented.

### Stop gate

Stop if any record has no owner, no review trigger or no source evidence.

---

## Phase 2: Build the processing activities register (ROPA)

### Objective

Create both Markdown and machine-readable JSON processing registers from the
Phase 0 inventory.

For every processing activity include:

- processing ID and feature;
- data subjects: account holder, guest, family member, community member,
  minor/younger user where applicable;
- data categories;
- special/sensitive category indicator;
- purpose;
- proposed Article 6 lawful basis and, for UK special-category data, proposed
  Article 9 condition;
- decision status and approving authority;
- collection source;
- mandatory vs optional;
- internal access roles;
- processors/recipients;
- international transfer flag;
- storage location;
- retention link;
- deletion and export paths;
- security controls;
- linked DPIA risk;
- web/native/guest applicability;
- evidence references.

Engineering may mark a basis `PROPOSED_COUNSEL_REVIEW`; it must never mark a
lawful basis approved without a recorded decision ID.

Validate JSON against a committed schema and fail CI for missing fields,
duplicate IDs, unknown vendors or `APPROVED` entries without approval IDs.

---

## Phase 3: Build the vendor and transfer registers

### Objective

Create vendor and international-transfer records for every proven third party,
including at minimum Supabase, Vercel, Expo/EAS, Firebase/FCM, Apple, Google
authentication/Play services, map/geocoding providers, email/push delivery,
payment providers, YouTube/external media, analytics and every active AI/TTS
provider.

For each vendor record:

- vendor ID and legal entity, if verified;
- feature and data categories received;
- controller/processor role: `PROPOSED`, `VERIFIED_CONTRACT`, or
  `COUNSEL_REVIEW`;
- service and storage regions, or `UNKNOWN`;
- subprocessor-list URL;
- privacy/security/DPA URLs;
- contract/DPA vault ID and status;
- transfer mechanism and transfer-risk-assessment ID;
- retention/deletion capability;
- breach-notification contact/process;
- security attestations only when sourced;
- owner, review cadence and exit plan;
- code evidence proving current use.

Do not infer regions from company headquarters. Do not claim an executed DPA
from a public DPA URL. Mark missing signed agreements and transfer assessments
as actions.

---

## Phase 4: Draft the DPIA and specialist assessments

### Objective

Create one master DPIA plus focused assessments for children, religious data,
AI, and UGC/community features.

The master DPIA must cover:

- scope and system boundaries;
- necessity and proportionality;
- data flows and recipients;
- risk scoring method;
- risks to individuals, not merely risks to Shoonaya;
- existing controls proven in code;
- missing controls;
- residual risk;
- owner and deadline;
- consultation/approval requirement;
- launch blocker classification;
- reassessment triggers.

Minimum risk scenarios:

- anonymous or cross-user exposure of sensitive profiles;
- religious profiling without a valid condition or valid withdrawal;
- younger users providing DOB, location, family or community data;
- family-member data entered without their awareness;
- precise-location or nearby-seeker exposure;
- mood/reflection or AI prompt leakage;
- fabricated or unsafe spiritual AI guidance;
- Mandali harassment, impersonation, grooming, scraping or blocked-user leaks;
- stale caches crossing accounts;
- excessive retention and incomplete deletion;
- vendor breach or international-transfer failure;
- push notifications exposing sensitive religious practice on a lock screen;
- administrator misuse and insufficient audit logging.

Do not assign `LOW` residual risk merely because a policy promises something.
Controls require code, configuration or operational evidence.

---

## Phase 5: Establish retention and deletion governance

### Objective

Convert `docs/DATA_LIFECYCLE_REGISTRY.json` into a decision-ready retention
schedule without inventing periods.

For each data category include:

- purpose;
- active-use retention;
- account-deletion behavior;
- backup/log retention;
- legal/security exception;
- anonymization option;
- deletion mechanism and owner;
- user export inclusion;
- guest-data handling;
- current implementation status;
- proposed period;
- approval status and decision ID;
- evidence and test coverage.

All unknown periods remain `PENDING_DECISION`. No destructive job may be
enabled. Provide a founder/counsel decision table listing concrete options and
tradeoffs, but do not choose an option.

The retention procedure must explain holds, failed deletions, backups,
processor deletions, audit evidence and periodic review.

---

## Phase 6: Consent, Terms and Privacy version governance

### Objective

Create the register and procedure needed for versioned legal documents and
consent without implementing fake historical receipts.

Record separately:

- Terms version;
- Privacy version;
- age-guidance version;
- religious/sensitive-data purpose and consent version;
- cookies/analytics/advertising/push consent versions;
- effective date;
- approved copy checksum;
- approver and approval vault ID;
- affected platforms/regions;
- acceptance or consent event schema;
- withdrawal behavior;
- reacceptance trigger;
- legacy-user treatment;
- current implementation state.

The founder-approved non-blocking age-guidance policy must remain described as
guidance pending launch-market legal review. It must not be relabelled
verified parental consent.

Do not create or backfill acceptance/consent rows in this runbook. Produce a
separate engineering proposal only if the required versions and approval IDs
are supplied.

---

## Phase 7: Operational procedures

### Data incident response

Define detection, triage, containment, evidence preservation, processor
notification, severity, legal escalation, user/regulator decision ownership,
recovery, post-incident review and a tabletop-test schedule. Use role names,
not invented individuals or statutory deadlines unless sourced and approved.

### Data subject requests

Document identity verification, access/export, correction, deletion,
restriction/objection, withdrawal, family-member disputes, appeal, secure
delivery, audit evidence and escalation.

### UGC moderation and appeals

Document report intake, urgent harm, child safety, harassment, impersonation,
privacy violations, evidence minimization, moderator access, action choices,
appeals, repeat abuse and transparency metrics. Trace the real in-app report,
block, mute and hide controls. Missing staffed owners or monitored contacts
remain launch actions.

### Vendor review

Define due diligence before onboarding, DPA/transfer review, SDK data audit,
security incident handling, annual review and offboarding/deletion evidence.

---

## Phase 8: Store declaration and public-policy matrix

### Objective

Create a field-by-field evidence matrix for Apple App Privacy and Google Play
Data Safety using the final Native dependency graph and runtime paths.

For each declared data type include:

- collected or not collected;
- linked to identity;
- tracking status;
- purpose;
- optional/required;
- retained off-device;
- third-party recipient;
- collection surface;
- permission;
- privacy-manifest/config evidence;
- policy-page paragraph;
- Apple field mapping;
- Google Play field mapping;
- last verified binary/build ID.

Do not submit console answers. Mark the matrix `DRAFT_FOR_FOUNDER_REVIEW` and
list every answer requiring manual App Store Connect or Play Console action.

---

## Phase 9: Evidence manifest and CI drift guard

### Objective

Create `docs/compliance/evidence/EVIDENCE_MANIFEST.json` with checksums and
source paths for every sanitized record, then extend the existing compliance
verification script.

CI must fail for factual drift such as:

- a new vendor/SDK without a vendor-register entry;
- a new sensitive data field or collection route absent from the ROPA;
- a new DOB/location/UGC/AI surface absent from the DPIA;
- retention marked approved without a decision ID;
- legal copy changed without a new version/checksum;
- store matrix older than the current Native lockfile/build configuration;
- `APPROVED` records without approver role, date and vault evidence ID;
- secrets, PII-like samples or signed-document patterns in
  `docs/compliance/`;
- confidential-vault material committed to Git.

The guard must not claim legal compliance. It verifies record completeness and
drift only.

---

## Required final verification

Run and report exact results:

```bash
npm run baseline:privacy
npm run verify:compliance-engineering
npx tsc --noEmit
npm run build
git diff --check
git status --short
```

Run the Native typecheck and relevant tests from the Native repository. Run
`graphify update .` after code/script changes. Report passed, failed and
skipped counts separately.

Perform a secret/PII scan over every generated compliance artifact. Print
only aggregate findings, never matched secret values.

## Required final report

Report:

1. every file created or modified;
2. exact generated counts and their one-command source;
3. every unresolved founder decision;
4. every item requiring counsel;
5. every missing confidential-vault document ID;
6. every operational owner still unassigned;
7. every store-console action;
8. current status by record: factual, decision-ready, counsel-reviewed,
   approved or blocked;
9. proof that no production data, migrations, deployments, notifications or
   destructive jobs were touched;
10. unrelated pre-existing working-tree changes that were preserved.

Do not commit or push until independently reviewed. When approved, use scoped
commits containing only this runbook's files.
