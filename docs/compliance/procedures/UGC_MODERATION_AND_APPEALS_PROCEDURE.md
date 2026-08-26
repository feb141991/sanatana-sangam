# UGC Moderation and Appeals Procedure

**SOP Reference:** `REC-PROC-UGC`  
**Owner:** Trust & Safety Lead  
**Intended Approver:** Founder  
**Status:** `FOUNDER_APPROVED` (2026-08-25, see `APPR-20260825-01`)

---

## 1. Community Guidelines & Standards

Mandali is dedicated to respectful, constructive, and uplifting spiritual discourse. Prohibited content includes:
- Hate speech, harassment, defamation, or targeted attacks against any tradition, faith, or individual.
- Explicit, pornographic, or violent imagery.
- Commercial spam, scam solicitations, or deceptive promotions.
- Doxxing or unauthorized posting of private personal information.

## 2. Moderation Workflow

1. **Intake**: Reports submitted via the in-app safety menu (`ContentSafetyMenu.tsx`) create a record in `public.content_reports`.
2. **Queue Triage (SLA Targets)**:
   - **Severe Harm / Child Safety / Imminent Threat**: < 2 hours (Immediate takedown + legal escalation).
   - **Harassment / Inappropriate Content**: < 24 hours.
   - **Spam / Low-Priority**: < 48 hours.
3. **Moderator Actions**:
   - `DISMISS`: Report reviewed; no violation found.
   - `CONTENT_HIDE`: Post hidden from public feeds pending author edit.
   - `CONTENT_DELETE`: Post permanently removed from database.
   - `USER_WARN`: Automated warning notice sent to user.
   - `USER_SUSPEND`: Account marked `is_banned: true` (revoking all write privileges).

## 3. User Appeals Process

1. Any user whose post is removed or whose account is suspended receives an in-app notice and may appeal via `support@shoonaya.com` with subject `APPEAL: [Post/User ID]`.
2. Appeals are reviewed by a different Trust & Safety team member within **5 business days**.
