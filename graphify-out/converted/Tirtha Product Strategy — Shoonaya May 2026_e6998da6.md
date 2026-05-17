<!-- converted from Tirtha Product Strategy — Shoonaya May 2026.docx -->


🛕
TIRTHA
Product Strategy & Feature Roadmap
Shoonaya  ·  Q2 2026 Research Report



Prepared by
Seasonal Spiritual Product Management · Shoonaya
May 2026

# 1. Executive Summary
Tirtha is Shoonaya's sacred pilgrimage map — currently a Leaflet/Overpass mashup that shows nearby temples filtered by tradition. It is functionally correct but spiritually thin. Users can find a temple; they cannot celebrate arriving at one, share that moment, earn recognition for their yatra, or plan the next one. This document prescribes the features that close that gap.

The central thesis is simple:


Sri Mandir (3.5M MAU, ₹175 Cr raised) has cornered temple-as-commerce: chadhava bookings, puja video delivery, prasad by courier. Shoonaya's differentiated ground is temple-as-journey: check-in memory, pilgrimage progression, community yatra, and multi-tradition inclusivity that Sri Mandir cannot replicate because its DNA is Hindu-first.

Recommended priority sequence:
- Phase 1 (0–6 weeks): Spiritual Check-in system — the foundation every other feature rests on.
- Phase 2 (6–16 weeks): Tirtha Passport, seasonal yatra trails, and shareable darshan cards.
- Phase 3 (4–9 months): Community yatra planning, Kul group pilgrimages, and the full seva-points economy.

# 2. Current State Assessment
## What Tirtha Does Today

## What Users Actually Want at a Tirtha
Field observation and analogous-app research suggest the emotional arc of a pilgrimage visit has five beats:

- Anticipation — "I am going to Kedarnath next month, help me prepare."
- Arrival — "I am here. I want to mark this moment."
- Experience — "What should I do, see, and pray for at this shrine?"
- Memory — "I want to keep this darshan forever."
- Sharing — "My family in Canada should know I prayed for them here."

The current Tirtha serves none of these five beats. Every feature in this document maps to one or more of them.

# 3. Competitive Landscape
## Sri Mandir — The Dominant Incumbent
Sri Mandir is the benchmark. As of early 2026 it had:

- 3.5 million monthly active users
- ₹175 crore in venture funding
- 700,000+ international users (diaspora revenue ~20% of total)
- Live puja booking at 70+ temples — user sees a priest chant, gets a video and prasad by courier
- AI-powered faith Q&A chatbot ("Talk to Pundit Ji")
- Festival countdowns, daily shloka, devotional music library


## Foursquare Swarm — Gamification Blueprint
Swarm's 2014–2019 playbook is the most studied check-in gamification system in consumer apps. Key mechanics that translate to sacred contexts:


## Kumbh Mela 2025 — Government-Scale Tirtha Tech
The 2025 Prayagraj Kumbh Mela deployed technology at pilgrimage scale that signals where the market is heading:

- RFID wristbands for 45 crore pilgrims — digital entry proof and crowd-flow data
- AI chatbot in 11 languages guiding pilgrims to ghats, facilities, and snan timings
- 2,700 AI-enabled CCTV cameras with crowd density heatmaps
- Biometric QR-code yatra certificates — officially endorsed digital darshan proof
- Digital lost & found — real-time family reconnection via app


## Competitive Gap Matrix

# 4. Feature Recommendations
Features are grouped into five strategic pillars. Each pillar addresses a distinct user need and together they transform Tirtha from a directory into a living pilgrimage companion.
## 4.1  Pillar 1 — Spiritual Check-In
The single most impactful feature Tirtha can add. Every other pillar either feeds into check-in data or builds on top of it.

### Core Check-in Flow
- Arrives at a temple → app detects proximity via GPS geofence (100 m radius)
- Banner notification: "You are near Siddhivinayak Mandir — tap to check in"
- One-tap check-in screen opens: shows temple name, today's tithi, moon phase, auspicious timing (muhurat), and any active seasonal event
- Optional: add a personal prayer intention (private, encrypted, never shared)
- Optional: choose a mood/bhav tag: Gratitude · Seeking · Surrender · Celebration · Grief · Healing
- Check-in saved to personal Yatra Journal

