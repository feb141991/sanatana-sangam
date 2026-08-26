# Legal & Policy Approval Record

**Approval Record ID:** `APPR-20260826-01`
**Subject Matter:** Retention periods for 13 of 14 categories in
`docs/compliance/registers/RETENTION_SCHEDULE.json` / `.md`, as proposed.
**Effective Date:** 2026-08-26
**Lead Proposer:** Engineering (this repository's compliance-engineering work)
**Approving Authority:** Founder

---

## 1. Scope

Approves the proposed retention period for: `RET-01-AUTH`, `RET-02-REL`,
`RET-03-BIRTH`, `RET-04-LOC`, `RET-05-MOOD`, `RET-06-PRAC`, `RET-07-UGC`,
`RET-08-AI`, `RET-09-NOTIF`, `RET-10-ANALYTICS`, `RET-11-MEDIA`,
`RET-13-GUEST`, `RET-14-LOGS` — as documented in the register at the time of
this approval.

**`RET-12-PAY` is explicitly excluded from this approval.** Founder's stated
reason: no premium/payment gate is active yet, so there is no real payment
data this decision currently governs; deferred rather than approved or
rejected. Revisit before any payment/subscription feature ships to
production.

This approval covers **periods only** — it does not itself enable any
automated destructive job. `destructiveJobsEnabled` remains `false` in the
register; building and enabling category-aware deletion automation is
separate engineering work, gated on this approval but not completed by it.

## 2. Formal Sign-Off

- **Approved by:** Founder
- **Date Approved:** 2026-08-26
- **Vault Archive Reference:** `VAULT-APPR-RETENTION-2026-08-26` — a dated
  confirmation of this approval should be filed under this ID in the private
  legal vault; this sanitized file is the git-visible half of that record.
