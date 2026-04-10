# Sanatana Sangam Roadmap

Last updated: 2026-04-09

## Purpose

This file tracks how we move from a promising beta into a polished product.

It separates:

- `Phase A`: trust, safety, correctness, and launch readiness
- `Phase B`: product differentiation and moat-building

Rule:

- `Phase A` must be credible before `Phase B` becomes the main build lane
- `Phase B` can be designed and groomed in parallel, but major implementation should not outrun trust work

## Status Legend

- `Blocked`: should not start yet because a dependency is unresolved
- `Planned`: defined and ready for deeper scoping
- `Ready`: can move into build when capacity opens
- `In Build`: active implementation lane
- `Shipped`: live in product

## Current Build Logic

### What happens first

1. Finish `Phase A1` trust core
2. Finish `Phase A2` social safety and platform hardening
3. Move into `Phase B1` personalized belonging
4. Then deepen `Phase B2` knowledge trust loops
5. Then build `Phase B3` family memory moat

### Why

This order protects the product from becoming more feature-rich while still being less trustworthy than it needs to be.

## Parallel Execution Model

Yes, we can do `Phase A` and `Phase B` together, but not in the same way.

The operating model should be:

- `Phase A` = active build lane
- `Phase B` = active shaping lane, with selected low-risk implementation in parallel

That means we keep shipping trust-critical work while also preparing the moat.

### What can happen in parallel

We can actively do both when the work falls into different buckets:

- `Phase A`: correctness, safety, infrastructure, trust, moderation, privacy
- `Phase B`: UX shaping, data modeling, UI system, low-risk product loops

### What should not happen

We should not let `Phase B` add major new social complexity before the trust layer is ready.

Examples of `Phase B` work that should wait for stronger `Phase A` completion:

- scholar verification going fully live before the trust model is defined
- family memory uploads before privacy and source rules are clear
- aggressive personalized nudges before analytics and safety basics exist

### Practical working rule

At any given time:

- one `Phase A` item is the primary implementation lane
- one `Phase B` item is the primary shaping or low-risk build lane

## Current Active Lanes

### Primary build lane

- `Phase A1`

### Parallel shaping lane

- `B1.1 Personalized home and onboarding from seeking`

### Parallel design lane

- `Sacred Clay` system for selected `Phase B` surfaces
- palette unification around the new warm maroon + saffron + ivory system
- reusable editor-sheet pattern based on the home greeting flow
- a future `Panchang experience` layer with sky-led atmosphere, gentle motion, strong readability, and optional haptics where devices support them
- a structured section-by-section product polish lane tracked in `UX_SWEEP_PLAN.md`
- the first Panchang UX sweep is now in build across the full Panchang page and the home widget so sacred-time feels like one coherent surface
- the first Kul UX sweep is now in build so the family hub reads as “what should I do next?” instead of six equal destinations competing at once
- the first Home UX sweep is now in build so the user lands on one calm daily ritual lane before utilities, discovery, and secondary actions
- the first Profile UX sweep is now in build so identity, practice, place, and safety read as distinct areas instead of one long administrative sheet
- the first Pathshala UX sweep is now in build so reading, recitation, and trust enter through calmer sanctuary-style lanes instead of dense stacked information
- the first Vichaar UX sweep is now in build so threads and replies feel like a guided wisdom space instead of a generic forum
- the first Tirtha Map UX sweep is now in build so sacred-place discovery feels calmer and more guided than a raw map utility
- the first auth/front-door UX sweep is now in build so signup, login, guest access, invites, and recovery feel like one welcoming entry system
- language support should be built in layers: sacred content script/transliteration first, then app UI localization, then deeper per-user preference control
- devotional music discovery should begin as a curated catalog + ranking layer with open-out links, not a hosted streaming surface
- the first approved devotional launch pack is now tracked in `APPROVED_AUDIO_PACK.md`, and the storage/scale model is tracked in `MEDIA_REGISTRY_PLAN.md`
- the first AI chat UX sweep is now in build so Dharma Mitra feels like a calmer reflection companion instead of a blank utility surface
- the first Bhakti UX sweep is now in build so the devotional area offers a meaningful preview path before the larger audio/social feature set arrives
- the next notification lane is now concrete: profile-level reminder preferences, quiet hours, cron filtering, and then production verification of real sends
- the Home “next step” posture should keep shrinking: one primary action on the dashboard, with broader guidance moved into notifications and reminders instead of large homepage card stacks
- the first app-foundation pass is now in build so shared UI primitives, stronger design tokens, reduced-motion defaults, and a TanStack Query provider can support future client-heavy surfaces without one-off styling or fetch logic