### Check-in Data Model
Each check-in stores:
- Temple ID (OSM node), name, coordinates
- Timestamp, Hindu calendar date (tithi, paksha, masa), season
- Tradition (auto-detected from temple type + user tradition)
- Prayer intention (encrypted, local device only)
- Bhav/mood tag
- Weather at time of visit (OpenWeatherMap call at check-in)
- Visit count to this specific temple (lifetime + this year)

### Yatra Journal
A reverse-chronological personal log of all check-ins, beautifully rendered. Each entry shows:
- Temple name + city + tradition icon
- Hindu calendar date alongside Gregorian date
- Number of times visited in total
- Private intention (blur-by-default, tap to reveal)
- Bhav tag displayed as a coloured bead

## 4.2  Pillar 2 — Tirtha Passport & Gamification
Recognition for spiritual effort, themed around the language of pilgrimage rather than the language of games.

### Seva Points Economy
Every sacred action earns Seva Points (SP):


### Tirtha Passport & Seals
A visual "passport" page in the Bhakti section. Seals are earned by completing collections of check-ins:

- Char Dham Seal — check in at all four dhams (Kedarnath, Badrinath, Gangotri, Yamunotri)
- Ashtavinayak Seal — 8 Ganesha temples in Maharashtra
- Jyotirlinga Yatri — any 4 of 12 Jyotirlingas visited
- Guru Darbar Seal (Sikh) — Harmandir Sahib + 4 Takhts
- Jain Tirthankara Trail — Palitana + Ranakpur + Dilwara
- Buddhist Pilgrimage — Bodh Gaya + Sarnath + Lumbini + Kushinagar
- Local Devata — 10 temples in your home city
- Night Puja Devotee — check in after sunset 5 times
- Monsoon Yatri — check in during Shravan month


### Kshetrapati — Guardian Devotee
Inspired by Foursquare Mayorship but made sacred. The devotee with the most check-ins at a specific temple in the rolling 30-day window earns the title "Kshetrapati" (guardian of the kshetra). Only shown as an anonymised display name (e.g., "Devotee from Pune") — no real name exposed. Rotates monthly. Displayed on the temple detail screen as a small flame icon. Purpose: drives local repeat-visit engagement without exposing user identity.

### Yatra Streaks
Three streak types, each with a separate counter:
- Weekly Temple Streak — visited at least one temple each week for N weeks
- Ekadashi Streak — checked in on N consecutive Ekadashis
- Festival Streak — visited a temple on N consecutive major festival days
Streaks are shown on the Bhakti home as a pill (same style as Japa streak). They are private by default but shareable.
## 4.3  Pillar 3 — Seasonal Yatra Trails
The calendar is the product. Indian spiritual life is structured around tithis, seasons, and pilgrimage windows. Tirtha should surface the right trail at the right moment.

### Trail Architecture
A Trail is a curated list of tirthas with a defined pilgrimage purpose and time-sensitivity. Examples:


### Trail UI Behaviour
- On Tirtha map screen — active trails appear as a horizontal scroll above the map. Tapping a trail highlights its tirthas in a distinct colour, adds distance rings.
- Trail progress bar — shows N of M tirthas checked in. Progress persists in the Yatra Journal.
- Smart seasonal nudge — 3 weeks before a seasonal window opens, a banner appears on the Home dashboard: "Amarnath Yatra opens in 21 days — view trail."
- Post-completion flow — completing a trail triggers a full-screen cinematic animation + seal award + optional share prompt.

## 4.4  Pillar 4 — Sharing & Memory
The moment of darshan is one of the most emotionally significant in a devotee's life. Shoonaya should help them capture and share it in a way that feels sacred, not social-media-cheap.

### Darshan Card (Sharable Image)
On check-in, the user can generate a Darshan Card — a beautiful, branded image formatted for WhatsApp / Instagram Stories. It contains:

- Temple name in Devanagari + English (or Gurmukhi / Pali as appropriate)
- City and state
- Today's tithi and Hindu calendar date
- A devotion quote or mantra appropriate to the deity / tradition
- Shoonaya watermark (subtle — small logo bottom-right)
- No personal name, no timestamp — just the sacred information

