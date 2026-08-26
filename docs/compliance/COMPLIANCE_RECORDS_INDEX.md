# Master Compliance Records Index

This index acts as the centralized control and navigation plane for all sanitized operational and legal compliance records across Shoonaya.

## Records Inventory

| Record ID | Title | Category | Canonical Location | Confidentiality | Owner Role | Approver Role | Status | Effective Date | Review Cadence | Linked Vault ID |
|---|---|---|---|---|---|---|---|---|---|---|
| `REC-ROPA-01` | Record of Processing Activities (Markdown) | Processing Register | `docs/compliance/registers/PROCESSING_ACTIVITIES_REGISTER.md` | `SANITIZED_GIT` | Engineering Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Annual / Change | `VAULT-ROPA-2026-01` |
| `REC-ROPA-02` | Record of Processing Activities (JSON) | Processing Register | `docs/compliance/registers/PROCESSING_ACTIVITIES_REGISTER.json` | `SANITIZED_GIT` | Engineering Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Annual / Change | `VAULT-ROPA-2026-01` |
| `REC-VEND-01` | Third-Party Vendor & Processor Register (MD) | Vendor Management | `docs/compliance/registers/VENDOR_PROCESSOR_REGISTER.md` | `SANITIZED_GIT` | Infrastructure Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Semi-Annual | `VAULT-DPA-INDEX-01` |
| `REC-VEND-02` | Third-Party Vendor & Processor Register (JSON) | Vendor Management | `docs/compliance/registers/VENDOR_PROCESSOR_REGISTER.json` | `SANITIZED_GIT` | Infrastructure Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Semi-Annual | `VAULT-DPA-INDEX-01` |
| `REC-XFER-01` | International Data Transfers Register | Cross-Border Data | `docs/compliance/registers/INTERNATIONAL_TRANSFERS_REGISTER.md` | `SANITIZED_GIT` | Infrastructure Lead | Founder | `DPA_EXECUTED_TIA_UNVERIFIED` (all 8 vendors; per-vendor mechanism specifics not independently confirmed by engineering) | 2026-08-25 | Annual | `VAULT-TIA-INDEX-2026-08-25` |
| `REC-RET-01` | Data Retention Schedule (Markdown) | Data Lifecycle | `docs/compliance/registers/RETENTION_SCHEDULE.md` | `SANITIZED_GIT` | Product Lead | Founder / Counsel | `DECISION_REQUIRED` | 2026-08-25 | Annual | `VAULT-DEC-RET-2026` |
| `REC-RET-02` | Data Retention Schedule (JSON) | Data Lifecycle | `docs/compliance/registers/RETENTION_SCHEDULE.json` | `SANITIZED_GIT` | Product Lead | Founder / Counsel | `DECISION_REQUIRED` | 2026-08-25 | Annual | `VAULT-DEC-RET-2026` |
| `REC-VER-01` | Consent & Legal Document Version Register | Legal Governance | `docs/compliance/registers/CONSENT_AND_LEGAL_VERSION_REGISTER.md` | `SANITIZED_GIT` | Legal Ops / Founder | Outside Privacy Counsel | `DECISION_REQUIRED` | 2026-08-25 | On Legal Update | `VAULT-LEGAL-VER-01` |
| `REC-STORE-01` | App Store & Play Store Declaration Matrix | Store Compliance | `docs/compliance/registers/STORE_DECLARATION_MATRIX.md` | `SANITIZED_GIT` | Mobile Lead | Founder | `SUBMITTED` (both consoles; not independently confirmed row-for-row against live console state) | 2026-08-25 | Pre-Release | `VAULT-STORE-SUB-2026-08-25` |
| `REC-DPIA-01` | Master Data Protection Impact Assessment | Impact Assessment | `docs/compliance/assessments/DATA_PROTECTION_IMPACT_ASSESSMENT.md` | `SANITIZED_GIT` | Engineering Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Annual / Major Arch | `VAULT-DPIA-2026-01` |
| `REC-DPIA-AGE` | Children & Age Design Assessment | Impact Assessment | `docs/compliance/assessments/CHILDREN_AND_AGE_DESIGN_ASSESSMENT.md` | `SANITIZED_GIT` | Product Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Annual | `VAULT-DPIA-AGE-01` |
| `REC-DPIA-REL` | Religious & Spiritual Data Assessment | Impact Assessment | `docs/compliance/assessments/RELIGIOUS_DATA_ASSESSMENT.md` | `SANITIZED_GIT` | Product Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Annual | `VAULT-DPIA-REL-01` |
| `REC-DPIA-AI` | AI & Automated Guidance Assessment | Impact Assessment | `docs/compliance/assessments/AI_AND_AUTOMATED_GUIDANCE_ASSESSMENT.md` | `SANITIZED_GIT` | AI Platform Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Model / Provider Change | `VAULT-DPIA-AI-01` |
| `REC-DPIA-UGC` | UGC & Community Safety Assessment | Impact Assessment | `docs/compliance/assessments/UGC_AND_COMMUNITY_SAFETY_ASSESSMENT.md` | `SANITIZED_GIT` | Trust & Safety Lead | Outside Privacy Counsel | `FACT_VERIFIED` | 2026-08-25 | Semi-Annual | `VAULT-DPIA-UGC-01` |
| `REC-PROC-INC` | Data Incident Response Plan | Security SOP | `docs/compliance/procedures/DATA_INCIDENT_RESPONSE_PLAN.md` | `SANITIZED_GIT` | Security Officer | Founder / Counsel | `FOUNDER_APPROVED` | 2026-08-25 | Annual / Tabletop | `VAULT-APPR-FOUNDER-SOPS-2026-08-25` |
| `REC-PROC-DSR` | Data Subject Request Procedure | Privacy SOP | `docs/compliance/procedures/DATA_SUBJECT_REQUEST_PROCEDURE.md` | `SANITIZED_GIT` | Support Lead | Founder / Counsel | `FOUNDER_APPROVED` | 2026-08-25 | Annual | `VAULT-APPR-FOUNDER-SOPS-2026-08-25` |
| `REC-PROC-RET` | Retention & Deletion Procedure | Lifecycle SOP | `docs/compliance/procedures/RETENTION_AND_DELETION_PROCEDURE.md` | `SANITIZED_GIT` | Engineering Lead | Founder / Counsel | `FOUNDER_APPROVED` (procedure only; §3 gaps open, retention periods separately `DECISION_REQUIRED`) | 2026-08-25 | Annual | `VAULT-APPR-FOUNDER-SOPS-2026-08-25` |
| `REC-PROC-UGC` | UGC Moderation & Appeals Procedure | Trust & Safety SOP | `docs/compliance/procedures/UGC_MODERATION_AND_APPEALS_PROCEDURE.md` | `SANITIZED_GIT` | Trust & Safety Lead | Founder | `FOUNDER_APPROVED` | 2026-08-25 | Semi-Annual | `VAULT-APPR-FOUNDER-SOPS-2026-08-25` |
| `REC-PROC-VEND` | Vendor Onboarding & Review Procedure | Vendor SOP | `docs/compliance/procedures/VENDOR_ONBOARDING_AND_REVIEW_PROCEDURE.md` | `SANITIZED_GIT` | Infrastructure Lead | Founder / Counsel | `FOUNDER_APPROVED` | 2026-08-25 | Annual | `VAULT-APPR-FOUNDER-SOPS-2026-08-25` |
| `REC-PROC-DOC` | Legal Document Change Procedure | Legal SOP | `docs/compliance/procedures/LEGAL_DOCUMENT_CHANGE_PROCEDURE.md` | `SANITIZED_GIT` | Legal Ops | Founder / Counsel | `FOUNDER_APPROVED` | 2026-08-25 | Annual | `VAULT-APPR-FOUNDER-SOPS-2026-08-25` |
| `APPR-20260825-01` | Founder Approval Record — Six Operational SOPs | Approval Record | `docs/compliance/procedures/APPROVAL_RECORD_20260825_FOUNDER_SOPS.md` | `SANITIZED_GIT` | Engineering | Founder | `RECORDED` | 2026-08-25 | N/A | `VAULT-APPR-FOUNDER-SOPS-2026-08-25` |
| `APPR-20260825-02` | Founder Confirmation Record — Vendor DPAs Executed (8 vendors) | Approval Record | `docs/compliance/procedures/APPROVAL_RECORD_20260825_VENDOR_DPAS.md` | `SANITIZED_GIT` | Engineering | Founder | `RECORDED` (self-reported, not independently verified) | 2026-08-25 | N/A | `VAULT-TIA-INDEX-2026-08-25` |
| `APPR-20260825-03` | Founder Confirmation Record — Store Console Declarations Submitted | Approval Record | `docs/compliance/procedures/APPROVAL_RECORD_20260825_STORE_DECLARATIONS.md` | `SANITIZED_GIT` | Engineering | Founder | `RECORDED` (self-reported, not independently verified) | 2026-08-25 | N/A | `VAULT-STORE-SUB-2026-08-25` |
| `REC-EVID-CTRL` | Engineering Control Matrix | Verification | `docs/compliance/evidence/ENGINEERING_CONTROL_MATRIX.md` | `SANITIZED_GIT` | QA / Lead Engineer | Engineering Lead | `FACT_VERIFIED` | 2026-08-25 | CI Build | `VAULT-EVID-CTRL-01` |
| `REC-EVID-MAN` | Evidence Manifest (Checksums) | Verification | `docs/compliance/evidence/EVIDENCE_MANIFEST.json` | `SANITIZED_GIT` | CI Automation | Engineering Lead | `FACT_VERIFIED` | 2026-08-25 | Per Commit | `VAULT-EVID-MAN-01` |

## Review Triggers

1. **Architecture/Feature Changes**: Launch of a new feature collecting new data categories, AI capabilities, or background permissions.
2. **Third-Party Vendor Changes**: Integration of a new SDK, analytics library, payment gateway, or subprocessor.
3. **Regulatory / Market Shifts**: Target launch expansion into new jurisdictions (e.g. UK, EU, US state laws, India DPDP rules enforcement).
4. **Security / Breach Events**: Any data security incident triggering CIRT triage.
5. **Periodic Cadence**: Scheduled annual audit by outside counsel and engineering leadership.