### Next eligible low-risk `Phase B` implementation

Once `B1.1` is shaped well enough, we can start small pieces before all of `Phase A` is finished:

- personalized home modules
- onboarding checkpoints
- guided path card system

These are safe to build earlier because they do not create new trust or moderation risk by themselves.

## Phase A1 — Trust Core

Status: `In Build`

Goal:
Make the app spiritually and operationally trustworthy.

### A1.1 Festival truth layer

Status: `In Build`

Outcome:

- remove the single-year hardcoded festival dependency
- support multi-year data
- clearly represent tradition-specific and shared festivals

Work:

- replace `src/lib/festivals.ts` static year dependency with a maintainable calendar source
- define how dates are sourced, refreshed, and reviewed
- ensure reminder logic is tied to trustworthy dates

Exit criteria:

- no hardcoded single-year festival calendar in production path
- reminder jobs use the same trusted festival source
- product copy no longer overstates certainty where data is approximate

Current slice:

- Home festival browsing now reads from the shared Supabase `festivals` table when available
- the curated `2026` in-app list is now explicitly labeled as a fallback edition instead of pretending to be the only truth source
- calendar and countdown surfaces now show coverage/source notes so users understand whether they are seeing shared DB-backed data or fallback data
- `migration-v17-sacred-time-trust.sql` now adds tradition, source, and review metadata to the festival table so Home and reminder jobs can stop depending on static name matching once the DB is updated

### A1.2 Panchang accuracy strategy

Status: `In Build`

Outcome:

- clarify what the app can calculate accurately
- avoid overclaiming spiritual precision
- align UI copy, backend logic, and tradition scope

Work:

- decide engine or API approach
- align timezone, location, and tradition behavior
- make approximation explicit wherever needed

Exit criteria:

- panchang logic and product copy are aligned
- reminder timing is timezone-aware
- user trust is protected through clear labeling

Current slice:

- Home and full Panchang screens now explicitly label the current Panchang as a location-based estimate
- the UI now tells users it is suitable for daily guidance while temple- or guru-specific observance timing may still need verification
- the next slice is improving the engine/source strategy itself instead of leaving silent approximation in place
- `PANCHANG_SOURCE_STRATEGY.md` now defines the launch posture and the next trusted-source decision boundary for sacred-time features
- the current engine now uses sidereal longitudes for nakshatra, yoga, and masa plus a stronger sunrise/sunset estimate, so the in-app Panchang is less approximate than the first beta implementation
- `migration-v18-sacred-time-delivery.sql` now adds user timezone and notification dedupe fields so sacred-time reminders can respect local time instead of one global send window

### A1.7 Sacred-time delivery and Jyotish definition

Status: `In Build`

Outcome:

- sacred-time notifications behave per user locale instead of one server-centric clock
- Jyotish scope is defined before any Rashi feature ships

Work:

- store a user timezone on profile
- move sacred-time reminder jobs to hourly windows with dedupe keys
- define Jyotish as reflective, opt-in guidance instead of entertainment-style prediction

Exit criteria:

- reminder jobs are segmented, deduplicated, and timezone-aware
- Jyotish scope is documented before product claims expand

Current slice:

- `JYOTISH_STRATEGY.md` now defines the trust-first product posture
- shloka and festival reminder routes now target local-hour windows and dedupe per user/day key
- the remaining rollout step is running `migration-v18-sacred-time-delivery.sql` and letting Vercel pick up the current daily cron schedule on Hobby
- if sacred-time timing needs to become more precise again, move reminder execution to a more flexible hosting/background-job setup than Vercel Hobby cron
- once the trust core is live, Panchang can move into a dedicated experience pass:
  - time-of-day sky background
  - calmer transitions between days
  - sacred-time ribbon for sunrise / sunset / Rahu Kaal / Abhijit
  - large high-contrast cards that remain elder-friendly
  - optional light haptics on meaningful actions only

### A1.3 Library provenance

Status: `In Build`

Outcome:

- scripture and devotional content becomes source-aware, not just excerpt-based

Work:

- add provenance fields where missing
- normalize citation display in Library and Home
- define editorial standard for imported or curated entries

Exit criteria:

