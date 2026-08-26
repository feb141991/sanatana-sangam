# Master Data Protection Impact Assessment (DPIA)

**Matter:** Systematic Processing of Spiritual/Religious Data, Astrological Birth Data, Geolocation, and AI Guidance within Shoonaya  
**Version:** 2026-08-25.v1  
**Status:** `FACT_VERIFIED` (Engineering and Architecture Evidence Verified; Legal Determinations Pending Counsel Ratification)  
**Reference:** `REC-DPIA-01` | **Linked Vault ID:** `VAULT-DPIA-2026-01: missing`

---

## 1. Scope, System Boundaries & Necessity

Shoonaya provides digital Vedic calendar (Panchang), sadhana tracking (Japa bead counter), scriptural study (Pathshala), community discussion (Mandali), and theological inquiry (Ask Pramana AI).

Because the platform processes **special category data** (religious/philosophical beliefs under UK GDPR Article 9) and **sensitive personal information** (astrological birth data, precise home coordinates, spiritual journaling), this DPIA evaluates systemic risks to individuals and establishes technical and operational safeguards.

### Necessity & Proportionality
- **Panchang & Sadhana**: Tradition-specific tithi timings and ritual suggestions require knowing the user's tradition (e.g. Vaishnava Ekadashi vs Smartha Ekadashi). Collecting non-essential personal details is avoided.
- **Astronomical Coordinates**: Sunrise/sunset calculations require latitude and longitude. Coordinates are stored with coarse precision where possible and processed in-memory for ephemeral views.
- **AI RAG Architecture**: The Dharma AI system retrieves verified scripture chunks rather than mining or training on user journal entries.

---

## 2. Risk Assessment & Engineering Control Matrix

| Risk ID | Risk Scenario | Inherent Severity (1-5) | Inherent Likelihood (1-5) | Inherent Score | Implemented Technical Controls | Residual Severity | Residual Likelihood | Residual Score | Launch Blocker? |
|---|---|---|---|---|---|---|---|---|---|
| `RISK-01-PROF` | **P0 Defect: Unauthenticated `anon` reads on `profiles` base table** leaking sensitive spiritual profiles and precise home coordinates. | 5 | 5 | **25 (RED)** | Profile lock-down migration (`20260824162430_lock_down_profiles_reads.sql`), `FORCE ROW LEVEL SECURITY`, `DROP POLICY "Public profiles are viewable by everyone"`, `public_profiles` secure view. | 4 | 1 | **4 (GREEN)** | **YES** (Must verify production application) |
| `RISK-02-REL` | **Religious profiling without valid explicit consent** or without a clear withdrawal path. | 4 | 4 | **16 (RED)** | Default-true Settings toggle removed; `consent_religious_data` decoupled; field clearing permitted in UI; formal Article 9 consent capture contract specified. | 3 | 2 | **6 (YELLOW)** | **YES** (Legal approval of consent receipt schema required) |
| `RISK-03-AGE` | **Minors submitting birth data and location** without appropriate age guidance or parental awareness. | 4 | 3 | **12 (ORANGE)** | `AgeGuidanceNotice` displayed across all active DOB entry points (Onboarding, Profile, Kundali, Kul Vansh); non-blocking guidance policy approved by Founder on 2026-08-25. | 3 | 2 | **6 (YELLOW)** | NO (Guidance active; target market legal review open) |
| `RISK-04-FAM` | **Family member birth/kundali data entered** by users without the third party's direct consent. | 3 | 3 | **9 (YELLOW)** | Birth profiles isolated per user account; family tree entries (Kul Vansh) marked private; no public search index of third-party family members. | 2 | 2 | **4 (GREEN)** | NO |
| `RISK-05-LOC` | **Precise real-time location exposure** or nearby seeker discovery leaking home addresses. | 4 | 3 | **12 (ORANGE)** | Foreground-only location permissions (`expo-location`); zero background tracking; nearby seeker visibility requires explicit opt-in; coordinate truncation. | 3 | 1 | **3 (GREEN)** | NO |
| `RISK-06-MOOD` | **Leakage of private mood logs, reflections, and sankalpas** across users or to unauthorized staff. | 4 | 2 | **8 (YELLOW)** | Strict RLS user-scoping (`auth.uid() = user_id`); zero staff access to raw reflection tables without audited break-glass; encrypted at rest. | 3 | 1 | **3 (GREEN)** | NO |
| `RISK-07-AI` | **AI theological hallucinations or user prompt leakage** through third-party LLM providers. | 3 | 3 | **9 (YELLOW)** | RAG pipeline strictly grounded in canonical public-domain scriptures; zero DB logging of user query text; enterprise DPA with Sarvam AI prohibiting training. | 2 | 2 | **4 (GREEN)** | NO |
| `RISK-08-UGC` | **Mandali community harassment, toxic content, or child safety violations**. | 4 | 3 | **12 (ORANGE)** | Authenticated API routes, IP/Auth rate limiting, symmetric blocking, content reporting (`content_reports`), admin moderation RPCs, published support route. | 3 | 2 | **6 (YELLOW)** | NO (Operational staffing SLA pending) |
| `RISK-09-CACHE` | **Stale client cache crossing user accounts** on shared mobile devices or web browsers. | 3 | 3 | **9 (YELLOW)** | Account sign-out purges `AsyncStorage` and `localStorage` user keys; user-scoped draft persistence (`OnboardingDraftStore`); cache key namespaces. | 2 | 1 | **2 (GREEN)** | NO |
| `RISK-10-RET` | **Excessive retention and incomplete deletion cascades** leaving orphan personal data after account deletion. | 3 | 3 | **9 (YELLOW)** | Cancellable 30-day deletion queue in `deleted_accounts`; cascading foreign key deletions; storage bucket asset purging in `purgeDueDeletedAccounts()`. | 2 | 2 | **4 (GREEN)** | NO |
| `RISK-11-VENDOR`| **Third-party processor data breach or invalid cross-border transfer**. | 4 | 2 | **8 (YELLOW)** | Vendor processor register maintained; public DPA & security certification auditing (SOC2/ISO); Standard Contractual Clauses (SCCs) applied. | 3 | 2 | **6 (YELLOW)** | NO |
| `RISK-12-PUSH` | **Push notification previews disclosing sensitive religious practices** on device lock screens. | 2 | 3 | **6 (YELLOW)** | Quiet-hours suppression engine; generic notification title formatting; opt-in per category in notification preferences. | 2 | 1 | **2 (GREEN)** | NO |

---

## 3. Mandatory Remediation & Action Plan

1. **Production Deployment & Verification of Migration `20260824162430_lock_down_profiles_reads.sql`**: Verify that unauthenticated requests receive explicit `42501 permission denied` when querying `public.profiles`.
2. **Outside Counsel Engagement**: Obtain legal review on Article 9 explicit consent wording for spiritual tradition fields, and confirm target market age guidance compliance under UK AADC and India DPDP Section 9.
3. **Execute Processors DPAs**: Formalize executed online DPAs with Supabase, Vercel, Expo, Twilio, and Sarvam AI.
