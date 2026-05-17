# Product Consolidation Plan

Date: 2026-05-17

## Goal

Make Shoonaya feel like one premium mobile product instead of many separate feature pilots.

The launch shape should be simple:

- Home: what should I do today?
- Pathshala: learn and understand sacred knowledge.
- Bhakti: practice, listen, chant, and read devotional stories.
- Kul: family, lineage, memories, and sanskaras.
- Tirtha and Mandali: real-world belonging, surfaced from Home and contextual entry points until usage proves one should become a primary tab.

## Navigation Shape

Keep five primary mobile destinations:

- Home
- Pathshala
- Bhakti
- Kul
- Profile / progress access through top avatar and Home cards, not as a noisy bottom tab

Reduce the center action menu over time. It should not become a second navigation system. The best launch version is three actions:

- Start mala
- Today’s nitya
- Ask Dharma AI

Everything else should be contextual inside the relevant screen.

## Pathshala And Bhakti

Keep them separate in the UI.

Pathshala is the learning product:

- scripture
- structured paths
- recitation
- bookmarks
- AI explain
- source/provenance trust
- language preferences and meanings

Bhakti is the devotional product:

- mala
- chants and stotrams
- katha and Panchatantra
- zen / sattvic mode
- devotional audio
- daily vani

Do not merge them as one big library. Use one shared content model underneath so both can reuse metadata, progress, language, source trust, and audio readiness.

## Shared Content Model

The first adapter now exists at `src/lib/sacred-content.ts`.

It normalizes:

- `LibraryEntry` from Pathshala
- `Katha` from Bhakti stories
- `Stotram`
- `DevotionalTrack`
- curated devotional sounds

Target object: `SacredContentItem`.

This lets future features treat scriptures, stories, stotrams, chants, and audio as one trackable content object while still rendering them differently in Pathshala and Bhakti.

Next steps:

- Move Bhakti browse/search onto `SacredContentItem`.
- Move Pathshala search/recommendations onto `SacredContentItem`.
- Add source-rights and language-readiness fields to the normalized item.
- Use `progressKey` for unified progress tracking.

## Icon System

Visible launch UI should move away from emoji-led presentation.

Rules:

- Use lucide/custom SVG icons for app chrome, navigation, cards, and action menus.
- Keep sacred symbols only when they carry tradition meaning and are rendered consistently.
- Emojis can remain inside user-generated content, reactions, or temporary internal copy, but not as primary product iconography.

First pass completed:

- Bhakti landing cards now use icon metadata instead of emoji cards.
- Bottom action menu now uses icon components instead of emoji action glyphs.

Remaining sweeps:

- Tirtha map markers
- Discover mood cards
- Premium modal
- Nitya step icons
- Panchang rows
- Kul onboarding and Sabha reactions
- Progress and shield screens

## Unified Progress Dashboard

Current tracking is split across Mala insights, Bhakti insights, Pathshala insights, Nitya insights, guided-plan insights, and My Progress.

Target: one global progress dashboard with deep links.

Trackable domains:

- Japa: sessions, beads, rounds, mantra, mala type, scene, preferred time
- Nitya: completed days, step completion, plan bridge, skipped steps
- Pathshala: enrolled paths, lessons completed, recitation attempts, bookmarks, TTS/AI use
- Bhakti: katha reads, stotram opens/listens, chant sessions, zen sessions
- Kul: members added, Vansh interactions, sabha posts, sanskara milestones
- Tirtha: saves, check-ins, passport entries, share cards
- Mandali: posts, replies, events, RSVP, helpful participation
- Seva: saves, opens, contributions later when payments exist

Recommended representation:

- Today ring: japa, nitya, learning, seva/community
- 28-day heatmap: one row per practice domain
- Monthly story: “what grew this month”
- Domain cards: Japa, Nitya, Pathshala, Bhakti, Kul, Tirtha, Mandali
- AI reflection: one short interpretation, not a long report

Implementation sequence:

1. Define `ProgressSignal` type.
2. Create adapters from existing tables.
3. Replace individual insight entry points with deep-linked sections inside My Progress.
4. Keep detailed insights pages as secondary drill-downs only.

## Premium Feel Work

Priority changes:

- Reduce visible choices per screen.
- Replace static “guide” copy with contextual empty states.
- Standardize icons.
- Standardize motion tokens.
- Use shared content/progress adapters.
- Keep Home focused on one next action.

The app is feature-rich enough. Launch quality now depends more on consolidation than expansion.
