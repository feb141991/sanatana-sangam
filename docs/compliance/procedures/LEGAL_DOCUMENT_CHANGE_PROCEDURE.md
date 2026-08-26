# Legal Document Change & Versioning Procedure

**SOP Reference:** `REC-PROC-DOC`  
**Owner:** Legal Operations / Lead Engineer  
**Intended Approver:** Founder; outside privacy counsel where required  
**Status:** `FOUNDER_APPROVED` (2026-08-25, see `APPR-20260825-01`)

## 1. Purpose

To ensure that any amendment to public legal documents (Terms of Service, Privacy Policy, Age Guidance, Consent Notices) is properly reviewed, hashed, versioned, and communicated to users without breaking compliance audit trails.

## 2. Document Change Protocol

1. **Drafting & Legal Review**: Changes are drafted in `src/lib/terms-content.ts` or `src/lib/privacy-content.ts` and submitted to Outside Counsel.
2. **Version Identifier Assignment**: Assign an immutable date-stamped version tag (e.g. `YYYY-MM-DD.vX`).
3. **Checksum Generation**: Calculate the SHA-256 hash of the canonical copy text.
4. **Register Update**: Update `CONSENT_AND_LEGAL_VERSION_REGISTER.md` with the new version, checksum, and effective date.
5. **Classify Materiality**:
   - **Minor / Clarification**: Increment patch version; display banner notice on next login.
   - **Material (New processing, changed liability, new vendors)**: Increment major version; prompt active user reacceptance modal upon login.
6. **Codebase Synchronization**: Update Native and Web copy constants simultaneously to maintain contract parity.
