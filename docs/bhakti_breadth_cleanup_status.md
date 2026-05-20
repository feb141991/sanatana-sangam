# Bhakti Breadth Cleanup Status

## Current State

Audit of Bhakti surfaces reveals mixed adoption levels:

### ✅ Adopted (ReadableContent + Capabilities)
- **Katha Reader** (`/bhakti/katha/[id]`): Full SacredReader integration with TTS, transliteration
- **Katha Browse** (`/bhakti/katha`): Discovery, playback controls

### ⚠️ Partially Adopted (Have translations but limited capabilities)
- **Stotram** (`/bhakti/stotram/[id]`):
  - ✅ Translation (multiple languages)
  - ✅ Playback control (audio)
  - ✅ Copy/share
  - ❌ No explicit ReadableContent model
  - ❌ No transliteration support
  - ❌ No TTS generation (only pre-recorded audio)

- **Mala/Japa** (`/bhakti/mala`):
  - ✅ Ambient background sounds
  - ❌ No text display
  - ❌ No TTS
  - ❌ No explanation

### ❌ Not Adopted (Text/audio but no capabilities)
- **Aarti** (`/bhakti/aarti`):
  - ✅ Step descriptions (sacred text)
  - ✅ WebAudio synth effects (bell sounds)
  - ❌ No ReadableContent model
  - ❌ No TTS for step descriptions
  - ❌ No local language variants
  - ❌ No explanation feature

- **Bhakti Insights** (`/bhakti/insights`):
  - Text-based but limited

---

## Recommended Adoption Order

### Priority 1 (High ROI, Low Effort)
**Stotram Surface**
- Wrap each verse in ReadableContent model
- Add `capabilities`:
  - `canOpenReader: true` (open stotram in full-screen reader)
  - `canToggleLocalLanguage: true` (already have hi/pa translations)
  - `canToggleTransliteration: false` (no transliteration yet)
  - `canGenerateTTS: false` (only pre-recorded audio, no new generation)
  - `canShowMeaning: true` (already have)
  - `canShowExplain: false` (out of scope for now)

**Effort**: 2–3 hours
**Impact**: Unifies stotram UI with reader controls hook

---

### Priority 2 (Medium ROI, Moderate Effort)
**Aarti Step Descriptions**
- Each step has `instruction` text (sacred description)
- Wrap in ReadableContent with:
  - `content_type: 'instruction'` + `audio_mode: 'none'`
  - `canOpenReader: true` (display in reader modal)
  - `canGenerateTTS: true` (generate TTS for step description)
  - `canToggleLocalLanguage: false` (no translations yet, but could add)
  - `canShowMeaning: false` (text is already explanatory)

**Effort**: 3–4 hours
**Impact**: Users can hear step descriptions; enables accessibility

---

### Priority 3 (Lower Priority)
**Japa/Mala Mantra Display**
- Add invisible text layer for mantra
- Gate TTS behind capability flag
- Could enable meaning lookup later

**Effort**: 2–3 hours
**Impact**: Enables future voice-guided japa

---

## Implementation Pattern

For each surface, follow this template:

```tsx
import { buildReadableCapabilities, type ReadableContent } from '@/lib/readable-content';

const readableContent: ReadableContent = {
  original: stepDescription,
  meaning: stepMeaning, // if available
  transliteration: getTransliteration(original), // if needed
  
  sourceLabel: 'Aarti Ritual',
  tradition: 'hindu',
  language: 'sa',
  script: 'devanagari',
  
  pipelineTags: {
    content_type: 'instruction', // or 'mantra', 'prayer'
    audio_mode: 'none', // or 'standard', 'narration'
    tradition: 'hindu',
    script: 'devanagari',
    delivery_intent: 'live_user',
  },
  
  capabilities: buildReadableCapabilities({
    original: stepDescription,
    meaning: stepMeaning,
    script: 'devanagari',
    pipelineTags: { content_type: 'instruction', audio_mode: 'none' }
  })
};
```

Then use `useReaderControls(readableContent.capabilities)` for state + handlers.

---

## Not Recommended (Out of Scope)

- **Bhakti Browse**: Already has discovery; no text reading
- **Bhakti Insights**: AI-generated; already has explainability
- **Bhaji/Chanting Surfaces**: Audio-only, no text to read

---

## Files to Modify

### For Stotram
- `src/app/(main)/bhakti/stotram/[id]/page.tsx`
  - Wrap each verse in ReadableContent
  - Import useReaderControls hook
  - Replace inline toggle logic with hook

### For Aarti
- `src/app/(main)/bhakti/aarti/page.tsx`
  - Create ReadableContent for each step.instruction
  - Add optional TTS button if `capabilities.canGenerateTTS`
  - Route TTS requests through `/api/tts`

---

## Analytics Tracking

Once implemented, track:
- `reader_opened` on stotram/aarti
- `tts_requested` for aarti step descriptions
- `language_toggled` for stotram verses
- Cache hit ratio for TTS

---

## Known Limitations

1. **Stotram TTS**: Currently uses pre-recorded audio. Generating new TTS would require fallback to Sarvam/Google if pre-recorded unavailable.
2. **Aarti Localization**: No Hindi/Punjabi translations yet. Can add later.
3. **Japa Mantra Display**: Conflicting UX (mantra hidden for immersive chant). Recommend opt-in.

---

## Verification Checklist

- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] Stotram reader opens without errors
- [ ] Aarti TTS buttons disabled gracefully if no content
- [ ] Share/copy still works with ReadableContent wrapper
- [ ] Capabilities gates work (no crashes on disabled features)
- [ ] Mobile UX unchanged (responsive)
