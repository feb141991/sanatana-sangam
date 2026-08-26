# Third-Party Vendor Onboarding & Review Procedure

**SOP Reference:** `REC-PROC-VEND`  
**Owner:** Infrastructure Lead / Procurement  
**Intended Approver:** Founder; outside privacy counsel where required  
**Status:** `FOUNDER_APPROVED` (2026-08-25, see `APPR-20260825-01`)

---

## 1. Vendor Onboarding Due Diligence

Prior to integrating any third-party SDK, API service, cloud infrastructure provider, or analytics library:
1. **Security & Privacy Assessment**: Complete `VENDOR_REVIEW_TEMPLATE.md` evaluating security attestations (SOC2, ISO 27001) and encryption standards.
2. **Data Processing Agreement (DPA)**: Obtain and execute a binding DPA incorporating UK/EU Standard Contractual Clauses (SCCs) and UK IDTA where applicable.
3. **Data Minimization Audit**: Review the SDK payload in dev builds to verify that no unauthorized hardware IDs, contacts, or location data are harvested.
4. **Register Entry**: Add vendor details to `VENDOR_PROCESSOR_REGISTER.json` and `VENDOR_PROCESSOR_REGISTER.md`.

## 2. Annual Vendor Audit

Every 12 months, the Infrastructure Lead re-audits all active vendors:
- Review updated subprocessor lists.
- Confirm renewed SOC2 / ISO compliance certificates.
- Audit billing tiers and data retention settings in provider consoles.
