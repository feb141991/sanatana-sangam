# Sanatana Sangam Product Launch Plan

Date: 2026-04-02

## 1. Executive Summary

Sanatana Sangam already has the shape of a strong product:

- local community (`Mandali`)
- family and lineage (`Kul` and `Vansh`)
- daily practice (`Home`, `Shloka`, `Panchang`, `Festivals`)
- sacred discovery (`Tirtha Map`, `Library`)
- conversation (`Vichaar Sabha`)

That is a much more interesting product than "another content app."

The best strategic path is not to compete head-on with generic community tools, devotional-content apps, or temple-commerce apps. The strongest wedge is:

**A digital dharmic home for diaspora users: local community + family continuity + daily spiritual rhythm.**

My recommendation is:

- Launch first for Hindu / Sanatani diaspora users in a few dense English-speaking markets.
- Keep the broader dharmic architecture in the codebase, but do not market the app as equally mature for every tradition until the calendar, content, community, and language experience are truly at parity.
- Fix trust, legal, notification, calendar-accuracy, and infrastructure gaps before any serious public launch.

## 2. What The Product Is Today

### Strongest shipped surfaces

- `Mandali`: location-based local community feed
- `Kul`: family group, family chat, tasks, lineage tracker, events
- `Home`: daily greeting, shloka / sacred text, festival awareness, panchang summary
- `Library`: static searchable scripture snippets across traditions
- `Vichaar Sabha`: forum-style discussion
- `Tirtha Map`: nearby sacred places
- `AI Chat`: spiritual companion
- `Admin`: moderation and basic governance surfaces

### What feels differentiated

- `Kul` plus `Vansh` is the most defensible feature area.
- `Mandali` plus `Tirtha Map` creates a real-world belonging loop.
- tradition-aware onboarding is better than most early community products.

### What still feels prototype-stage

- legal and trust pages are missing
- push notification story is incomplete
- production setup is not deterministic
- some core spiritual data is hardcoded or approximate
- moderation exists for admins, but user-side safety/reporting is weak
- several flows are still UI-polish or pilot quality, not public-market quality

## 3. Market Read

### Audience signal