- key content surfaces show reliable source provenance
- the editorial standard is documented

Current slice:

- source-type labels are now visible in Library
- entry-level source notes are now present
- this still needs an editorial standard and broader provenance consistency pass

### A1.4 AI trust layer

Status: `In Build`

Outcome:

- AI becomes source-guided and humility-aware instead of only conversational

Work:

- add source-linked answer format
- distinguish reflective guidance from text-grounded answers
- add "I don't know" / "this should be verified" behavior

Exit criteria:

- AI can cite or clearly qualify spiritually sensitive answers
- unsupported confidence is reduced

Current slice:

### A2.2 Mandali depth

Status: `In Build`

Outcome:

- Mandali feels like a living local community instead of a static post list

Work:

- add comments and replies on Mandali posts
- add RSVP state on Mandali events
- keep local conversation warmer and more action-led

Exit criteria:

- members can respond to posts without leaving the feed
- event posts carry real participation state instead of passive details only

Current slice:

- Mandali now has post comments, inline replies, and event RSVP state in the app layer
- `migration-v20-mandali-bhakti-depth.sql` adds the data model for comments, RSVP, and Bhakti practice history

### B2.4 Bhakti practice modes

Status: `In Build`

Outcome:

- Bhakti stops being a placeholder and becomes a practical devotional entry point

Work:

- launch first live `Zen` route
- launch first live `Mala` route
- keep audio and chant expansion rights-safe
- the first Bhakti audio foundation is now live as a source-first starter pack surface, with in-app playback still deferred until attribution and player state are stronger

Exit criteria:

- users can open a calmer focus surface today
- users can track and save mala sessions today

Current slice:

- `/bhakti/zen` now provides a calmer focus timer for reading, breath, and chant sessions
- `/bhakti/mala` now provides a large-tap japa tracker with saveable session history and basic sharing
- the next Bhakti depth pass now adds a clearer return loop: filtered Mala history, stronger share text, mantra continuity, and a more intentional chant posture inside Zen

- AI now receives an internal reference pack from Library matches
- the UI now shows whether a reply is `Source-guided` or `Reflective guidance`
- this still needs stronger grounding policy and broader source coverage

### A1.5 User-side safety basics

Status: `In Build`

Outcome:

- users can protect themselves without needing admin intervention first

Work:

- add report flow from main app
- add block / mute / hide controls
- ensure moderation state is reflected in user experience

Exit criteria:

- reporting exists in user-facing product
- users can control unwanted interactions

Current slice:

- Mandali and Vichaar now have user-facing report / block / mute / hide controls
- hidden, muted, and blocked content is now filtered out of the main social surfaces
- profile now includes a `Safety & Visibility` section for undoing those actions
- this still needs live migration rollout and end-to-end product QA on the deployed app

### A1.6 Parampara Pathshala corpus and source governance

Status: `In Build`

Outcome:

- scripture learning becomes a trustworthy product surface instead of a quote archive

Plan:

- rename `Parampara Library` to `Parampara Pathshala`
- define a tradition-first information architecture:
  - tradition -> scripture category -> text / lesson
- create a source governance model for every text:
  - source owner
  - rights status
  - canonical vs commentary vs curated lesson
  - language and script support
  - provenance and revision metadata
- prefer a catalog-first rollout where rights-cleared full texts are ingested and everything else remains clearly linked out

Exit criteria:

- the Pathshala structure is tradition-first
- every in-product text has a rights status and provenance label
- source legitimacy is clear enough for production, not just development

Current slice:

- `PARAMPARA_PATHSHALA_PLAN.md` now defines the recommended structure and source strategy
- `PATHSHALA_SOURCE_POLICY.md` now defines the operational rule set for `live_public_domain`, `live_rights_cleared`, `companion_only`, and `catalog_only` text families so launch claims can match corpus reality
- this work belongs in `Phase A` because corpus legitimacy is a trust issue, not just a content issue
- the first Pathshala UI slice is now shipped:
 - text-level trust checks now show source class, translation readiness, original-text status, and recitation readiness directly on Pathshala reading pages, so source truth is visible where people actually study
  - `Parampara Library` has been renamed to `Parampara Pathshala`
  - the reading surface now starts with tradition tiles
  - scripture categories and study tracks now sit between tradition and individual passages
  - the root `/library` page is now being tightened into a true tradition gateway, so excerpts and track browsing happen only after the user chooses a tradition
