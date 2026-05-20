# Phase E: Bhakti Aarti Adoption — ANALYSIS ✅

## Summary
Audited Bhakti Aarti surface and documented adoption path. Aarti is a guided ritual with text instructions and tactile feedback (audio bells, haptics). Unlike Stotram (recitation), Aarti is procedural. ReadableContent adoption here focuses on wrapping instruction text with optional TTS for accessibility.

## Current Aarti Surface Analysis

### File Structure
- **Location**: `src/app/(main)/bhakti/aarti/page.tsx`
- **Size**: ~300–400 lines (all-in-one)
- **Type**: Client component with WebAudio synthesis and haptics

### Content Structure
```typescript
const AARTI_STEPS = [
  {
    id: 'bell',
    emoji: '🔔',
    title: 'Ghantā — Ring the Bell',
    titleDevanagari: 'घण्टा',
    instruction: 'Ring the temple bell to announce your worship...',
    action: 'Ring the bell',
    hint: 'Tap to ring',
    color: '#d4a645',
    bg: 'rgba(212,166,70,0.10)',
    onTap: () => { playBell(432, 2.5); haptic([30, 50, 20]); },
  },
  // ... 8 more steps
];
```

### Current Capabilities
✅ **What works:**
- Step-by-step guided ritual
- Interactive bell sounds (WebAudio synthesis, not pre-recorded)
- Haptic feedback (vibration)
- Text instructions (EN/Hindi translations available in STOTRAM_TRANSLATIONS)
- Visual color coding per step
- Progress tracking (completed steps)

❌ **What's missing:**
- ReadableContent wrapper (instruction text not explicitly structured)
- TTS for instructions (user must read or use assistive tech)
- Copy instruction text
- Share Aarti progress
- Language toggle (only EN supported in page, translations hardcoded)
- Transliteration toggle (minor — Devanagari already shown)

### Content Type Classification
**This is "instruction" content**, not "sacred_verse" or "recitation":
- Purpose: Procedural guidance, not recitation/memorization
- Audio mode: None (user provides action; app provides audio feedback)
- TTS need: Medium (accessibility; not core to ritual)
- Explanation need: Low (instructions are already explanatory)

## Adoption Roadmap

### Phase 1: ReadableContent Wrapping (1 hour)
**Goal**: Make instruction content explicitly structured

**Changes:**
1. Wrap each step's instruction in ReadableContent:
   ```typescript
   const stepReadableContent: ReadableContent = {
     original: step.instruction,
     meaning: step.instruction, // Same for instruction content
     sourceLabel: `Aarti Ritual — ${step.title}`,
     tradition: 'hindu',
     language: 'en',
     script: 'latin',
     pipelineTags: {
       content_type: 'instruction',
       audio_mode: 'none',
       response_mode: 'deterministic',
       tradition: 'hindu',
       delivery_intent: 'procedural'
     },
     capabilities: buildReadableCapabilities({
       original: step.instruction,
       script: 'latin',
       pipelineTags: {
         content_type: 'instruction',
         audio_mode: 'none',
       }
     })
   };
   ```
2. Pass to step rendering
3. Use `capabilities.canGenerateTTS` to gate TTS button

### Phase 2: Optional Instruction TTS (1–2 hours)
**Goal**: Add accessibility via TTS for step instructions

**Design:**
- TTS is **optional**, not core to ritual
- User can tap TTS button to hear instruction read aloud
- Don't auto-play (user drives ritual timing)

**Changes:**
1. Add TTS button next to instruction text
2. On tap, call `/api/tts` with:
   ```typescript
   const response = await fetch('/api/tts', {
     method: 'POST',
     body: JSON.stringify({
       text: step.instruction,
       language: 'en',
       tags: {
         content_type: 'instruction',
         audio_mode: 'speech',
         tradition: 'hindu',
       }
     })
   });
   ```
3. Play returned audio blob

### Phase 3: Language Toggle (1 hour)
**Goal**: Support Hindi/Punjabi instruction translations

**Note**: Translations already exist in STOTRAM_TRANSLATIONS; just need UI toggle

**Changes:**
1. Add lang selector (EN / हिं / ਪਾ)
2. Lookup translation via getVerseMeaning() pattern:
   ```typescript
   const translatedInstruction = getVerseMeaning(
     'aarti', step.id, step.instruction, lang
   );
   ```
3. Show translated text in step card

### Phase 4: Copy/Share (Optional, defer)
**Goal**: Allow users to save/share Aarti ritual

**Note**: Lower priority; most use Aarti interactively rather than for reference

## Risk Assessment

### Very Low Risk
- ✅ ReadableContent wrapping (data-only, no behavior change)
- ✅ Language toggle (just lookup in existing translations dict)

### Low Risk
- ✅ TTS for instructions (already have TTS infra; just new content_type)

### Why This Is Safe
1. Aarti is self-contained (no dependencies)
2. Bell/haptic code stays unchanged
3. UI shape stays same (add TTS button, add lang toggle)
4. Instruction text is deterministic (no generation needed)

## Key Insight: Instruction vs. Sacred Verse

| Dimension | Sacred Verse (Stotram) | Instruction (Aarti) |
|-----------|----------------------|-----------------|
| **Content Type** | sacred_verse | instruction |
| **Purpose** | Recitation / memorization | Procedural guidance |
| **Audio Mode** | prerecorded or pandit | none or optional speech |
| **TTS Priority** | High (core to experience) | Medium (accessibility) |
| **Explanation Priority** | High (philosophical) | Low (self-explanatory) |
| **Copy/Share Priority** | High (preserve text) | Low (ritual is live) |

## Recommended Implementation Order
1. **Start with Phase 1** (ReadableContent) — 1 hour, very safe
2. **Then Phase 2** (Instruction TTS) — 1–2 hours, test on few steps first
3. **Then Phase 3** (Language toggle) — 1 hour, mostly config
4. **Defer Phase 4** (Copy/Share) — lower value

**Total estimated effort**: 3–4 hours

## Build & Lint Status
✅ **npm run build**: PASSED (0 errors, current snapshot)
✅ **npm run lint**: PASSED (0 errors, current snapshot)

## Testing Checklist
- [ ] Bell/haptic still trigger
- [ ] Step transitions work
- [ ] Progress tracking works
- [ ] TTS button only shows when `canGenerateTTS === true`
- [ ] Language toggle renders correctly (EN/HI/PA)
- [ ] npm run build passes
- [ ] npm run lint passes

## Ready for Merge?
✅ **NO — Not yet.** This is an analysis document. Implementation needed in separate PR.

---

**Next action**: Implement Phase 1 (ReadableContent wrapping) in follow-up. Gather UX feedback before adding TTS.
