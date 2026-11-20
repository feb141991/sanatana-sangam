# Shoonaya CMO & Growth Execution Tracker (2026)

> **Canonical Ground Truth & Tracking System for Shoonaya Marketing, Brand Positioning, ASO, GEO/AEO, and Viral Growth.**  
> *Last Updated: 2026-11-20 | Review Cadence: Weekly (Mondays at 00:00 UTC) | Owner: CMO / Founder*

---

## 1. Executive Status & Core Positioning

* **Official Brand Line**: *"Shoonaya — Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection."*
* **Core Value Differentiator**: The ad-free, culturally authentic sanctuary that bridges ancient dharmic traditions with modern design — completely devoid of commercial fear-mongering, clickbait astrology, or spiritual commodification.
* **Tradition Parity**: Separate, dedicated experiences for **Hindu, Sikh, Jain, and Buddhist** seekers.

---

## 2. Workstream Execution Board

| Workstream | Scope / Deliverable | Status | Key Artifacts / File Paths | Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Stream A: Brand Trust & Copy Sanitation** | Strip unsupported overclaims, remove 404 links, align all public copy with `claims.ts` | **DONE** | `src/lib/marketing/diaspora/claims.ts`<br>`docs/marketing/BRAND_MESSAGING.md`<br>`public/.well-known/mcp/server-card.json`<br>`src/components/seo/JsonLd.tsx` | `node scripts/marketing/geo-citation-audit.mjs` (12/12 pass) |
| **Stream B: ASO 2026 Master Store Suite** | Define Title (≤30), Subtitle, Short Desc (≤80), Long Desc, and the 8-frame screenshot architecture | **DONE** | `docs/growth/CMO_EXECUTION_TRACKER.md` (Section 3)<br>`store-assets/` | Spec validated against Apple 2.3.7 & Play 9898842 guidelines |
| **Stream C: GEO / AEO & AI Engine Citations** | Ensure AI search engines (ChatGPT, Perplexity, Claude, Google AI) cite Shoonaya as canonical | **DONE** | `src/components/seo/GeoMicroSummary.tsx`<br>`src/lib/seo/geo-extractors.ts`<br>`src/lib/seo/llms-full.ts`<br>`public/llms-full.txt`<br>`scripts/marketing/geo-citation-audit.mjs` | Automated benchmark panel pass (29/29 checks, 100% Citation Readiness Score) |
| **Stream D: Organic Loops & Shareable Cards** | Pratah Smaran Morning Blessing Home banner (6:30–11:00 AM) with 1-tap WhatsApp 1080px card generation & UTM attribution | **DONE** | `components/home/MorningBlessingPrompt.tsx`<br>`lib/morningBlessing.ts`<br>`src/components/home/MorningBlessingCard.tsx`<br>`src/lib/morning-blessing-policy.ts` | Unit tests passing (3/3 mobile, 3/3 web); 0 asset/file-size violations |
| **Stream E: Community & Mandali Cadence** | Weekly contemplation rhythm (Mondays) replacing daily spam | **DONE** | `src/lib/mandali-prompts.ts`<br>`app/(tabs)/mandali.tsx` | All 6/6 tests passing in `mandali-prompts.test.ts` |

---

## 3. App Store Optimization (ASO 2026) Master Specifications

### Google Play Store
* **Title (≤ 30 characters)**: `Shoonaya: Sacred Daily Panchang` *(30 chars)*
* **Short Description (≤ 80 characters)**: `Daily Panchang, Japa Mala, 365 Dharm Veer heroes, Panchatantra & sacred time.` *(77 chars)*
* **Full Description**: Sourced from `docs/marketing/BRAND_MESSAGING.md` Section 1A.

### Apple App Store
* **Name (≤ 30 characters)**: `Shoonaya: Panchang & Practice` *(29 chars)*
* **Subtitle (≤ 30 characters)**: `Sacred Time, Japa & Tradition` *(29 chars)*
* **Primary Category**: Lifestyle (or Books / Reference)
* **Keywords (≤ 100 characters, comma-separated, no spaces)**:  
  `panchang,hindu calendar,ekadashi,japa,mala counter,kundali,tithi,muhurta,sikh,jain,panchatantra` *(96 chars)*

### 8-Frame Screenshot Architecture (Phone & Tablet) — [STATUS: COMPLETED & LOCKED]
*Canonical capture manifest: `store-assets/google-play/screenshots-manifest.json` (1080x1920 PNG, 9:16 aspect ratio)*
1. **Frame 1 (01-home.png — Home & Sacred Time)**: Localized Panchang tailored to user's city (Sunrise, Tithi, Rahu Kaal, Brahma Muhurta).  
   *Caption*: *"Sacred Time, Noticed. Panchang Tailored to Your Exact City."*
2. **Frame 2 (02-japa.png — Distraction-Free Sadhana)**: Minimalist haptic Japa Mala counter in warm clay dark mode.  
   *Caption*: *"Daily Japa Sadhana. Pure, Minimal, Distraction-Free."*