- the next active slice is to deepen section-level corpus metadata, rights-awareness, and source-governance cues inside the Pathshala tracks
- the current build now adds section-level metadata such as:
  - corpus state
  - complete-text goal
  - source targets
  - planned study modes
- route-driven Pathshala detail architecture is now active:
  - `/library/[tradition]` for tradition home pages
  - `/library/[tradition]/[section]` for track pages
  - `/library/[tradition]/[section]/[entryId]` for text / lesson pages
- the next active slice is to add continue-learning loops, bookmarks, and deeper rights metadata around those routes
- Bhagavad Gita is now the first complete chapter-structured Pathshala pilot:
  - all 18 chapters are mapped as a study path
  - the full local chapter-and-verse corpus is now live from a public-domain Annie Besant Wikisource edition
  - this source path currently yields 701 verses because it follows the 35-verse chapter-13 tradition; that edition truth should remain explicit in product copy and provenance
  - chapter pages now keep the full reading flow inside Pathshala while still linking out to companion official audio and commentary layers
  - the Pathshala source note now makes it explicit that Sanskrit + meaning are source-backed and transliteration is generated from the Sanskrit text
  - first reading plans now point into the complete chapter map so users can study in a defined rhythm instead of browsing randomly
  - return loops now work at the chapter layer too, so users can bookmark and resume canonical Gita chapters rather than only the smaller excerpt entries
  - this is now the active canonical focus for the next iteration, with a dedicated Gita-first recitation mode that keeps Pathshala local for study and uses authoritative IIT audio as the recitation companion
  - this is the model text family for future Ramayana and broader canon work, but those wider canon expansions are intentionally on hold until the Gita study + recitation flow feels complete end to end
- the next canon lane is now active for Valmiki Ramayana:
  - Ramayana now opens as a Kanda-first study path instead of a flat excerpt list
  - Kanda pages carry summaries, reading plans, AI study prompts, and companion-source links
  - the live Ramayana passages are now grouped back into their wider narrative home rather than feeling like disconnected quotations
  - this lane is now paused while the Gita study + authoritative recitation flow is completed
- the Upanishad lane is now materially deeper too:
  - the 13 principal Upanishads are now live locally as full translated study texts
  - the live source path is Robert Ernest Hume's 1921 public-domain translation via the Internet Archive OCR corpus
  - this is intentionally honest about what is live now: full translated study text, not yet a complete original-script plus transliteration corpus
  - the next source-governance step is to add rights-safe Sanskrit and recitation layers instead of pretending that source problem is already solved
- the next Upanishad iteration is now underway:
  - official Vedic Heritage companion pages are mapped for the principal Upanishads
  - where those pages expose the Sanskrit directly, the original layer is now being brought into Pathshala itself
  - Taittiriya Upanishad has now been promoted into that live original-text lane by stitching together Shiksha Valli, Brahmananda Valli, and Bhrigu Valli from the official source pages
  - the first import cleaner now strips scrape junk like embedded English `Part / Canto` headings and broken glyph artifacts before those texts are treated as live in app
  - where the official source is still summary-plus-flipbook, Pathshala now keeps that honestly in `companion` state instead of pretending full original-text ingestion is complete
  - this creates a visible study-layer model: translated text live, original Sanskrit live where source-accessible, recitation still companion-first
  - the Upanishad track now surfaces that model clearly to users by grouping live-original texts ahead of companion-original texts instead of leaving the source state implicit
  - the remaining blockers are now described in-product too, so users can see when a text is companion-only because the official source is still summary/flipbook shaped rather than clean scripture text
  - this wider original-text expansion is now temporarily paused while the Gita-first recitation/audio lane is completed
