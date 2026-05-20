# Phase D: Bhakti Stotram Adoption — ANALYSIS ✅

## Summary
Audited Bhakti Stotram surface and documented adoption path. The stotram rendering has copy/share controls but lacks explicit ReadableContent wrapping and language/transliteration toggles. Implementation is straightforward but requires careful attention to pre-recorded audio handling.

## Current Stotram Surface Analysis

### File Structure
- **Location**: `src/app/(main)/bhakti/stotram/[id]/page.tsx`
- **Size**: 679 lines (all-in-one page component)
- **Type**: Client component with direct copy/share/language logic

### Current Capabilities
✅ **What works:**
- Verse rendering (Sanskrit + meaning)
- Copy individual verses
- Copy full stotram
- Share verse links
- Multi-language meanings (EN, HI, PA)
- Direct translations for major stotrams (hardcoded in STOTRAM_TRANSLATIONS)
- Repeat controls for audio playback

❌ **What's missing:**
- ReadableContent wrapper (no explicit capabilities)
- Transliteration toggle (Sanskrit only, no Roman)
- TTS generation (pre-recorded audio only)
- Explanation capability (no meaning deep-dives)
- Open-reader mode (no immersive reader like SacredReader)

### Data Structure
```typescript
interface Stotram {
  id: string;
  title: string;
  titleDevanagari: string;
  description: string;
  verses: Array<{
    number: number;
    sanskrit: string;
    transliteration: string;
    meaning: string;
  }>;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain';
  audioTrackId?: string; // Pre-recorded audio (if available)
  // ... other fields
}
```

## Adoption Roadmap

### Phase 1: ReadableContent Wrapping (1–2 hours)
**Goal**: Make capabilities explicit without changing UX

**Changes:**
1. Import `ReadableContent` and `buildReadableCapabilities`
2. Create verse wrapper data for each verse:
   ```typescript
   const verseReadableContent: ReadableContent = {
     original: verse.sanskrit,
     meaning: verseMeaning,
     sourceLabel: `${stotram.title} - Verse ${verse.number}`,
     tradition: stotram.tradition,
     language: 'sa',
     script: 'devanagari',
     pipelineTags: {
       content_type: 'stotram',
       audio_mode: stotram.audioTrackId ? 'prerecorded' : 'none',
       tradition: stotram.tradition,
       script: 'devanagari',
       response_mode: 'extractive',
       delivery_intent: 'recitation'
     },
     capabilities: buildReadableCapabilities({
       original: verse.sanskrit,
       meaning: verseMeaning,
       script: 'devanagari',
       pipelineTags: {
         content_type: 'stotram',
         audio_mode: stotram.audioTrackId ? 'prerecorded' : 'none',
       }
     })
   };
   ```
3. Pass to verse rendering component (if extracted)
4. Capability check on TTS button:
   ```typescript
   {verseReadableContent?.capabilities.canGenerateTTS ? (
     // Show TTS button
   ) : null}
   ```

### Phase 2: Transliteration Toggle (1 hour)
**Goal**: Add Roman transliteration toggle like Pathshala Recite

**Changes:**
1. Add state: `const [showTranslit, setShowTranslit] = useState(false);`
2. Render transliteration when toggled:
   ```typescript
   {showTranslit && (
     <p className="text-sm text-[color:var(--brand-muted)]">
       {verse.transliteration}
     </p>
   )}
   ```
3. Add toggle button (matching Recite style)

### Phase 3: Optional TTS (1–2 hours)
**Goal**: Allow TTS on verses where pre-recorded audio doesn't exist

**Constraints:**
- Pre-recorded audio (if `audioTrackId` exists) should stay primary
- TTS is optional fallback/alternative only
- Don't break existing pre-recorded audio flow

**Changes:**
1. Check `capabilities.canGenerateTTS` before rendering TTS button
2. Wrap TTS call with tag submission:
   ```typescript
   const result = await fetch('/api/tts', {
     method: 'POST',
     body: JSON.stringify({
       text: verse.sanskrit,
       language: 'sa',
       tags: {
         content_type: 'stotram',
         audio_mode: 'speech',
         tradition: stotram.tradition,
       }
     })
   });
   ```
3. Use cached result for playback

### Phase 4: Explanation (Optional, defer to Phase F)
**Goal**: Add one-tap meaning deep-dive

**Note**: Can defer this; transliteration + TTS covers high-value improvements

## Risk Assessment

### Low Risk
- ✅ ReadableContent wrapping (data-only, no behavior change)
- ✅ Transliteration toggle (additive, no breaking changes)
- ✅ TTS fallback (only when no pre-recorded exists)

### Medium Risk
- ⚠️ TTS integration (new network call, potential latency)
  - **Mitigation**: Cache at SUR level, only call when user clicks

### Why This Is Safe
1. Stotram page is contained (no shared dependencies)
2. Existing copy/share logic stays intact
3. Pre-recorded audio path unchanged
4. UI shape stays the same (toggles are additive)

## Recommended Implementation Order
1. **Start with Phase 1** (ReadableContent wrapping) — 1–2 hours, low risk
2. **Then Phase 2** (Transliteration toggle) — 1 hour, very safe
3. **Then Phase 3** (Optional TTS) — 1–2 hours, test thoroughly
4. **Defer Phase 4** (Explanation) — can come in Phase F

**Total estimated effort for all 4 phases**: 4–7 hours

## Build & Lint Status
✅ **npm run build**: PASSED (0 errors, current snapshot)
✅ **npm run lint**: PASSED (0 errors, current snapshot)

## Notes for Implementation

### Key Files to Modify
- `src/app/(main)/bhakti/stotram/[id]/page.tsx` (main changes here)
- Potentially extract `StotramVerseCard` component for reusability

### Testing Checklist
- [ ] Copy/share still work
- [ ] Pre-recorded audio still plays
- [ ] Transliteration toggle renders correctly
- [ ] TTS generation (if implemented) doesn't break audio playback
- [ ] Language toggle still works (EN/HI/PA)
- [ ] npm run build passes
- [ ] npm run lint passes

## Ready for Merge?
✅ **NO — Not yet.** This is an analysis document. Implementation needed in separate PR.

---

**Next action**: Implement Phase 1 (ReadableContent wrapping) in follow-up PR. Then gather feedback before adding Phases 2–3.
