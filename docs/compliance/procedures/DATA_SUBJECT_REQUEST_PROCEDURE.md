# Data Subject Request (DSR) Handling Procedure

**SOP Reference:** `REC-PROC-DSR`  
**Owner:** Support Lead / Privacy Officer  
**Intended Approver:** Founder; outside privacy counsel where required  
**Status:** `FOUNDER_APPROVED` (2026-08-25, see `APPR-20260825-01`)

---

## 1. DSR Rights Supported

Shoonaya supports all statutory data subject rights under UK GDPR, EU GDPR, CCPA/CPRA, and India DPDP:
1. **Right of Access / Export (Art. 15)**: Automated JSON data export via `/api/user/export`.
2. **Right to Rectification (Art. 16)**: Direct user editing of profile, birth data, and preferences in Settings.
3. **Right to Erasure (Art. 17)**: Self-service account deletion via `DELETE /api/user/delete` with 30-day cancellation cooling-off.
4. **Right to Restriction / Objection (Art. 18/21)**: Ability to turn off religious personalization, notifications, and web analytics.
5. **Right to Withdraw Consent (Art. 7(3))**: Settings toggle and Web Consent Manager revocation.

## 2. DSR Execution Protocol

1. **Intake & Identity Verification**:
   - Requests submitted via in-app settings are automatically verified by JWT authentication.
   - Requests submitted via email (`privacy@shoonaya.com`) require identity verification by sending a confirmation link to the registered email address.
2. **Timeline Compliance**:
   - Standard requests completed within **30 calendar days** (statutory requirement).
   - Urgent erasure or security objections prioritized within **72 hours**.
3. **Data Export Structure**:
   - The export payload returned by `/api/user/export` contains a clean, human-readable JSON file containing: account details, profile attributes, sadhana counts, birth profiles, and authored posts.
4. **Exceptions & Legal Holds**:
   - Financial transaction ledgers (`public.payment_orders`) are retained under statutory accounting obligations; the requester is notified of the legal exception.