Design principles for Darshan Cards:
- Four tradition-specific visual themes: rangoli-warm for Hindu, blue-white Khalsa aesthetic for Sikh, lotus-gold for Buddhist, white-jade for Jain
- Generated client-side (canvas API) — no server round-trip, works offline
- 1080×1920 for Stories, 1080×1080 for Feed/WhatsApp

### Digital Yatra Certificate
Modelled on Char Dham's government-issued biometric QR certificate from Kumbh 2025. For users who complete a full Yatra Trail, Shoonaya generates a PDF certificate:
- Certificate title: "Yatra Pramaan Patra" (Pilgrimage Certificate of Completion)
- User's display name, completion date, trail name
- List of all tirthas visited with dates
- QR code linking to a verification page on shoonaya.com (no personal data stored externally — QR is a signed hash of the local data)
- Tradition-appropriate illustration border (temple gopuram, Harmandir Sahib, Stupa, etc.)


### Yatra Tapestry — Personal Pilgrimage Map
A shareable static image of the user's check-in map — India (or world) map with pins at every temple visited, colour-coded by tradition, sized by visit frequency. Exportable as a 2400×3000px poster-quality image. Annual "Year in Tirthas" version generated automatically on Diwali / Guru Nanak Gurpurab / user anniversary of joining Shoonaya.
## 4.5  Pillar 5 — Community & Kul Yatra
The pilgrimage is almost always a family or community event. Shoonaya already has Kul (family groups) — Tirtha should be the most natural use case for Kul.

### Kul Yatra Planning
- Inside a Kul, any member can propose a Yatra: pick a Trail or custom temple list, suggest dates.
- Members RSVP (Going / Maybe / Joining remotely in spirit).
- On the day, the Kul Yatra screen shows a live presence feed: "3 members have checked in at Kedarnath today."
- Group Darshan Card generated for the whole Kul — shows all member display names who checked in on the same trail within 48 hours.

### Diaspora "Join in Spirit" Mode
For family members abroad who cannot physically travel. On the day of a Kul Yatra:
- Remote member opens the Yatra screen and taps "Join in Spirit"
- They can listen to the temple's live aarti (YouTube embed or our own audio) or a recorded stotram appropriate to the deity
- They are shown as "Joining from London" on the Kul live feed
- At the end they receive the same Group Darshan Card as the physical visitors


### Kul Tirtha Leaderboard
Within a Kul, a friendly leaderboard shows:
- Total Seva Points accumulated by each member this year
- Number of unique tirthas visited
- Longest yatra streak
Visibility: Kul-private only. Never shown publicly. Framed as friendly seva recognition, not competition.

### Temple Community Notes
Crowd-sourced, moderated information per temple:
- Best time to visit (community-rated)
- Prasad type available
- Accessibility info (wheelchair, parking, steps)
- Dress code reminder
- Current crowd level (updated by check-in density)
All notes are anonymous, moderated by ML + community flags. No reviews, no star ratings — this is not TripAdvisor.

# 5. Technical Considerations
## Geofencing Architecture
GPS-based proximity detection for check-in triggers. Recommended approach:
- Client-side geofence using the browser Geolocation API + a Haversine distance check against cached temple coordinates
- Cache the nearest 50 temples' coordinates on app open (lightweight JSON, ~10 KB)
- Check distance every 60 seconds when the user is on the map screen; background polling only when user has explicitly enabled "Notify me when near a temple"
- 100 m default geofence radius; configurable 50–500 m in settings
- Throttle check-in eligibility: same temple, minimum 6-hour cooldown before re-check

## Hindu Calendar Integration
Every check-in is enriched with tithi data. The panchangam calculation library (already in use by Bhakti/Stotram features) should be extended to provide:
- Tithi at time of check-in (e.g., "Shukla Panchami")
- Paksha (Shukla / Krishna)
- Masa (Chaitra, Vaishakha, etc.)
- Samvatsara (Hindu year name)
- Any active Vrata, Ekadashi, or festival at that timestamp

## Offline Temple Data
Overpass API requires internet. For reliable check-in at remote tirthas (Kedarnath, Amarnath):
- Pre-cache the 500 most-visited Indian tirthas as static JSON bundled in the app
- For Yatra Trail tirthas, pre-download the full trail's temple data when the trail is opened on WiFi
- Offline check-in queues locally and syncs when connectivity returns

