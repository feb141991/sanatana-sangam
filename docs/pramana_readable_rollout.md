# Readable Text + AI Rollout Plan

This document tracks the phased execution plan for unifying all sacred readable text surfaces across Shoonaya with the `ReadableContent` schema and the `PramanaPipelineTags`.

## Phased Execution Strategy

### Phase 1: Audit & Schema (COMPLETED)
- ✅ Defined the `ReadableContent` contract with UI capability flags.
- ✅ Normalized `PramanaPipelineTags` to map UI semantics to internal Reasoning/TTS pipelines.
- ✅ Adopted the initial pass in **Pathshala Lesson** and **Bhakti Katha**.

### Phase 2: High-Value Reading Surfaces (PARTIALLY COMPLETED)
The immediate next targets were the surfaces where users spend significant time reading core scripture or devotional text.

1. **Vrat Details (`VratClient.tsx`)**
   - **Status:** Adopted.
   - **ReadableContent:** Added for significance, practice, and mantra surfaces.
   - **Pipeline Tags:** `instruction + audio_mode: none` for significance/practice, `sacred_verse + audio_mode: meditative` for mantra.
   - **Reader/Language:** Existing local-language toggle is now capability-driven rather than tied only to `nameLocal`.
   - **TTS:** Still intentionally off at the Vrat UI layer. The metadata now supports future mantra-only TTS without forcing narration on instructional text.

2. **Pathshala Recite (`ReciteClient.tsx`)**
   - **Status:** Adopted.
   - **ReadableContent:** Added for the active verse payload.
   - **Pipeline Tags:** `content_type: 'sacred_verse'`, `audio_mode: 'pandit'`, `delivery_intent: 'live_user'`.
   - **Reader/Language:** Language, transliteration, TTS, and explain controls now respect readable-content capabilities.
   - **TTS:** Preserved, but now gated through explicit verse capabilities rather than raw field assumptions.

3. **Shared Sacred Reader (`SacredReader.tsx`)**
   - **Status:** Partially adopted.
   - **ReadableContent:** Accepts explicit readable-content metadata and falls back to an internal sacred-verse default when absent.
   - **TTS:** Prefetch and voice toggles now honor `canGenerateTTS`.

### Phase 3: Secondary & Fragment Surfaces
These are surfaces where text is presented, but not as a primary long-form reading experience.

1. **Nitya Karma Plans (`NityaKarmaClient.tsx`)**
   - **Adopt ReadableContent:** Yes, specifically for the Shloka elements.
   - **Pipeline Tags:** `content_type: 'sacred_verse'`, `audio_mode: 'meditative'`.
   - **Reader/Language:** Provide a modal to open a large reader if the text exceeds 3 lines.
   - **TTS:** Yes, for daily chanting alignment.

2. **Home Dashboard Quotes (`HomeDashboard.tsx`)**
   - **Adopt ReadableContent:** Yes, but strictly UI-level.
   - **Pipeline Tags:** Not required unless user taps to expand into a full reader.
   - **Reader/Language:** "Tap to open reader" feature.
   - **TTS:** Optional.

### Phase 4: Full Pipeline Alignment
- Apply the same readable-content capability model to the remaining recitation and observance surfaces.
- Deprecate old ad-hoc TTS calls where rate and voice are hardcoded (e.g., `rate: isPanchatantra ? 0.86 : 0.78`). 
- Force the `/api/tts` and `/api/pathshala/explain` route handlers to parse the `PramanaPipelineTags` provided by the UI.

## Capability Model Rules
- `canToggleTransliteration`: Only `true` if `script` !== `latin` AND `transliteration` payload exists.
- `canGenerateTTS`: Only `true` if `original` payload exists AND `pipelineTags.audio_mode !== 'none'`.
- `canShowExplain`: Only `true` for `content_type: 'sacred_verse'` or `'katha'`. Not allowed on `ui_text`.
