# Shoonaya Compliance & Operational Legal Records

This directory houses the sanitized, machine-auditable operational records, registers, risk assessments, and standard operating procedures for Shoonaya (`Sanatan Sangam/Shoonaya` canonical backend/PWA repository and `shoonaya-mobile` native app).

## Three-Tier Record Architecture

Shoonaya operates a strict three-tier compliance record structure to guarantee legal auditability without exposing confidential attorney-client privilege or personal data:

```text
+-------------------------------------------------------------------------------+
| Tier 1: Sanitized Git Operational Records (This Directory)                   |
| - Path: docs/compliance/ in canonical repository                              |
| - Contents: Sanitized ROPA, vendor registers, DPIAs, SOPs, control matrices.  |
| - Confidentiality: Public / Internal Sanitized (Zero PII, Zero Secrets).      |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| Tier 2: Restricted Confidential Legal Vault (Outside Git)                    |
| - Storage: Access-controlled corporate cloud vault (Google Drive / M365)     |
| - Contents: Executed DPAs, Counsel Advice, Signed Decisions, Incident Logs.   |
| - Vault IDs: Referenced by ID (e.g. VAULT-DPA-SUPABASE-001) in Git records.  |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| Tier 3: Runtime Database Evidence (Supabase Application Storage)             |
| - Storage: Secure, append-only PostgreSQL database tables and provider logs.  |
| - Contents: Terms acceptance timestamps, consent receipts, moderation logs.   |
+-------------------------------------------------------------------------------+
```

## Structure Overview

- `COMPLIANCE_RECORDS_INDEX.md`: Master index and lifecycle tracking for all compliance artifacts.
- `registers/`: Machine-readable and tabular registers (ROPA, Vendors, Transfers, Retention, Legal Versions, Store Declarations).
- `assessments/`: Master DPIA, Children & Age Design, Religious Data, AI & Pramana, and UGC Safety Impact Assessments.
- `procedures/`: Standard operating procedures for Incidents, DSRs, Retention, Moderation, Vendor Review, and Legal Document updates.
- `evidence/`: Engineering control matrices and machine-readable `EVIDENCE_MANIFEST.json`.
- `templates/`: Standard operational intake and reporting templates.

## Non-Negotiable Safety Boundaries

1. **Zero Personal Data**: No production user IDs, emails, IP addresses, coordinates, or tokens in Git.
2. **Zero Secrets**: No API keys, credentials, private certificates, or JWT tokens.
3. **No Fabricated Approvals**: Unapproved policies and legal determinations must remain explicitly marked as `PENDING_DECISION` or `PROPOSED_COUNSEL_REVIEW`.
4. **Deterministic Validation**: All records are validated against CI drift guards via `npm run verify:compliance-engineering`.
