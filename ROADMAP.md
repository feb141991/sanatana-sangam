# Sanatana Sangam Roadmap

Last updated: 2026-04-03

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

Status: `Planned`

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

### A1.2 Panchang accuracy strategy

Status: `Planned`

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
- this work belongs in `Phase A` because corpus legitimacy is a trust issue, not just a content issue
- the first Pathshala UI slice is now shipped:
  - `Parampara Library` has been renamed to `Parampara Pathshala`
  - the reading surface now starts with tradition tiles
  - scripture categories and study tracks now sit between tradition and individual passages
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
- Bhagavad Gita is becoming the first complete chapter-structured Pathshala pilot:
  - all 18 chapters are now mapped as a study path
  - chapter pages can route users to official-source full text and audio while local ingestion grows
  - this is the model text family for future Ramayana and broader canon work
- AI-assisted reading and recitation are staged behind that corpus work:
  - first: source-aware explain, quiz, flashcards, and guided reading
  - later: authoritative audio support, pronunciation help, and only then recitation scoring

### A1.7 Sacred time and Jyotish strategy

Status: `Planned`

Outcome:

- any future Rashi guidance feels spiritually credible rather than like a generic horoscope widget

Work:

- define what `Rashiphal` means in-product:
  - transit-based rashi guidance
  - janma-rashi guidance
  - or a broader Jyotish surface
- define the calculation and data model:
  - date
  - time
  - place
  - timezone
  - school / tradition assumptions
- align product language toward guidance, humility, and opt-in use rather than prediction certainty
- connect the feature to Panchang and sacred-time trust work instead of building it as a separate entertainment layer

Exit criteria:

- the feature scope is explicitly defined
- privacy and birth-data handling are documented
- disclaimers and trust language are ready before UI promises expand
- no horoscope-like product claims ship before the calculation model is agreed

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

Build slices:

- data: course progress, flashcard state, quiz attempts, mastery thresholds
- backend: recommendation and revisit scheduling
- UI: chapter cards, revision prompts, quiz surfaces, exam flow
- trust: keep canonical text and assessment content clearly labeled

Exit criteria:

- users can learn, revise, and demonstrate mastery inside Pathshala
- the learning loop is grounded in source-aware content rather than random excerpts

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

That keeps us moving on the moat without building on weak trust foundations.
