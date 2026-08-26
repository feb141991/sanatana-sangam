# UGC and Community Safety Impact Assessment (Mandali)

**Assessment Reference:** `REC-DPIA-UGC`  
**Platform Area:** Mandali Community Feed, Comments, and User Moderation  
**Compliance Standards:** Apple App Review Guideline 1.2 (User Generated Content), Google Play Developer Program Policy

## 1. Feature Architecture

Mandali provides a shared community space for spiritual discussion, questions, and reflections. Users can publish text posts, attach images, and comment on discussions.

## 2. UGC Safety Engineering Controls

| Guideline 1.2 Requirement | Implemented Technical Control | Source Evidence |
|---|---|---|
| **1. Method for filtering objectionable content** | Content validation, text length bounds, client/server sanitization, keyword inspection. | `src/app/api/mandali/posts/route.ts` |
| **2. Mechanism to report offensive content** | Interactive report menu with categorized reasons (spam, harassment, inappropriate content); persisted in `content_reports`. | `src/app/api/mandali/report/route.ts`, `components/safety/ContentSafetyMenu.tsx` |
| **3. Mechanism to block abusive users** | Instant user-level blocking; filtered at the database/feed query level to prevent blocked user content from rendering. | `src/lib/user-safety.ts`, `public.user_blocked_profiles` |
| **4. Published contact information** | Dedicated support and trust contact available at `/contact` and `support@shoonaya.com`. | `src/app/(legal)/contact/page.tsx`, `app/settings.tsx` |
| **5. Timely response to reports (24hr target)** | Triage protocol defined in `UGC_MODERATION_AND_APPEALS_PROCEDURE.md`. | `docs/compliance/procedures/UGC_MODERATION_AND_APPEALS_PROCEDURE.md` |
