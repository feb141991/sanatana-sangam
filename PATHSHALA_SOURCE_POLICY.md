# Pathshala Source Policy

Last updated: 2026-04-09

## Purpose

This document defines what Shoonaya can honestly store, show, and claim inside `Parampara Pathshala`.

This is a launch-trust document, not only an editorial note.

The goal is:

- keep scripture study spiritually and legally trustworthy
- make source state visible to users
- avoid mixing canonical text, translation, commentary, AI reflection, and companion links into one blurry surface
- prevent corpus growth from outrunning rights clarity

## Core Rules

1. Every in-app Pathshala text must have a named source.
2. Every in-app Pathshala text must have a rights status.
3. Canonical text, translation, commentary, curated lesson, and AI reflection must be visually distinct.
4. If rights are unclear, do not ingest the text. Keep the track catalog-visible and use a companion link instead.
5. Companion links are acceptable when they are clearly labeled as companion sources, not presented as local corpus coverage.
6. Generated transliteration is allowed only when the source text itself is rights-safe and the product clearly labels transliteration as generated from that text.
7. Audio has a stricter standard than text. “Authoritative recitation” must not be claimed until source rights and attribution are confirmed.

## Allowed Source States

Each Pathshala text family or entry should be treated as one of these states:

### 1. `live_public_domain`

Use when:

- the text or translation is public domain
- the source edition is known
- attribution can be shown clearly

What is allowed:

- local storage in the app
- chapter / verse navigation
- bookmarks and continue-learning
- generated transliteration if based on the public-domain source text

Examples currently in this state:

- Bhagavad Gita local study corpus from the Annie Besant public-domain edition
- principal Upanishad translated study texts from Robert Ernest Hume’s 1921 public-domain translation

### 2. `live_rights_cleared`

Use when:

- a modern source is not public domain
- but usage terms or direct permission clearly allow app use

What is allowed:

- local storage
- full in-app reading flow
- local audio only if the permission also covers audio storage/streaming

Current status:

- this state should remain rare until explicit permissions are documented

### 3. `companion_only`

Use when:

- the source is trustworthy
- but rights, structure, or machine-readable access are not good enough for local ingestion

What is allowed:

- show the text in the Pathshala catalog
- show source and study metadata
- link out to the companion source
- explain why it is companion-only

What is not allowed:

- pretending full text is local
- showing coverage as complete when the user will be sent elsewhere

Examples currently in this state:

- authoritative Gita recitation/audio companion on IIT Gita Supersite
- Upanishad original-text layers where Vedic Heritage exposes only summary/flipbook-shaped source pages

### 4. `catalog_only`

Use when:

- the text family is important to the product structure
- but neither local ingestion nor safe companion expansion is ready

What is allowed:

- tradition and track presence
- metadata
- launch-later cues

What is not allowed:

- fake excerpts used to imply coverage depth

Examples currently suited to this state:

- wider Jain canon until permissions are clearer
- broader non-Gita expansion while Gita-first recitation/audio is still being completed

## Required Metadata For Every Text

At minimum, each Pathshala text or entry should be able to answer:

- `source_name`
- `source_url` if available
- `source_owner`
- `source_class`
  - canonical
  - translation
  - commentary
  - curated lesson
  - AI reflection
- `rights_status`
  - public_domain
  - rights_cleared
  - companion_only
  - catalog_only
  - restricted_or_pending
- `language`
- `script`
- `original_text_status`
  - live
  - companion
  - unavailable
- `translation_status`
  - live
  - companion
  - unavailable
- `audio_status`
  - live
  - companion
  - unavailable
- `revision_note`
  - edition truth, OCR caveat, generated transliteration note, or other relevant warning

## UI Rules

Pathshala surfaces must keep these distinctions visible:

### Reading pages

Must show:

- source class
- rights / trust state
- original-text state
- translation state
- recitation/audio state

This is already partly implemented through the trust-check panel and should remain mandatory.

### Track pages

Must show:

- whether the corpus is fully local, partially local, or companion-led
- why a text is companion-only when that is the case

### AI actions

When AI is launched from Pathshala:

- the source text should be passed in context when possible
- the UI should still keep AI in the “study support” lane, not the “canonical source” lane

### Audio

If audio is companion-only:

- say so directly
- do not style it as if the app owns the recitation layer already

## Current Corpus Policy By Family

### Bhagavad Gita

State:

- `live_public_domain` for local study text
- `companion_only` for authoritative recitation audio

Launch truth:

- complete local chapter-and-verse study path is available
- the edition currently yields `701` verses because it follows the 35-verse chapter-13 tradition
- that edition-specific truth must remain visible in provenance copy

### Valmiki Ramayana

State:

- `partial_local` excerpts and Kanda-first study structure
- `companion_only` for wider canonical expansion

Launch truth:

- Pathshala provides Kanda structure and study entry
- it is not yet a full local Ramayana corpus

### Principal Upanishads

State:

- `live_public_domain` for translated study text
- mixed `live_public_domain` / `companion_only` for original-text layer depending on source accessibility

Launch truth:

- the translated study layer is much deeper than the original-text layer
- the original Sanskrit layer is intentionally partial and visibly labeled as such

### Sikh / Gurbani

State:

- selective in-app entries only for now
- broader digital expansion is blocked on confirmed terms for the most practical sources

Launch truth:

- do not imply full Guru Granth Sahib coverage until source and rights are confirmed

### Buddhist

State:

- selective in-app entries only for now

Launch truth:

- keep Buddhist Pathshala honest as a growing lane, not full canon parity

### Jain

State:

- catalog-first and permission-first

Launch truth:

- Jain scope must remain conservative until rights are clarified

## What Launch Can Claim

Pathshala can honestly claim:

- tradition-first scripture study
- source-aware reading
- Gita-first full local study depth
- principal Upanishad translated study depth
- companion-linked recitation where authoritative in-app audio is not yet rights-cleared

Pathshala should not yet claim:

- full cross-tradition canonical parity
- full original-script parity across all traditions
- in-app authoritative recitation audio
- universal rights-cleared corpus ingestion

## Audio-Specific Policy

Text and audio are not governed by the same threshold.

For recitation/audio:

- `authoritative audio` requires explicit rights or a clearly safe host strategy
- if that is missing, keep the audio as `companion_only`
- rights-safe chant starter packs are acceptable when each item has clear license and attribution
- do not mix rights-safe open chants with “authoritative scripture recitation” claims

## Operational Checklist Before Adding Any New Corpus

1. Identify the edition or source owner.
2. Record rights state and usage basis.
3. Record whether the text is canonical, translation, commentary, or curated lesson.
4. Record original / transliteration / meaning / audio availability separately.
5. Decide whether the text is `live_public_domain`, `live_rights_cleared`, `companion_only`, or `catalog_only`.
6. Add user-facing provenance and trust copy before launching the track.
7. Only then add reading plans, AI prompts, quizzes, or recitation hooks.

## Immediate Next Steps

1. Extend provenance metadata so rights state is machine-readable, not only implied in copy.
2. Audit current Pathshala families against this policy and record a short corpus-status matrix.
3. Keep Gita as the flagship model text family.
4. Do not widen other scripture families aggressively until Gita study + recitation is finished end to end.
5. Treat in-app authoritative Gita audio as the next major policy-dependent milestone.