- In England and Wales, the Office for National Statistics reported about **1.0 million Hindus (1.7%)** in Census 2021. Source: [ONS](https://www.ons.gov.uk/peoplepopulationandcommunity/culturalidentity/religion/bulletins/religionenglandandwales/census2021?t=)
- Statistics Canada reported **close to 830,000 people (2.3%)** identifying with Hinduism in the 2021 Census, and noted Muslim, Hindu, and Sikh shares all more than doubled over 20 years. Source: [Statistics Canada](https://www150.statcan.gc.ca/n1/daily-quotidien/221026/dq221026b-eng.htm)
- Pew's current U.S. Religious Landscape Study shows **1% of U.S. adults identify as Hindu**. Source: [Pew Religious Landscape Study](https://www.pewresearch.org/religious-landscape-study/database/)
- Pew's 2023 work on religion among Asian Americans shows religion and culture remain tightly linked across these communities, which supports a product built around identity, family, and belonging rather than pure content consumption. Source: [Pew Research](https://www.pewresearch.org/religion/2023/10/11/in-their-own-words-cultural-connections-to-religion-among-asian-americans/)

### Competitive pattern

The market is crowded, but fragmented:

- general community platforms are strong at chat, events, moderation, analytics, and monetization
- spiritual apps are strong at habit loops, guided content, and recurring practice
- family tools are strong at shared calendars and lineage/history
- no obvious mainstream product combines all three in a dharmic context

Useful benchmarks:

- [Circle](https://circle.so/) is strong on discussion, events, live, moderation, analytics, email, payments, and mobile brand experience.
- [Geneva](https://www.geneva.com/about) is strong on city/community discovery, group chat, and meetups.
- [Meetup](https://www.meetup.com/) sets the baseline expectation for event-led community growth.
- [TimeTree](https://support.timetreeapp.com/hc/en-us/articles/900004492623-How-to-use-shared-calendar-app) shows how shared family calendars, invites, memos, activity, and notifications become a daily-use habit.
- [FamilySearch](https://www.familysearch.org/blog/en/online-family-tree/) shows the power of collaborative lineage building, source preservation, and privacy for living people.
- [Hallow](https://hallow.com/try-hallow/) shows how daily spiritual content, challenges, and habit design drive recurring engagement.
- [Sri Mandir on Google Play](https://play.google.com/store/apps/details?id=com.mandir) shows devotional-content demand is already large and crowded, especially around prayer content, bhajans, and calendar utilities.

### Strategic conclusion

Do not try to win on:

- generic chat
- generic forums
- generic AI
- generic devotional content

Do try to win on:

- diaspora belonging
- family continuity
- local sacred life
- trusted daily practice

## 4. Positioning Recommendation

### Best positioning

**Sanatana Sangam is the digital home for dharmic life abroad.**

That means the product promise is:

- find your nearby people
- keep your family tradition alive
- stay connected to your practice every day
- discover trusted sacred places and conversations

### Messaging that should lead

- "Find your Mandali nearby."
- "Build your family's digital dharmic home."
- "Keep your Kul, Vansh, and daily practice alive across generations."
- "Move from passive content consumption to living spiritual belonging."

### Messaging that should not lead

- "AI spirituality app"
- "All dharmic traditions, equally complete, from day one"
- "Live bhakti platform" before that experience is really shipped

### Brand scope decision

There is a real positioning tension:

- the brand says `Sanatana`
- the codebase supports Hindu, Sikh, Buddhist, and Jain flows
- several core experiences still feel Hindu-first

Recommendation:

- Phase 1 market story: Hindu / Sanatani diaspora first
- Phase 2 product story: broader dharmic expansion once parity improves

If you want true cross-tradition launch positioning now, the brand, content model, calendar logic, and copy need another full pass.

## 5. Target Audience

### Primary target

Diaspora Hindu / Sanatani users aged roughly 22-45 in the UK, Canada, US, and Australia who:

- feel culturally connected but spiritually under-supported
- want local satsang, events, mandirs, and community
- want to preserve family identity for children
- live away from extended family or temple ecosystems

### Secondary target

Family guardians, parents, and elders who want:

- a family group
- lineage preservation
- annual reminders
- family events
- simple shared spiritual routines

### Tertiary target

Community builders:

- temple volunteers
- satsang organizers
- university Hindu society leaders
- youth mentors

These users create the supply side of the product:

- they host events
- seed Mandalis
- invite families
- answer questions in Vichaar Sabha

### Who should not be the first target

- India mass-market devotional users
- all global dharmic traditions equally
- anonymous content browsers with no community intent

## 6. Core Product Gaps

### A. Trust, safety, and legitimacy gaps

- no `/about`, `/privacy`, or `/contact` routes even though the landing page links to them
- no visible Terms, community guidelines, or consent check in signup
- no user-facing report, block, mute, or hide flow in the main app
- profile copy says "contact support" but there is no support route, address, or workflow
- `Bhakti` is marketed on the landing page but is still a placeholder

### B. Spiritual accuracy gaps

- festival data is hardcoded to `2026` in `src/lib/festivals.ts`
- panchang calculations are heuristic and explicitly approximate in places
- the Panchang experience is labeled for multiple traditions, but the underlying model is still Hindu-centric
- reminders are not segmented by user tradition

For this category, trust damage is expensive. If the app gets dates or reminders wrong, users will stop trusting the product quickly.

### C. Notification and habit-loop gaps

- OneSignal permission and player ID capture exist, but server-side push delivery is not actually implemented
- admin broadcast is a UI stub
- reminder routes insert in-app notifications only
- cron reminders are not timezone-aware
- festival reminders currently target all users, not relevant users
- reminder flows are not idempotent, so retries can create duplicates

### D. Product loop gaps

- `Mandali` has posts and events, but no comments or RSVP loop
- signup captures `seeking`, but the app does not use it for onboarding or feed personalization
- invite code flow exists, but `referred_by_code` is not activated into attribution, rewards, or growth tracking
- family lineage is strong, but there is no source/document layer like FamilySearch
- no bookmark, save, follow, or revisit loop in the library
- AI chat does not provide citations or source-linked answers

### E. Operational gaps

- no committed ESLint config, so `npm run lint` becomes interactive
- no test suite
- no CI workflow
- no lockfile
- `package.json` pins `next@14.2.5`, but the installed dependency is `next@15.5.14`
- docs are out of date and do not reflect the real migration sequence and env requirements
- `schema.sql`, migrations, and `src/types/database.ts` are no longer in clean sync
- there are still many `as any` casts in production code

### F. PWA and installability gaps

- `manifest.json` references `/icons/icon-192.png` and `/icons/icon-512.png`, but those files do not exist
- `public/sw.js` exists, but there is no registration flow in the app
- the service worker references `/offline`, but there is no offline route

## 7. Code and Data Issues To Fix Before Real Market Launch

These are the highest-priority technical fixes.

### P0: Must fix before real launch

1. Replace hardcoded `2026` festival data with a maintainable source.
2. Decide whether Panchang will be truly authoritative or clearly labeled as approximate.
3. Add legal and trust pages:
   - About
   - Privacy Policy
   - Terms of Service
   - Contact / Support
   - Community Guidelines
4. Implement real user safety controls:
   - report post/thread/reply/message
   - block or mute user
   - hide content
5. Implement actual push delivery or stop marketing push notifications.
6. Fix launch tooling:
   - commit lockfile
   - align Next.js version
   - add non-interactive ESLint config
   - add CI
7. Bring schema, migrations, docs, and TypeScript database types back into one source of truth.

### P1: Should fix during beta

1. Proxy or cache Nominatim / Overpass requests server-side for reliability and rate-limit safety.
2. Add dedupe and segmentation for notification jobs.
3. Use `seeking` and tradition data to personalize the first-run experience.
4. Replace browser `confirm`, `alert`, and `window.prompt` flows with proper mobile-friendly UI.
5. Add real analytics, funnel tracking, and error monitoring.

### P2: Important hardening after beta starts

1. Reduce `any` usage and generate typed Supabase models.
2. Standardize modal, toast, share, and destructive-action patterns.
3. Add richer audit logs for moderation actions.

## 8. Security and Data Integrity Risks

### Highest-risk items found in code audit

- `kul_family_members` delete policy currently allows any Kul member to delete lineage records, with "guardian-only" behavior enforced only in UI comments.
- admin broadcast promises a send but does not actually send.
- notification jobs can create duplicate rows if retried.
- support and moderation policy are not yet visible to users.
- tradition is locked at signup, but there is no operational support path to correct mistakes.

### Data-governance recommendation

For `Kul` and `Vansh`, treat this as sensitive family memory data, not just social data. Add:

- explicit privacy settings for living vs deceased relatives
- guardian-only destructive permissions at the database layer
- audit trail for lineage changes
- export / backup path for family data

## 9. Recommended Product Roadmap

## Phase 0: Launch readiness

Goal: become trustworthy enough for a controlled pilot.

- legal pages and support path
- community guidelines and moderation reporting
- fix calendar accuracy strategy
- implement real push or strip push claims
- fix lockfile / lint / CI / docs / schema drift
- add missing PWA assets or remove incomplete PWA claims
- tighten Kul lineage permissions

## Phase 1: Make the core loop sticky

Goal: users return weekly without paid acquisition.

- Mandali comments and replies
- event RSVPs and reminders
- organizer profiles
- saved posts / bookmarked scriptures
- family recurring reminders
- onboarding based on `seeking`
- referral attribution with invite rewards

## Phase 2: Build the moat

Goal: deepen the family + local-community wedge.

- verified temple / organizer pages
- recurring satsang templates
- family archive uploads: photos, stories, documents
- child / parent practice plans
- elder-friendly flows and larger-font mode
- multilingual transliteration and audio pronunciation
- source-backed AI answers with "Ask a teacher" escalation

## Phase 3: Expand carefully

Goal: broaden reach without losing focus.

- richer Sikh / Buddhist / Jain parity if you keep broad positioning
- live bhakti only after community/event primitives are strong
- temple partnerships and organizer tooling
- premium family or organizer features

## 10. Feature Ideas That Fit The Product

These are the best additions, ordered by strategic fit.

### High-fit additions

- Mandali comments
- event RSVP and attendance
- recurring satsang or festival event templates
- family anniversary and shraddha reminders
- family story archive
- "new in your city" community onboarding
- mentor / elder matching
- temple and organizer verification
- scripture bookmarks and reading plans
- dharmic kids mode or family mode

### Medium-fit additions

- audio recitation and pronunciation
- challenge mode: 7-day Gita, Hanuman Chalisa, Japji, Metta, etc.
- weekly digest email or WhatsApp-shareable summaries
- curated local resource directory:
  - priests
  - classes
  - youth groups
  - language classes

### Lower-fit additions for now

- marketplace or commerce
- broad creator monetization
- too much generic AI
- live-room features before the event/community layer is mature

## 11. Go-To-Market Plan

### Launch geography

Start in a few dense diaspora corridors:

- London
- Leicester
- Birmingham
- Toronto
- Greater Toronto Area
- New York / New Jersey

These markets fit both the codebase and the audience story.

### Launch motion

1. Seed community organizers first.
2. Seed family guardians second.
3. Open user invite loop third.

### Acquisition channels

- temple partnerships
- Hindu student societies
- satsang and youth organizers
- WhatsApp group admins
- family referrals
- diaspora Instagram and short-form creator partnerships

### What to sell in the pitch

- "find your people nearby"
- "bring your family dharma together"
- "do not let culture stop at nostalgia"

## 12. Metrics To Track

Do not launch without instrumentation for these:

- signup completion rate
- % of signups who join a Mandali in first 24 hours
- % of signups who complete profile
- % who create or join a Kul
- 7-day retention
- 30-day retention
- posts per active Mandali
- events created per week
- RSVP rate
- invite-to-signup conversion
- push opt-in rate
- weekly active families
- weekly active organizers

### North-star candidate

**Weekly active dharmic households**

That is stronger than MAU because it matches the real value proposition: family and community continuity.

## 13. 90-Day Recommended Execution Plan

### Days 1-15

- fix legal pages
- fix support path
- fix notification truthfulness
- fix dependency and CI setup
- decide festival and Panchang data strategy
- close Kul lineage permission gap

### Days 16-35

- implement reporting, block, mute
- add analytics and error monitoring
- activate referral attribution
- add Mandali comments
- add RSVP to Mandali events

### Days 36-60

- personalize onboarding from `seeking`
- add family recurring reminders
- add bookmark and reading-plan loop
- add verified organizer profile model

### Days 61-90

- soft launch with 3-5 pilot communities
- weekly user interviews
- double down on organizer tools and family retention
- remove or defer low-traction surfaces

## 14. Final Recommendation

The app should not be treated as "almost ready for full market." It is closer to:

**strong private beta / pilot quality with real differentiation**

That is good news. The foundation is promising.

If you focus the product on diaspora belonging, family continuity, and trusted daily practice, this can become a meaningful product.

If you try to launch it as:

- a fully mature cross-tradition platform
- a polished PWA
- a live bhakti product
- a notification-rich community app

without fixing the gaps above, the product will feel broader than it is and trust will drop quickly.

The right move is:

- narrow the launch story
- harden trust and operations
- deepen the family and local-community loops
- then expand

## 15. Sources

- ONS Religion, England and Wales: [https://www.ons.gov.uk/peoplepopulationandcommunity/culturalidentity/religion/bulletins/religionenglandandwales/census2021?t=](https://www.ons.gov.uk/peoplepopulationandcommunity/culturalidentity/religion/bulletins/religionenglandandwales/census2021?t=)
- Statistics Canada religious diversity release: [https://www150.statcan.gc.ca/n1/daily-quotidien/221026/dq221026b-eng.htm](https://www150.statcan.gc.ca/n1/daily-quotidien/221026/dq221026b-eng.htm)
- Pew Religious Landscape Study: [https://www.pewresearch.org/religious-landscape-study/database/](https://www.pewresearch.org/religious-landscape-study/database/)
- Pew religion among Asian Americans: [https://www.pewresearch.org/religion/2023/10/11/in-their-own-words-cultural-connections-to-religion-among-asian-americans/](https://www.pewresearch.org/religion/2023/10/11/in-their-own-words-cultural-connections-to-religion-among-asian-americans/)
- Circle: [https://circle.so/](https://circle.so/)
- Geneva: [https://www.geneva.com/about](https://www.geneva.com/about)
- Meetup: [https://www.meetup.com/](https://www.meetup.com/)
- TimeTree shared calendar help: [https://support.timetreeapp.com/hc/en-us/articles/900004492623-How-to-use-shared-calendar-app](https://support.timetreeapp.com/hc/en-us/articles/900004492623-How-to-use-shared-calendar-app)
- FamilySearch shared family tree: [https://www.familysearch.org/blog/en/online-family-tree/](https://www.familysearch.org/blog/en/online-family-tree/)
- Hallow: [https://hallow.com/try-hallow/](https://hallow.com/try-hallow/)
- Sri Mandir Google Play listing: [https://play.google.com/store/apps/details?id=com.mandir](https://play.google.com/store/apps/details?id=com.mandir)
