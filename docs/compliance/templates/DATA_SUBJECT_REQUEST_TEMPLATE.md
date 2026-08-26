# Data Subject Request (DSR) Intake Template

**Request ID:** `DSR-YYYYMMDD-XX`  
**Date Received:** `YYYY-MM-DD`  
**Request Type:** `[Access/Export | Rectification | Erasure | Restriction | Objection]`  
**User Identifier (Pseudonymized / Email):** `[User Reference ID]`  
**Identity Verification Status:** `[Verified via JWT Session | Verified via Email Link]`  

---

## 1. Request Summary
- **User Specific Request Details**: `[e.g. Requesting full data export and subsequent deletion]`

## 2. Processing Steps
- `[ ]` Identity confirmed.
- `[ ]` Query generated data export payload (`/api/user/export`).
- `[ ]` Secure delivery of export JSON to user.
- `[ ]` (If Erasure) Trigger account deletion workflow (`DELETE /api/user/delete`).
- `[ ]` Check for statutory financial exceptions (7-year tax hold).
- `[ ]` Log completion audit.

## 3. Resolution & Closure
- **Completion Date**: `YYYY-MM-DD`
- **Response Sent to User**: `[Yes / No]`
- **Signed Off By**: `[Support Lead / Privacy Officer]`
