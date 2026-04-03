# Launch Tracker

Last updated: 2026-04-03

## Current Focus

- [x] Create strategy brief: `PRODUCT_LAUNCH_PLAN.md`
- [x] Review original brainstorm and product moat: `BRAINSTORM_REVIEW.md`
- [x] Create execution roadmap: `ROADMAP.md`
- [x] Add public trust pages: `about`, `privacy`, `terms`, `contact`, `guidelines`
- [x] Add signup consent linked to public policies
- [x] Verify build after trust-surface pass
- [x] Tighten Kul / Vansh guardian permissions in UI and RLS
- [ ] Complete `Phase A1` trust core before major `Phase B` build starts
- [ ] Run dual-track delivery: `Phase A` as build lane, `Phase B` as shaping / low-risk parallel lane
- [ ] Deepen the current dual-track slice: Library/AI trust layer + personalized home from `seeking`
- [ ] Finish the user-side safety slice: report, block, mute, hide, and profile management
- [x] Ship the current home polish slice: reliable tradition greeting editor + custom override
- [ ] Deepen the `Kul / Vansh` visual system into the first clay-family memory surface
- [x] Finish the first research-backed palette rationalization pass and roll it through shared surfaces
- [ ] Unify the warm maroon + saffron + ivory palette across high-traffic app areas and remove remaining green / cool-color holdouts
- [ ] Reuse the greeting-sheet editing pattern for other key edit flows instead of leaving it isolated to Home
- [x] Define `Parampara Pathshala` as a tradition-first scripture product instead of a flat Library
- [ ] Finalize the Pathshala source-and-rights strategy before promising full scripture corpora in production
- [x] Finish the first live Pathshala UI slice: rename the Library surface, make it tradition-first, and map the current corpus into scripture-category tracks
- [x] Start Pathshala phase 2: add section-level corpus metadata, source-governance cues, and fuller scripture-track detail
- [x] Start Pathshala return loops: bookmarks, continue-learning state, and first reading-plan foundations
- [x] Build Bhagavad Gita as the first complete chapter-structured Pathshala pilot with full local verse coverage and source attribution
- [x] Start the Valmiki Ramayana Kanda-first Pathshala flow with canonical Kanda pages, reading plans, and companion-source links
- [x] Ingest the 13 principal Upanishads as full local translated study texts with source attribution instead of leaving Upanishad study at excerpt-only depth
- [x] Start the Upanishad source-layer iteration: show which principal texts have live Sanskrit in Pathshala and which still open official companion sources
- [x] Clean the first Upanishad original-text import so live Sanskrit pages do not carry scrape junk like English section headings or broken glyphs
- [x] Add the first Upanishad study actions so principal texts can open explain / quiz / flashcard flows instead of behaving like static longform pages
- [x] Replace the current green / teal brand bias with a warmer dharmic palette that fits the Sanatan product identity better
- [ ] Define Jyotish / Rashiphal strategy under the trust core before shipping any horoscope-style feature
- [ ] Stage Pathshala AI-assisted reading and recitation support: explain, quiz, flashcards, and later pronunciation / scoring

## P0 Launch Blockers

- [ ] Trust and legal pages are live and linked from the public app
- [ ] Support contact path is configured for production
- [ ] User reporting, block, mute, and hide flows exist in the main app
- [ ] Festival data is no longer hardcoded to a single year
- [ ] Panchang accuracy strategy is finalized and reflected in product copy
- [ ] Jyotish / Rashiphal scope, calculation model, and disclaimer strategy are finalized before launch claims expand
- [ ] Push notifications are either fully implemented or removed from product claims
- [ ] Notification jobs are segmented, deduplicated, and timezone-aware
- [ ] Scripture corpus source legitimacy, permissions, and provenance policy are finalized for production
- [ ] Full-text launch scope is explicit: what is fully in-app vs what still routes to official source partners
- [ ] `schema.sql`, migrations, and app types are aligned
- [ ] `package.json` and installed dependency versions are aligned
- [x] Lockfile is committed
- [x] ESLint runs non-interactively
- [x] CI is added for build and lint checks
- [ ] PWA assets and registration are complete, or incomplete claims are removed
- [ ] Kul lineage destructive permissions are enforced in the database, not just the UI

## P1 Beta Work

- [ ] Personalize onboarding and home experience from `seeking`
- [x] Persist guided-path progress so home cards can be dismissed, completed, and restored
- [ ] Turn current personalized home cards into fuller first-week onboarding logic
- [x] Rebrand `Parampara Library` to `Parampara Pathshala` and switch it to tradition-first navigation
- [x] Continue Pathshala phase 2 with route-driven tradition, track, and text pages plus continue-learning loops
- [x] Make `/library` a clean tradition gateway so scripture browsing starts on the next page instead of mixing excerpts into the first screen
- [ ] Replace rough `Kul / Vansh` clay figurines with polished keepsake memory cards
- [ ] Expand the new `Kul` hub + full-page section pattern into other major app areas where it improves clarity
- [ ] Add Mandali comments and replies
- [ ] Add Mandali event RSVP flow
- [ ] Add analytics, funnel tracking, and error monitoring
- [ ] Replace browser `confirm`, `alert`, and `window.prompt` flows with app-native UI
- [x] Add scripture bookmarks and the first Pathshala reading-plan layer
- [x] Extend Pathshala return loops to chapter-level Gita study so users can resume and bookmark full chapter paths, not just excerpts
- [x] Add first chapter-level AI study entry points in Pathshala with prefilled source-aware prompts
- [x] Reuse the existing daily-shloka Gita corpus inside Pathshala so chapter coverage expands locally without waiting on a separate import pipeline
- [x] Replace the partial Gita pilot with a full local public-domain corpus so chapter study no longer depends on external full-text fallback
- [x] Replace the partial Upanishad pilot with a principal-Upanishad corpus so the Pathshala track opens into full study texts instead of only a few Mahavakya excerpts
- [ ] Add recitation mode with authoritative-source audio first, then later pronunciation guidance
- [ ] Continue the Upanishad original-text iteration until the larger texts that still sit behind official flipbooks can be ingested locally
- [ ] Explore opt-in Jyotish / Rashi guidance after Panchang and sacred-time trust work is credible
- [ ] Add Pathshala quizzes, cards, and mastery checkpoints after the corpus source layer is trustworthy
- [ ] Define religious language support: script toggles first, then launch-language UI packs
- [ ] Activate referral attribution from invite codes

## Notes

- The best near-term market story is: diaspora Hindu / Sanatani launch first, then broader dharmic expansion after parity improves.
- Current implementation pass is intentionally focused on launch credibility at the front door before deeper social or growth work.
- Active polish pass: palette unification across high-traffic screens plus reuse of the greeting-sheet editor pattern in other key flows.
- `ROADMAP.md` is now the main sequencing document for `Phase A` vs `Phase B`.
- `COLOR_STRATEGY.md` now tracks the palette research, token direction, and rollout rules.
- `PARAMPARA_PATHSHALA_PLAN.md` now defines the source strategy and learning-product direction for turning Library into Pathshala.
