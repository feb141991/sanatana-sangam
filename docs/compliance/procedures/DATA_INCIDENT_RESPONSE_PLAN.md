# Data Incident & Breach Response Plan

**SOP Reference:** `REC-PROC-INC`  
**Owner:** Security Officer / Engineering Lead  
**Intended Approver:** Founder; outside privacy counsel where required  
**Status:** `FOUNDER_APPROVED` (2026-08-25, see `APPR-20260825-01`)

---

## 1. Purpose & Incident Scope

This plan establishes the operational steps for detecting, triaging, containing, investigating, and reporting potential or confirmed security incidents involving personal or sensitive data.

## 2. Cyber Incident Response Team (CIRT)

- **Incident Commander**: Engineering Lead
- **Technical Lead**: Infrastructure Lead / Backend Engineer
- **Communications Lead**: Product Lead / Support Lead
- **Legal & Regulatory Counsel**: Outside Privacy Counsel

## 3. Incident Response Lifecycle (6 Phases)

### Phase 1: Detection & Triage (< 1 Hour)
- Monitor alerts from Supabase, Vercel, Sentry, or user support tickets.
- Log initial incident in `INCIDENT_RECORD_TEMPLATE.md`.
- Assign preliminary severity: `P0 (Critical Breach)`, `P1 (High Risk Exposure)`, `P2 (Moderate Drift)`, `P3 (Low / Informational)`.

### Phase 2: Containment & Evidence Preservation (< 4 Hours)
- Revoke compromised database API keys, rotate service secrets, or terminate malicious connections.
- Preserve server logs, database access logs, and network telemetry without altering timestamps.
- Take snapshot copies of evidence for forensic investigation.

### Phase 3: Investigation & Impact Assessment (< 24 Hours)
- Determine exact scope: affected tables, columns, number of records, user IDs involved.
- Evaluate whether special category religious data or precise location was queried.
- Check access logs to verify whether the vulnerability was exploited by external third parties.

### Phase 4: Legal Evaluation & Notification Thresholds (< 72 Hours)
- Convene with Outside Privacy Counsel to evaluate mandatory regulatory notification triggers under:
  - **UK GDPR / ICO**: 72-hour notification rule for incidents posing risk to individuals' rights.
  - **India DPDP Act 2023 / CERT-In**: Mandatory notification of data breaches.
  - **US State Laws (CCPA/CPRA)**: Consumer and Attorney General breach notices.
- If threshold is met, submit regulatory filings and dispatch clear user notifications.

### Phase 5: Recovery & Remediation
- Deploy verified permanent code fixes, migrations, or architectural changes.
- Conduct regression testing and negative penetration testing.
- Restore normal operations.

### Phase 6: Post-Incident Review & Record Archival
- Complete Post-Incident Report within 5 business days.
- Archive confidential legal findings in `Shoonaya Legal & Compliance/06 Incidents/` under reference `VAULT-INC-YYYY-XX`.
- Update the sanitised incident register in Git with sanitized findings.
