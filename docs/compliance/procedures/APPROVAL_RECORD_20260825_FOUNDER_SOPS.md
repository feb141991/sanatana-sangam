# Legal & Policy Approval Record

**Approval Record ID:** `APPR-20260825-01`
**Subject Matter:** Founder review and approval of six operational SOPs (Security
Incident Response, Data Subject Requests, Retention & Deletion, UGC Moderation
& Appeals, Vendor Onboarding & Review, Legal Document Change) as documented
procedures for current operations.
**Effective Date:** 2026-08-25
**Lead Proposer:** Engineering (this repository's compliance-engineering work)
**Approving Authority:** Founder

---

## 1. Scope

This record covers founder-level approval of the **procedures as written** in:

| SOP Reference | Document |
|---|---|
| `REC-PROC-INC` | `docs/compliance/procedures/DATA_INCIDENT_RESPONSE_PLAN.md` |
| `REC-PROC-DSR` | `docs/compliance/procedures/DATA_SUBJECT_REQUEST_PROCEDURE.md` |
| `REC-PROC-RET` | `docs/compliance/procedures/RETENTION_AND_DELETION_PROCEDURE.md` |
| `REC-PROC-UGC` | `docs/compliance/procedures/UGC_MODERATION_AND_APPEALS_PROCEDURE.md` |
| `REC-PROC-VEND` | `docs/compliance/procedures/VENDOR_ONBOARDING_AND_REVIEW_PROCEDURE.md` |
| `REC-PROC-DOC` | `docs/compliance/procedures/LEGAL_DOCUMENT_CHANGE_PROCEDURE.md` |

This is founder approval of **process**, not a substitute for the separate,
still-open decisions tracked elsewhere:

- Retention **periods** (the actual day/year numbers per category) remain
  `DECISION_REQUIRED` in `docs/compliance/registers/RETENTION_SCHEDULE.json` —
  unaffected by this record.
- The gaps `RETENTION_AND_DELETION_PROCEDURE.md` §3 explicitly lists as **not**
  implemented (Storage object deletion, GA4 deletion calls, CDN/S3
  invalidation, payment-record anonymisation, processor deletion notices,
  full cascade coverage) are **accepted as known, currently-unimplemented
  gaps** by this approval, not represented as closed. Closing them remains
  separate engineering work, tracked as its own item.
- No outside-counsel review is claimed or implied by this record for any of
  the six SOPs.

## 2. Formal Sign-Off

- **Approved by:** Founder
- **Date Approved:** 2026-08-25
- **Vault Archive Reference:** `VAULT-APPR-FOUNDER-SOPS-2026-08-25` (a dated
  confirmation of this approval — e.g. this record plus the founder's own
  note/email — should be filed under this ID in the private legal vault
  described in `docs/ANTIGRAVITY_OPERATIONAL_LEGAL_RECORDS_RUNBOOK.md`; this
  sanitized file is the git-visible half of that record, not a replacement
  for it)