## Privacy & Data Design
Given the deeply personal nature of pilgrimage data:
- Prayer intentions: end-to-end encrypted on device, never transmitted to servers
- Check-in history: stored server-side but behind per-user encryption key
- Location data: only the temple node ID is stored, never raw GPS coordinates after check-in confirmation
- Kul live presence: ephemeral, cleared after 24 hours of the yatra day
- Kshetrapati display: anonymised (city + first name initial only)

# 6. Prioritised Roadmap
## Prioritisation Framework
Features scored across three axes: User Emotional Impact (1–5) × Shoonaya Competitive Differentiation (1–5) ÷ Engineering Complexity (1–5). Higher score = higher priority.


## Phase 1 — Foundation (Weeks 1–6)
### Sprint 1–2: GPS Check-In + Tithi Enrichment
- Build geofence service (client-side, Haversine)
- Design check-in confirmation screen with bhav tags
- Integrate panchangam API at check-in time
- Persist check-in data to user profile
### Sprint 3–4: Yatra Journal UI
- Design and build Yatra Journal screen in Bhakti section
- Reverse-chronological list, tradition icons, tithi labels
- Private intention reveal interaction (blur + tap)
### Sprint 5–6: Darshan Card Generator
- Canvas-based card generator (client-side)
- Four tradition themes, two aspect ratios
- Mantra/quote database per deity/tradition (50 entries to start)
- Share sheet integration (native OS share)

## Phase 2 — Depth (Weeks 7–16)
### Sprint 7–8: Seasonal Yatra Trails
- Trail data model and admin CMS for trail creation
- Map overlay for active trail tirthas
- Trail progress bar + completion animation
- Seasonal nudge notifications (3 weeks pre-window)
### Sprint 9–10: Tirtha Passport & Seals
- Seal artwork commission (8 illustrated seals for launch)
- Passport UI — scrollable collection view
- Check-in trigger logic for seal award conditions
### Sprint 11–12: Digital Yatra Certificate
- PDF generation (server-side for full resolution)
- QR code as signed local hash
- Downloadable from Yatra Journal on trail completion
### Sprint 13–14: Offline Temple Cache
- Static JSON of top 500 tirthas bundled in app
- Trail-specific pre-download on WiFi
- Offline check-in queue and sync
### Sprint 15–16: Kul Yatra Planning + Diaspora Mode
- Kul Yatra proposal flow inside Kul group
- RSVP + live presence feed on yatra day
- Join in Spirit mode — audio + presence card
- Group Darshan Card generation

## Phase 3 — Community (Months 5–9)
- Yatra Tapestry map export (annual poster)
- Kshetrapati / Guardian Devotee system
- Community Temple Notes (crowd-sourced, moderated)
- Full Seva Points economy + Kul leaderboard
- WhatsApp Business Integration for darshan card sharing
- Puja/livestream embed partnerships (future revenue stream)

# 7. Success Metrics
North Star Metric: Weekly Active Pilgrims — users who open Tirtha at least once per week. Current baseline is near zero (Tirtha is session-less today). Target: 25% of Bhakti MAU within 6 months of Phase 1 launch.


# 8. Risks & Mitigations

# 9. Appendix — Research Sources
This strategy is grounded in primary research conducted May 2026:

- Sri Mandir app store listings, press coverage, and investor disclosures (Sequoia India, Susquehanna, 2023–2025)
- Foursquare Swarm gamification design post-mortems and Niantic Labs check-in research, 2019–2024
- Kumbh Mela 2025 digital infrastructure reports — Ministry of Tourism of India, February 2025
- Char Dham Yatra Registration portal 2025 — biometric certificate UX analysis
- Jesuit Pilgrimage app (Camino de Santiago) — check-in + community mechanics study
- Analogy research: fitness app check-in mechanics (Strava segments, Nike Run Club trophies)
- Shoonaya internal: Kul group usage data, Bhakti MAU baseline, Japa Mala streak distributions

