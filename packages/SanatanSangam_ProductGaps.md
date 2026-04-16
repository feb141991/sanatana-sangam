# Sanatana Sangam — Product Gap Report & Roadmap
*As of April 2026 — full-stack audit from the codebase + prior conversations*

---

## ✅ RECENTLY FIXED (This Session)

| Item | Status |
|---|---|
| Pathshala "My Learning" / "Explore" stuck on spinner | Fixed — 4s timeout + seed paths |
| Menu button duplicating nav items | Fixed — replaced with 3 emoji quick-links (Panchang, Bhakti, Nitya) |
| Panchang colors/theme | Fixed — full atmospheric sky redesign, time-based phases |
| Bhakti page cluttered | Fixed — immersive diya experience, focused 2-portal layout |
| Zen mode flat/useless | Fixed — 5 living scenes (Temple, Mountains, Forest, River, Night), breathing circle |
| Nitya Karma infinite spinner | Fixed — 4s timeout + fallback steps |
| Panchang data — no explanations | Fixed — 'i' tooltip on every row (Tithi, Nakshatra, Yoga, Vara, etc.) |
| TopBar menu panel — "Sanatana Sangam" header + weird dropdown | Fixed — removed panel, replaced with direct emoji quick-link pills |

---

## 🔴 URGENT — Broken or Missing Core Features

### 1. No Onboarding Flow
**Impact:** Every new user hits the home screen cold — no tradition selection, no location setup, no name, no context.  
**Root cause:** No `/onboarding` route exists anywhere in the codebase.

**Proposed 5-screen flow (one screen = one tap):**

```
Screen 1 — Welcome
  "Sanatana Sangam — A home for Dharma"
  [Continue] button with animated diya

Screen 2 — Your Tradition (required)
  Tap one: Hindu | Sikh | Buddhist | Jain
  Saves to profiles.tradition (locks after this)

Screen 3 — Language (required)
  Tap one: English | हिंदी | ਪੰਜਾਬੀ
  Saves to profiles.app_language

Screen 4 — Your Location (optional but important for Panchang)
  "Allow location" button → geolocation
  OR type your city manually
  Saves to profiles.city, latitude, longitude

Screen 5 — What brings you here? (optional, for personalization)
  Multi-select tiles:
  📿 Daily Japa  |  📖 Learn Scripture  |  🗓️ Festival Calendar
  👨‍👩‍👧 Family Tree  |  🛕 Find Temples  |  💬 Community

  → sets default home tab preference, affects AI personalisation
```

**Where to trigger:** In `src/app/(main)/layout.tsx`, after auth check, if `profile.tradition` is null, redirect to `/onboarding` instead of `/home`.

---

### 2. 16 Sanskaras — Not Implemented
**Impact:** This is a core lifecycle feature for a Dharmic app. No route, no DB table, no UI exists.

**What they are:** 16 sacred rites of passage from birth to death in the Hindu tradition. Similar lifecycle markers exist in Sikh (Naam Karan, Anand Karaj, etc.) and Buddhist traditions.

**Implementation plan:**

**Phase 1 — Lifecycle tracker (MVP, ~2 weeks)**
- New route: `/kul/sanskara` (fits under Kul — family section)
- DB table: `user_sanskaras(id, user_id, sanskara_id, completed_date, notes, performed_by, location, is_public)`
- UI: vertical timeline showing all 16 sanskaras, checkable, with date + notes

**The 16 Sanskaras to show:**
| # | Name | Meaning | Stage |
|---|---|---|---|
| 1 | Garbhadhana | Conception ceremony | Before birth |
| 2 | Pumsavana | Fetal rites (3rd month) | Prenatal |
| 3 | Simantonnayana | Hair parting (5th month) | Prenatal |
| 4 | Jatakarma | Birth rites | Birth |
| 5 | Namakarana | Naming (11th day) | Infant |
| 6 | Nishkramana | First outing (4th month) | Infant |
| 7 | Annaprashana | First solid food (6th month) | Infant |
| 8 | Chudakarana | First haircut (1–3 years) | Child |
| 9 | Karnavedha | Ear piercing | Child |
| 10 | Vidyarambha | Start of education | Child |
| 11 | Upanayana | Sacred thread ceremony | Youth |
| 12 | Vedarambha | Start of Vedic study | Youth |
| 13 | Keshanta/Godana | First shave | Youth |
| 14 | Samavartana | Graduation | Youth |
| 15 | Vivaha | Marriage | Adult |
| 16 | Antyesti | Last rites | Death |

**Phase 2 — Family sharing**
- Link a sanskara completion to a Kul member
- Upload photos / documents
- Share milestone with Kul

**Phase 3 — Priest / Pandit connect**
- Find local pandit for upcoming sanskara
- Book puja through the app (premium)

---

### 3. Language Selection — Exists but Not Surfaced at Onboarding
**Status:** Language preferences (English / Hindi / Punjabi) exist in `src/lib/language-preferences.ts` and are in the Profile editor. BUT:
- Not part of onboarding, so new users never set it
- UI doesn't actually switch content language yet (no i18n runtime)
- Scripture script preference (original / transliteration / both) exists but Pathshala doesn't use it

**Short-term fix:** Add to onboarding screen 3.  
**Medium-term:** Wire `app_language` to a `next-intl` context so UI strings switch.  
**For scriptures specifically:** Pathshala reading view should check `profile.scripture_script` and render accordingly.