3. **Frame 3 (03-bhakti.png — Bhakti & Katha Library)**: Sourced sacred texts, stotrams, and katha readers.  
   *Caption*: *"Sacred Bhakti & Kathas. Authentic Texts from Verified Sources."*
4. **Frame 4 (04-dharm-veer.png — Dharm Veer 365)**: Trilingual hero card of Baba Deep Singh ji / Rani Durgavati with primary citation.  
   *Caption*: *"365 Heroes of Dharma. Unsung Stories of Sacrifice and Wisdom."*
5. **Frame 5 (05-sacred-days.png — Authentic Fasting / Vrats)**: Nirjala Ekadashi vs. Phalahari cards with exact Parana timings.  
   *Caption*: *"Authentic Vrat Guidance. Scriptural Rules and Precise Parana Windows."*
6. **Frame 6 (06-panchang.png — Detailed Astronomical Ephemeris)**: Deep astronomical Panchang with exact planetary elongation angles.  
   *Caption*: *"Precision Ephemeris. High-Accuracy Planetary Positions & Muhurtas."*
7. **Frame 7 (07-rashiphala.png — Rashiphala & Vedic Astrological Insights)**: Serene, dignified daily rashiphala without sensational clickbait.  
   *Caption*: *"Vedic Rashiphala. Thoughtful Insights Grounded in Dharma."*
8. **Frame 8 (08-pathshala.png — Pathshala Structured Learning)**: Structured dharmic learning paths across four living traditions.  
   *Caption*: *"Pathshala Living Wisdom. Structured Learning for Seekers & Families."*

---

## 4. How We Track the Works (KPI Dashboard & Monitoring Protocol)

To maintain rigorous operational tracking, we employ a 4-tier tracking framework:

### Tier 1: Engineering & Content Readiness Verification (Local & CI)
* **Command**: `npx tsx scripts/marketing/geo-citation-audit.mjs`  
  *Measures*: Schema validity, claims adherence, multi-tradition fasting ground truth, 32 Sanctuary Journal citations, and Panchatantra public retellings.  
  *Target*: 100% pass (29/29 checks).
* **Command**: `npm run check:assets`  
  *Measures*: 100% format validity and genuine alpha transparency across 872 mobile and 269 web assets.  
  *Target*: 0 broken or checkerboard images.
* **Command**: `npx vitest run src/lib/seo/`  
  *Measures*: AI crawler permissions, full corpus parity (`llms-full.txt`), JSON-LD, and GEO extraction rules.  
  *Target*: 100% pass (6 test suites, 39 tests).
* **Command**: `npx tsx --test tests/ekadashi-resolution-contract.test.ts`  
  *Measures*: Fasting discipline contract (Nirjala strictly for Nirjala Ekadashi, Phalahari for other 23).  
  *Target*: 5/5 pass.

### Tier 2: AI Engine Optimization (GEO/AEO) Visibility Tracker
* **Metric**: Citation Share in Perplexity, ChatGPT Search, and Claude for canonical questions.
* **Benchmark Panel**: 25 prompt queries run monthly against Drik Panchang and Astrosage.
* **Tracking Method**: Google Search Console (GSC) Googlebot crawl indexation + GA4 source regex:
  `chatgpt\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com`

### Tier 3: App Store Conversion Rate Optimization (ASO CRO)
* **Metrics Tracked in Play Console & App Store Connect**:
  1. *Impression-to-Install Conversion Rate (CVR)*: Benchmark target ≥ 28%.
  2. *Custom Product Page (CPP) Engagement*: Conversion difference between Diaspora (US/UK) vs Domestic listings.
  3. *Crash-Free Sessions*: Target ≥ 99.8%.

### Tier 4: Organic Viral Loop Attribution (`/get`)
* **Tracking Links**: Every shared Dharm Veer card, Panchatantra story, and morning shloka carries a smart UTM deep link:
  * WhatsApp Hero Share: `shoonaya.com/get?utm_source=whatsapp&utm_medium=dharm_veer_card&utm_campaign=hero_share`
  * Instagram Story Share: `shoonaya.com/get?utm_source=instagram&utm_medium=story_carousel&utm_campaign=panchatantra`
* **First-Party Analytics**: Anonymous, opt-in first-party referral counter tracking which stories drive the highest organic friend-to-friend invites.

---

## 5. Weekly CMO Review Protocol

Every Monday at 00:00 UTC (matching the Mandali weekly cycle):
1. **Run the GEO Citation Benchmark**: Ensure new content additions haven't degraded schema scores.
2. **Review GSC Indexation**: Track ratio of `crawled - currently not indexed` vs `indexed` URLs.
3. **Audit Diaspora Claims**: If a feature launches to production (e.g. Kul public release), graduate its claim status from `needs_confirmation` to `confirmed` in `claims.ts`.
4. **Report Findings to Founder**: Provide concise progress summary with metrics, test passes, and pending decisions.