- AI-assisted reading and recitation are staged behind that corpus work:
  - first: source-aware explain, quiz, flashcards, and guided reading
  - first live bridge is now in place:
    - Gita chapter pages open Pathshala-aware prompts inside Dharma Mitra
    - the AI surface receives the chapter context so users can start with a prefilled study question instead of restating the source
    - principal Upanishad pages now carry the same first-wave study actions so long-form texts can open into explanation, recall, and revision flows instead of dead-ending as static reading pages
  - first UX polish layer is now live with Framer Motion on shell, Home overlays, and Pathshala transitions so the app feels calmer without over-animating long reading surfaces
  - first recitation implementation is now Gita-specific: a dedicated Gita recitation mode that keeps authoritative audio on the IIT companion source instead of faking local chanting
  - the first audio foundation layer is now active for Gita:
    - chapter-by-chapter recitation tracks are structured in-app
    - users can enter a focused recitation mode, open the authoritative companion audio, keep local listening progress, and return straight to the study chapter
    - this creates the player-state and chapter-registry shape needed before hosted playback is introduced
  - later: Pathshala audio controls, pronunciation help, and only then recitation scoring
  - next deferred Gita milestone:
    - bring authoritative Gita audio into the app itself after source-rights and hosting strategy are confirmed
    - keep chapter-to-audio mapping, return-to-study flow, and playback state inside Pathshala
    - do not rush this by embedding uncertain sources or unlabeled third-party audio
  - the next source-governance step after policy definition is to make rights state more machine-readable in corpus metadata instead of only visible through copy

## Phase A2 — Social Safety And Platform Hardening

Status: `Planned`

Goal:
Make the social product safer, more complete, and easier to ship with confidence.

### A2.1 Mandali event loop

Status: `Planned`

Outcome:

- `Mandali` moves from feed to real local participation loop

Work:

- comments / replies
- RSVP states
- event follow-through
- reminder and attendance touchpoints

Exit criteria:

- a local event can go from post -> RSVP -> reminder -> follow-up

### A2.2 Location and privacy controls

Status: `Planned`

Outcome:

- local discovery remains useful without exposing users too aggressively

Work:

- explicit location visibility controls
- clearer city / neighborhood / precise-location behavior
- privacy copy for sensitive identity surfaces

Exit criteria:

- users understand what location data is being used
- visibility can be controlled safely

### A2.3 Engineering hardening

Status: `In Build`

Outcome:

- the repo becomes deterministic enough for confident iteration and release

Work:

- commit lockfile
- make ESLint non-interactive
- add CI for build and lint
- continue schema / migration / type alignment

Exit criteria:

- clean install path exists
- CI protects core build quality
- types and schema drift are reduced

Current slice:

- `package-lock.json` is now committed so installs can become deterministic
- ESLint now runs non-interactively from a committed config
- CI now runs lint and build on pushes and pull requests
- this still needs the remaining warning cleanup and continued schema/type alignment work

## Phase B1 — Personalized Belonging

Status: `In Build`

Depends on:

- `Phase A1`
- at least the core of `Phase A2`

Goal:
Make the product feel like it understands why the user came and what they should do next.

### B1.1 Personalized home and onboarding from `seeking`

Status: `In Build`

Outcome:

- signup intent changes the first-week experience
- home becomes more relevant immediately

Plan:

- treat `seeking` as a first-class personalization signal
- create a simple mapping from `seeking` -> recommended modules, nudges, and first actions
- add first-week onboarding cards instead of one-size-fits-all home

Build slices:

- data: define personalization rules and persisted onboarding state
- backend: derive recommended next actions
- UI: personalized cards, home sections, and onboarding checkpoints
- analytics: first-week conversion by `seeking`

Exit criteria:

- users with different `seeking` paths see meaningfully different first experiences

Current slice:

- Home now renders personalized path cards from `seeking`
- early guided paths for `New to dharma` and `New to the city` are live
- the home greeting editor now uses tradition-based presets with a reliable custom override flow
- guided path progress is now persisted so cards can be dismissed, completed, and restored
- next step is to add deeper first-week checkpoints and route-specific completion signals

### B1.2 `New to the city` and `new to dharma` guided paths

Status: `Blocked`

Outcome:

- newcomers are guided, not dumped into the app

Plan:

- create two guided path types:
  - `New to the city`
  - `New to dharma`
- each path should recommend a small number of high-confidence next steps

Build slices:

- define entry conditions
- create guided cards, progress states, and completion markers
- connect paths to `Mandali`, `Tirtha Map`, `Library`, and `Vichaar Sabha`

Exit criteria:

- a newcomer can complete a short, confidence-building guided journey in their first session or week

### B1.3 Religious language and script support

Status: `Planned`

Outcome:

- the app can welcome users in familiar devotional languages without turning content accuracy into guesswork

Plan:

- separate UI localization from sacred-text script and translation support
- support script toggles first: original script, transliteration, and trusted English meaning
- then add product-language packs for common launch audiences such as English, Hindi, and Punjabi

Build slices:

