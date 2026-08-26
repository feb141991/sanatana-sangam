# Consent and Legal Document Version Register

**Version:** 2026-08-25.v1  
**Status:** `DECISION_REQUIRED` (Document Version Numbers & Checksum Constants Maintained in Code; Formal Ratification Pending)  
**Reference:** `REC-VER-01`

---

## 1. Version Governance Table

| Document / Consent Area | Current Version | Effective Date | Source Code File Reference | Copy SHA-256 Checksum (First 12) | Approver Role | Reacceptance Trigger |
|---|---|---|---|---|---|---|
| **Terms of Service** | `2026-08-25.v1` | 2026-08-25 | `src/lib/terms-content.ts` | `a8f1e29c04d1` | Founder / Counsel | Material change to user rights or liability |
| **Privacy Policy** | `2026-08-25.v1` | 2026-08-25 | `src/lib/privacy-content.ts` | `b73d91f42e88` | Outside Counsel | New data collection category or new vendor |
| **Age Guidance Notice** | `2026-08-25.v1` | 2026-08-25 | `src/lib/compliance/age-guidance.ts` | `9c4b18e77a10` | Founder | Target-market age threshold adjustment |
| **Religious Data Consent** | `2026-08-25.v1` | 2026-08-25 | `src/lib/compliance/policy-config.ts` | `pending_appr` | Outside Counsel | Schema change to special category fields |
| **Web Cookie & Ad Consent** | `2026-08-25.v1` | 2026-08-25 | `src/lib/web-consent.ts` | `5e2a41d90c1f` | Privacy Officer | Adding new tracker or marketing tag |

---

## 2. Legacy User Transition & Reacceptance Policy

1. **No Fabricated Backfill**: Engineering strictly does not backfill synthetic acceptance timestamps for existing users.
2. **Version Tracking Contract**: When an updated Terms or Privacy policy is published, the version constant in `src/lib/compliance/policy-config.ts` is incremented.
3. **Reacceptance Gate**: Upon logging in with an outdated version token, the user is presented with a non-blocking or blocking update modal based on whether the change is classified as administrative (non-blocking) or material (blocking).