---

## 🟡 IMPORTANT — Works but Incomplete

### 4. Vichaar Sabha — Discussion Forum
**Status:** Route exists at `/vichaar-sabha`, `VichaarClient.tsx` and thread detail view exist.  
**Gaps:**
- No onboarding for first-time posters (what is Vichaar Sabha?)
- No categories/tags for filtering threads
- No upvote / save / share thread
- Thread quality scoring — spiritual content only, no spam
- No connection to tradition (Sikh users should see Sikh-relevant discussions first)

### 5. Tirtha Map — Temple Finder  
**Status:** Leaflet map exists at `/tirtha-map`.  
**Gaps:**
- Currently shows static seed data only — needs a curated DB of temples
- No filter by tradition (Hindu / Sikh gurudwara / Buddhist monastery / Jain derasar)
- No "near me" detection
- No temple detail page (hours, contact, events)
- No user-contributed temple submissions

### 6. Japa Counter — Functional but Disconnected
**Status:** Route at `/japa`, works for counting.  
**Gaps:**
- Not integrated with Nitya Karma's "Japa" step (there's a deep-link but no completion sync)
- No historical chart (how many malas per day over 30 days?)
- Streak not shown on home dashboard
- No shared japa sessions (group japa — premium idea)

### 7. AI Chat — Works but No Guardrails
**Status:** Route at `/ai-chat`, accepts messages.  
**Gaps:**
- No source citations (responses should cite Gita chapter, Granth sahib ang, etc.)
- No content guardrails for off-topic queries
- No context — doesn't know user's tradition, level, or location
- No conversation history persistence (resets on reload)
- No rate limiting UI (user can spam)

### 8. Kul (Family Tree) — Partial
**Status:** KulClient.tsx exists with members, tasks, sabha, vansh, events sections.  
**Gaps:**
- No Sanskara section in sections.ts (should add `'sanskara'` to `KUL_SECTION_VIEWS`)
- Vansh (genealogy) likely not fully implemented
- No invite flow for family members
- No shared puja calendar within Kul

---

## 🟢 WORKING WELL

- Auth (Supabase login/signup)
- Profile editor (tradition, gotra, sampradaya, Ishta Devata)
- Pathshala (after our fix) — seed paths load, engine paths load when ready
- Panchang — accurate calculations, beautiful new sky UI
- Bhakti (after rewrite) — immersive diya experience
- Mala/Japa counter — functional
- Mandali — community posts/RSVP
- Notifications — OneSignal push, bell panel

---

## 💎 PREMIUM FEATURES TO BUILD (Diaspora + Monetization)

*You asked about operating for diaspora from India without registering in every country.*

**Legal short answer:** You can operate as an **Indian entity** (Private Ltd or LLP) and offer the app globally via App Store / Play Store, as long as:
1. You comply with **India's IT Act 2000 + IT Rules 2021** (intermediary guidelines if you have UGC)
2. You comply with **GDPR** (if EU users — appoint a Data Protection Representative)
3. You comply with **CCPA** (if California users — add "Do not sell my data" option)
4. App Store / Play Store handle payment collection and tax withholding per country
5. Your **Privacy Policy and Terms** explicitly mention data storage location (Indian servers), governing law (India), and dispute resolution

**You do NOT need:** local company registration in the US, UK, Canada, Australia for a consumer app distributed through the App Stores. The stores handle local compliance and tax for digital goods.

**Key documents needed before launch:**
- Privacy Policy (cover GDPR, CCPA, India PDPB 2023 when enacted)
- Terms of Service (governing law: India, dispute: arbitration)
- Content Moderation Policy (required for UGC — Mandali, Vichaar Sabha)
- Grievance Officer appointment (required under Indian IT Rules)

**Premium tier ideas:**
1. **Kul Pro** — Unlimited family members, shared puja calendar, Sanskara records with photos, priest connect
2. **Pathshala Pro** — Full course access, AI-tutored Q&A on scriptures, certificates
3. **Jyotish Connect** — Book a consult with a vetted astrologer/pandit via the app (marketplace model)
4. **Group Japa** — Live synchronized japa sessions with video/audio (like a devotional Zoom)
5. **Temple Partner** — Temples pay to list events, live darshan streams, donation collection

---

## 📋 IMMEDIATE NEXT PRIORITIES (Suggested Order)

| Priority | Task | Effort | Impact |
|---|---|---|---|
| 1 | Build onboarding flow (5 screens) | 2–3 days | 🔴 Critical for every new user |
| 2 | 16 Sanskaras — Phase 1 timeline UI | 3–4 days | High — core lifecycle feature |
| 3 | Add `'sanskara'` to Kul sections | 1 hr | Enables Kul → Sanskara nav |
| 4 | Wire language to onboarding | 1 day | All users set lang at signup |
| 5 | Vichaar Sabha — categories + quality | 2 days | Makes forum usable |
| 6 | Tirtha Map — real temple DB + filter | 1 week | Makes map actually useful |
| 7 | AI Chat — tradition context + citations | 2 days | Much more trusted responses |
| 8 | Japa history chart | 1 day | Motivation + retention |
| 9 | Kul invite flow | 2 days | Family network effect |
| 10 | Legal docs (Privacy, ToS) | 1 week | Required before public launch |

---

*Generated from full codebase audit — April 2026*