- content: normalize original-script, transliteration, and meaning fields across Library, Home, and AI references
- platform: add locale dictionaries and route-safe UI copy switching
- the first language preference layer now persists app language, scripture view, transliteration visibility, and meaning-language intent through profile settings and Pathshala reading surfaces
- trust: mark whether a translation is canonical, curated, or reflective
- UX: remember per-user language and script preferences

Exit criteria:

- users can change script / language preferences without losing source trust
- the core devotional surfaces remain legible and accurate in at least the launch languages

## Phase B2 — Knowledge Retention And Trust

Status: `Blocked`

Depends on:

- `Phase A1`

Goal:
Turn knowledge surfaces into repeat-usage loops rather than one-off browsing.

### B2.1 Bookmarks, reading plans, and revisit loops in Library

Status: `Blocked`

Outcome:

- Library becomes a habit surface, not just a searchable archive

Plan:

- save entries
- add reading plans
- create "continue reading" and "saved for later" loops
- surface revisit prompts on home

Build slices:

- data: bookmarks, reading progress, plan assignments
- backend: progress tracking and retrieval
- UI: save state, reading stacks, revisit modules

Exit criteria:

- users can save, resume, and complete reading journeys

### B2.2 Accepted answers and scholar verification in Vichaar Sabha

Status: `Blocked`

Outcome:

- knowledge trust increases without flattening community participation

Plan:

- add accepted-answer flow for Q&A-style threads
- add scholar / mentor verification badges and limited trust signals
- keep categories broad and rely on tags for specificity

Build slices:

- data: accepted answer state, verification metadata
- moderation: review and badge workflow
- UI: accepted answer display, scholar badge treatment, explanation of what verification means

Exit criteria:

- `Vichaar Sabha` can distinguish helpful, accepted, and trusted answers clearly

### B2.3 Pathshala learning engine

Status: `Blocked`

Depends on:

- `A1.6 Parampara Pathshala corpus and source governance`

Outcome:

- Pathshala becomes a repeat-learning system rather than a static reading surface

Plan:

- add bookmarks, reading plans, and continue-learning loops
- add flashcards and spaced revision prompts
- add chapter quizzes and mastery checkpoints
- add interleaved review across related concepts
- add exams or milestone assessments only after the corpus and provenance layer is trustworthy
- add AI-assisted study helpers:
  - explain this verse
  - simplify this chapter
  - make flashcards
  - quiz me
- add recitation mode in two stages:
  - authoritative audio / recite-along where source rights allow
  - pronunciation / recitation feedback only after the trust and audio layer are credible
- prioritize Gita for the first in-app authoritative audio rollout; keep other scripture audio expansions behind that proven implementation
- use `Howler` only at that audio stage:
  - Pathshala recitation playback
  - guided reading audio
  - optional, not ambient app-wide sound

Build slices:

- data: course progress, flashcard state, quiz attempts, mastery thresholds
- backend: recommendation and revisit scheduling
- UI: chapter cards, revision prompts, quiz surfaces, exam flow
- bridge state:
  - Pathshala-aware AI prompt links
  - official-source verse navigation until the full in-app corpus is ingested
- trust: keep canonical text and assessment content clearly labeled

Exit criteria:

- users can learn, revise, and demonstrate mastery inside Pathshala
- the learning loop is grounded in source-aware content rather than random excerpts

### B2.4 Contemplation modes: Zen mode and Mala mode

Status: `Planned`

Depends on:

- `A1.6 Parampara Pathshala corpus and source governance`
- `B2.3 Pathshala learning engine`

Outcome:

- the app supports quiet practice, repetition, and devotional continuity instead of only study and browsing

Plan:

- add `Zen mode` as a distraction-light Pathshala surface:
  - larger text
  - calmer spacing
  - fewer chrome elements
  - optional verse-by-verse or chapter reading focus
- add `Mala mode` as a first-class japa practice surface:
  - large bead counter and progress ring
  - elder-friendly controls and contrast
  - session notes, sankalpa, mantra selection, and completion history
  - weekly / monthly statistics and streaks
  - shareable summary cards only when the user opts in
- add audio in two stages:
  - stage 1: rights-safe chant / mantra clips and authoritative recitation where source terms are clear
  - stage 2: richer bhajan / kirtan library after license and attribution rules are verified

Build slices:

- data:
  - mala sessions
  - mantra presets
  - completion counts
  - optional sankalpa and notes
  - privacy and sharing preferences