Prepared by the Shoonaya Seasonal Spiritual Product Management team, May 2026.
Shoonaya · career.prince@gmail.com
|  | Pilgrimage is inherently social, seasonal, and progressive. A map that treats it as a pure directory — find, tap, close — leaves the deepest emotional territory of the journey completely untouched. |
| --- | --- |
| Capability | Current Implementation |
| --- | --- |
| Temple discovery | Overpass API + Leaflet; shows OSM nodes within a configurable radius |
| Tradition filter | Hindu, Sikh, Buddhist, Jain — passed as query param |
| City search | Text input geocodes to lat/lng then re-queries Overpass |
| Marker info | Tap shows name, address, sometimes hours from OSM tags |
| Check-ins | None |
| Offline support | None |
| Sharing | None |
| Gamification | None |
| Seasonal content | None |
|  | Sri Mandir's moat is transactional: it earns money because priests, temples, and logistics partners are on the platform. Shoonaya's moat must be relational — the app that knows your spiritual journey across traditions and years. |
| --- | --- |
| Swarm mechanic | Sacred translation for Shoonaya |
| --- | --- |
| Mayorships (most check-ins at a venue) | Kshetrapati — "Guardian Devotee" of a specific tirtha, rotates monthly |
| Stickers awarded for check-in milestones | Tirtha Seals — tradition-specific badges (Char Dham seal, Ashtavinayak seal, etc.) |
| Friend leaderboards per neighbourhood | Family/Kul yatra leaderboard — who in your family has visited the most tirthas this year |
| Shareable personal check-in maps | Yatra Tapestry — a personal pilgrimage map you can share as an image |
| Streaks (check-in X days in a row) | Yatra Streaks — visit a temple for N consecutive Ekadashis / Sundays |
|  | The government normalised the idea of a digital pilgrim ID. Shoonaya can be the personal layer on top: your private yatra history that travels with you across every future Kumbh, Char Dham, and temple visit. |
| --- | --- |
| Feature | Sri Mandir | Google Maps | Swarm | Shoonaya
(proposed) |
| --- | --- | --- | --- | --- |
| Temple discovery (map) | ✓ | ✓ | ✗ | ✓ |
| Tradition filter | ✓ | ✗ | ✗ | ✓ |
| Check-in / memory | ✗ | ✗ | ✓ | ✓ (planned) |
| Darshan certificate | ✗ | ✗ | ✗ | ✓ (planned) |
| Seasonal yatra trails | ✗ | ✗ | ✗ | ✓ (planned) |
| Online puja booking | ✓ | ✗ | ✗ | ✗ (future) |
| Multi-tradition support | ~ | ✗ | ✗ | ✓ |
| Kul / family groups | ✗ | ✗ | ✗ | ✓ (planned) |
| Gamification / badges | ✗ | ✗ | ✓ | ✓ (planned) |
| Diaspora sharing | ~ | ✗ | ✗ | ✓ (planned) |
| Offline temple data | ✗ | ✓ | ✗ | ✓ (planned) |
|  | The Yatra Journal is the emotional anchor of Tirtha. It must feel like a spiritual diary, not a Foursquare history. No public counts, no likes — only your own sacred record. |
| --- | --- |
| Action | Seva Points | Notes |
| --- | --- | --- |
| Check in to any temple | +5 SP | Daily cap: 15 SP |
| First visit to a new tirtha | +25 SP | Discovery bonus |
| Visit on an auspicious tithi | +10 SP | e.g., Ekadashi, Purnima, Amavasya |
| Complete a Yatra Trail (see §4.3) | +100 SP | Trail-specific |
| Share a darshan card | +3 SP | Max 1 per temple per week |
| Consecutive weekly temple visits | +15 SP | Per week in streak |
| Add a new temple to OSM (verified) | +50 SP | Community contribution |
| Visit with Kul / family group | +8 SP | Social multiplier |
|  | Seals should feel handcrafted — illustrated in the tradition's visual language, not generic trophy icons. A Sikh Takhts seal should look like a Nishan Sahib. A Buddhist seal like a Dhamma wheel on aged parchment. |
| --- | --- |
| Trail | Window | Tradition | Seal reward |
| --- | --- | --- | --- |
| Char Dham Yatra | May – Oct (Himalayas open) | Hindu | Char Dham Seal |
| Amarnath Yatra | July – Aug | Hindu | Shivalinga Yatri seal |
| Shravan Somvar | Shravan month (Jul–Aug) | Hindu | Shravan Devotee |
| Navratri Shakti Circuit | Ashvin Navratri (Oct) | Hindu | Shakti Yatri seal |
| Guru Nanak Gurpurab Trail | Kartik Purnima (Nov) | Sikh | Guru Darbar seal |
| Paryushana Yatra | Bhadra month (Aug–Sep) | Jain | Paryushana Seal |
| Vesak Circuit | Vaishakh Purnima (May) | Buddhist | Vesak Pilgrim seal |
| 12 Jyotirlinga Mahayatra | Year-round, lifetime | Hindu | Mahadev Yatri seal |
|  | Seasonal timing is the core insight. Unlike Sri Mandir's evergreen temple commerce, Shoonaya's Tirtha can feel alive with the Hindu calendar — surfacing different content every Ekadashi, every Navratri, every pilgrimage season. |
| --- | --- |
|  | The certificate is a high-value diaspora feature. An NRI in London who completes the 5 Char Dham visits over 3 years of India trips will treasure a printable certificate far more than a badge on their phone. |
| --- | --- |
|  | This is Shoonaya's most defensible diaspora feature. Sri Mandir sells prasad delivery to the diaspora. Shoonaya offers presence — the feeling of being part of the family yatra even when you are 8,000 km away. |
| --- | --- |
| Feature | Impact | Diff. | Effort | Score | Phase |
| --- | --- | --- | --- | --- | --- |
| Spiritual Check-In (GPS + Yatra Journal) | 5 | 5 | 2 | 12.5 | Phase 1 |
| Darshan Card (shareable image) | 5 | 5 | 2 | 12.5 | Phase 1 |
| Seasonal Yatra Trails | 5 | 5 | 3 | 8.3 | Phase 2 |
| Tirtha Passport + Seals | 4 | 5 | 2 | 10.0 | Phase 2 |
| Tithi enrichment on check-in | 4 | 4 | 1 | 16.0 | Phase 1 |
| Offline temple cache | 4 | 3 | 2 | 6.0 | Phase 2 |
| Kul Yatra planning | 5 | 5 | 3 | 8.3 | Phase 2 |
| Diaspora "Join in Spirit" mode | 5 | 5 | 2 | 12.5 | Phase 2 |
| Digital Yatra Certificate (PDF) | 4 | 5 | 2 | 10.0 | Phase 2 |
| Yatra Tapestry map export | 4 | 4 | 3 | 5.3 | Phase 3 |
| Kshetrapati (Guardian Devotee) | 3 | 4 | 2 | 6.0 | Phase 3 |
| Community Temple Notes | 3 | 3 | 3 | 3.0 | Phase 3 |
| Seva Points economy | 4 | 4 | 4 | 4.0 | Phase 3 |
| Kul Leaderboard | 3 | 4 | 2 | 6.0 | Phase 3 |
| Metric | Target (6 months) | Why it matters |
| --- | --- | --- |
| Check-ins per WAP (weekly active pilgrim) | >2.5 / week | Frequency — are users coming back after first check-in? |
| Darshan Cards shared | >30% of check-ins | Virality — organic acquisition via sharing |
| Yatra Trail starts | >15% of WAPs | Depth — are users committing to longer journeys? |
| Trail completion rate | >25% of starts | Product quality — is the trail experience compelling? |
| Kul Yatra sessions | >10% of Kuls | Social layer adoption |
| Diaspora "Join in Spirit" usage | >5% of Kul Yatras | International market indicator |
| Tirtha-driven new installs | >8% of total | SEO / share attribution |
| Check-in D7 retention | >55% | Core stickiness after first check-in experience |
| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| GPS inaccuracy at remote tirthas (Kedarnath altitude, Amarnath snowfields) | Medium | Manual check-in override: user can check in by typing temple name when GPS fails. Audit geofence radius at high-altitude sites. |
| OSM data quality — many temples mis-tagged or missing | High | Bundled static JSON of 500 verified tirthas for trails. In-app "add this temple" flow that feeds to OSM. |
| Gamification feeling disrespectful to religious users | Medium | Language framing: Seva Points not "XP"; Seals not "achievements"; Kshetrapati not "Mayor". Extensive user interviews before launch. |
| Low check-in rate — users forget to open app while at temple | High | Background geofence notification (opt-in). Apple Watch / Wear OS complication for quick check-in. Remind at check-out time ("Hope your darshan was peaceful — check in?"). |
| Kul Yatra coordination complexity — feature abandoned mid-trip | Low | Keep the Kul Yatra flow to 3 screens max. Default to "join individually, aggregate automatically" rather than formal group creation. |