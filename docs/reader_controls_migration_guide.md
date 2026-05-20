# Shared Reader Controls Migration Guide

## Overview

The `useReaderControls()` hook consolidates scattered reader UI logic (language toggles, transliteration, TTS, explain, share/copy) into a single, reusable abstraction.

**Hook location**: `src/hooks/useReaderControls.ts`

---

## What's Included

### State
```typescript
showTransliteration: boolean       // Render transliteration overlay
showLocalLanguage: boolean         // Render local language variant
showMeaning: boolean               // Render meaning/translation
isGeneratingTTS: boolean           // TTS is being generated
ttsError: string | null            // TTS error message if any
isCopied: boolean                  // Temp state after copy action
```

### Handlers
```typescript
// Display toggles
toggleTransliteration()            // Show/hide transliteration
toggleLocalLanguage()              // Show/hide local language
toggleMeaning()                    // Show/hide meaning
resetDisplayState()                // Reset all display toggles

// Audio
requestTTS(text, options?)         // Generate audio, returns data URL
requestExplain(text, context?)     // Request AI explanation

// Content
copyText(text, label?)             // Copy to clipboard, show toast
share(text, title?, url?)          // Share via navigator.share or clipboard
```

---

## Basic Usage

```tsx
'use client';

import { useReaderControls } from '@/hooks/useReaderControls';
import { buildReadableCapabilities } from '@/lib/readable-content';

export function MyReaderComponent() {
  const capabilities = buildReadableCapabilities({
    original: 'मयि सर्वं इदं प्रोतं...',
    transliteration: 'mayi sarvam idam protam...',
    meaning: 'Everything is woven in me...',
    script: 'devanagari',
    language: 'sa',
    pipelineTags: {
      content_type: 'sacred_verse',
      audio_mode: 'pandit',
    }
  });

  const { state, handlers } = useReaderControls(capabilities);

  return (
    <div>
      {/* Original text */}
      <p className="text-xl">{originalText}</p>

      {/* Transliteration (gated by capability + state) */}
      {state.showTransliteration && <p className="italic opacity-70">{transliterationText}</p>}

      {/* Meaning (gated by capability + state) */}
      {state.showMeaning && <p className="text-sm opacity-60">{meaningText}</p>}

      {/* Controls */}
      <div className="flex gap-2">
        {capabilities.canToggleTransliteration && (
          <button onClick={handlers.toggleTransliteration}>
            {state.showTransliteration ? 'Hide' : 'Show'} Transliteration
          </button>
        )}
        
        {capabilities.canShowMeaning && (
          <button onClick={handlers.toggleMeaning}>
            {state.showMeaning ? 'Hide' : 'Show'} Meaning
          </button>
        )}

        {capabilities.canGenerateTTS && (
          <button onClick={() => handlers.requestTTS(originalText)}>
            {state.isGeneratingTTS ? 'Generating...' : 'Play Audio'}
          </button>
        )}

        <button onClick={() => handlers.copyText(originalText, 'Verse')}>
          {state.isCopied ? 'Copied!' : 'Copy'}
        </button>

        <button onClick={() => handlers.share(originalText)}>
          Share
        </button>
      </div>
    </div>
  );
}
```

---

## Migration Checklist

### Phase 1: SacredReader (Already Adaptive)
- [ ] Profile current SacredReader TTS + voice quality toggle logic
- [ ] Integrate useReaderControls for state management
- [ ] Verify Pandit AI voice toggle still works
- [ ] Test backup TTS generation

### Phase 2: Pathshala Recite Mode
- [ ] Audit ReciteClient.tsx for language toggle + share/copy logic
- [ ] Replace `handleCopy` + `handleShare` with `useReaderControls`
- [ ] Preserve font size controls (separate from reader controls)
- [ ] Test cache hit with repeated verses

### Phase 3: Bhakti Katha Reader
- [ ] Extract language + share logic from katha display
- [ ] Integrate useReaderControls for text variants
- [ ] Keep audio playback intact

### Phase 4: Nitya Karma Text Surfaces
- [ ] Apply to shloka/prayer displays
- [ ] Gate TTS based on content_type + audio_mode
- [ ] Test with daily sandhya prayer

### Phase 5: Other Surfaces (Low Priority)
- [ ] Vrat descriptions
- [ ] Bhakti long-form content
- [ ] Lesson text displays

---

## Key Design Decisions

### 1. Capability-Gated Handlers
All handlers check `capabilities` before executing. Handlers on disabled capabilities are safe no-ops:
```typescript
const toggleTransliteration = useCallback(() => {
  if (capabilities.canToggleTransliteration) {
    setShowTransliteration(prev => !prev);
  }
}, [capabilities.canToggleTransliteration]);
```

### 2. Graceful TTS Fallback
If TTS generation fails:
```typescript
catch (err) {
  const message = err instanceof Error ? err.message : 'TTS generation failed';
  setTtsError(message);
  // Component can use this error to show UI feedback or fallback
}
```

### 3. Non-Blocking Share
Share failures are silent (navigator.share can abort, or user cancels). No error toast:
```typescript
try {
  if (navigator.share) {
    await navigator.share({ title, text, url });
  } else {
    // Fallback to clipboard
  }
} catch (err) {
  // Silent abort
}
```

### 4. Explain Request Context
Optional context allows backend to route requests intelligently:
```typescript
const context: ExplainContext = {
  source: 'Bhagavad Gita',
  tradition: 'hindu',
  contentType: 'sacred_verse',
  responseMode: 'devotional_story_explain',
};

const result = await handlers.requestExplain(text, context);
```

---

## Testing Checklist

After migrating a component:

1. **Display toggles**: Click each toggle, verify state changes + UI updates
2. **TTS**: Click TTS button, verify audio generation or error message
3. **Copy**: Click copy, verify toast + clipboard contains text
4. **Share**: Click share, verify navigator.share dialog or clipboard fallback
5. **Explain**: Request explain, verify response modal appears (if implemented)
6. **Capabilities**: Disable capability, verify control is hidden/disabled
7. **Build**: `npm run build` passes
8. **Lint**: `npm run lint` passes

---

## Future Enhancements

1. **Analytics Integration**: Hook could emit `reader_action` events for tracking
2. **Persistence**: Could save display preferences to localStorage
3. **Keyboard Shortcuts**: Could add keyboard bindings (e.g., `T` for transliteration)
4. **Extended Explain**: Could support multiple explain modes (devotional, scholarly, etc.)
5. **Multi-Language Support**: Could track language preferences across session

---

## Backward Compatibility

The hook is **additive only**:
- Existing components can continue using ad-hoc state
- Migrating to hook is opt-in per component
- No breaking changes to existing surfaces

---

## Reference

- **File**: `src/hooks/useReaderControls.ts` (291 lines)
- **Depends**: `src/lib/readable-content.ts` (capability types)
- **Used by**: (to be filled as components migrate)