- UI:
  - low-distraction reading mode
  - one-handed large-target japa controls
  - elder-friendly stats and history views
  - share cards and revisit loops
- audio:
  - a vetted source registry
  - playback state
  - optional offline-safe caching later
- trust:
  - source / rights metadata on every audio asset
  - no ambiguous devotional audio bundled into the app

Exit criteria:

- users can complete a quiet reading or japa session inside the app without friction
- elder users can understand and operate the core Mala flow without hidden gestures or tiny controls
- devotional audio in-product is explicitly rights-safe and attributable

## Phase B3 — Family Memory Moat

Status: `Blocked`

Depends on:

- `Phase A1`
- `Phase A2`
- `B1` or `B2` design system groundwork

Goal:
Turn `Kul` / `Vansh` into the most emotionally durable surface in the app.

### B3.1 Family memory vault in `Kul` / `Vansh`

Status: `Blocked`

Outcome:

- family continuity becomes living memory, not just family structure

Plan:

- add memories tied to family members, dates, or rituals
- support photos, notes, stories, and source-like references
- make living-family privacy rules explicit

Build slices:

- data: memory records, attachments, visibility, family links
- backend: create/read/update privacy-safe memory retrieval
- UI: memory cards, anniversaries, remembrance surfaces, prompts

Exit criteria:

- a family can preserve and revisit meaningful memories privately and intentionally

Current slice:

- the first clay-inspired `Vansh` portrait cards are now live while preserving the lineage structure
- the rough figurine-style avatar treatment is being removed in favor of calmer keepsake medallions
- `Kul` is now moving from cramped in-page tabs toward a hub + full-page section architecture
- `Kul` now starts a family-profile layer too, where members can open one another’s Kul-safe details without leaving the family space
- this is a visual and emotional groundwork slice, not the full family memory vault yet

## Cross-Cutting Design Track — Sacred Clay

Status: `In Build`

Goal:
Introduce a `glass + clay hybrid` design system to make the moat features feel warmer, more tactile, and more emotionally grounded.

Rule:

- keep the current warm glass shell for navigation, overlays, and airy sacred surfaces
- use claymorphism selectively for intimate, memory-heavy, and guided surfaces

Apply first to:

- onboarding cards
- guided path cards
- library reading-plan stacks
- `Kul` / `Vansh` memory surfaces
- scholar verification seals and trust badges

Current slice:

- claymorphic treatment has started on personalized home guidance and trust panels
- the app shell palette is now shifting toward warm maroon, saffron, ivory, and soft earth
- `Kul` / `Vansh` is moving from rough clay figurines to keepsake medallions and calmer lineage cards
- `COLOR_STRATEGY.md` now tracks the research basis and usage rules for the palette direction
- the next polish pass is to remove remaining green and cool-color holdouts from high-traffic screens
- the home greeting editor is becoming the reusable sheet pattern for profile and other key edit flows
- the rest of the app shell remains glass-first

## Sacred Time Expansion

Status: `Planned`

Goal:
Grow `Panchang`, festivals, and later Jyotish into one coherent sacred-time product instead of disconnected utilities.

Next candidate slices:

- trustworthy Panchang and festival backbone
- opt-in `Rashi guidance` after the time and calculation layer is credible
- personalized sacred-time reminders only after timezone and trust controls are stable

Do not lead with it on:

- dense forum lists
- map-heavy views
- admin tools
- AI message stream

## How We Will Track Progress

### Launch tracker

`LAUNCH_TRACKER.md` remains the short operational tracker for launch blockers and near-term beta tasks.

### This roadmap

`ROADMAP.md` tracks:

- build order
- dependencies
- what is blocked vs ready
- the intended outcome of each track

### Working style

For each roadmap item we should move through:

1. discovery / shaping
2. schema + data design
3. backend contracts
4. UI build
5. polish + verification

## Immediate Recommendation

Current active lane should be:

- finish `Phase A1`

Current shaping lane should be:

- define `B1.1 Personalized home and onboarding from seeking`

Current parallel implementation lane can be:

- build low-risk UI and state foundations for `B1.1` while `Phase A1` is underway

## Supporting Architecture Files

- `PARAMPARA_PATHSHALA_PLAN.md`
  Pathshala structure, source model, and learning direction
- `AUDIO_ARCHITECTURE_PLAN.md`
  Shared player model, source classes, and Gita-first audio rollout

That keeps us moving on the moat without building on weak trust foundations.
