# Pramana Pipeline Tagging Audit

This document reviews how data and requests are currently marked across Shoonaya to determine AI pipeline routing, highlighting risks and recommending a normalized tagging model.

## 1. Current State & Heuristics

### Where Tagging is Strong
- **Target Language (`targetLanguage`)**: Strongly typed and explicitly passed to the `/api/i18n/meaning` route, enabling reliable fallback and provider selection.
- **Tradition (`tradition`)**: explicitly captured in `src/app/api/ai/chat/route.ts` to construct the context window.

### Where Heuristics are Risky
- **TTS Script Detection**: Currently, `src/app/api/tts/route.ts` relies on regex matching (`/[ऀ-ॿ]/` for Devanagari) to determine if a text is Sanskrit/Hindi. This is brittle. If a verse is transliterated into English characters (IAST), it falls back to a neutral English voice instead of treating it as a sacred recitation.
- **Voice Quality**: `quality` is passed as a generic string (`pandit`, `akash`, `standard`) without a strict type union shared across the frontend and backend.
- **Response Mode**: Chat versus Explainer pathways rely on entirely different route handlers (`/api/ai/chat` vs `/api/pathshala/explain`), rather than sharing a core router that splits on a `response_mode` tag.

## 2. Recommended Normalized Tagging Model

To ensure requests always route to the correct AI provider (e.g., Sarvam for recitation, Gemini for Chat), every AI-bound payload should progressively adopt a normalized tag schema:

```typescript
type PramanaPipelineTags = {
  content_type: 'scripture' | 'commentary' | 'chat' | 'ui_text';
  response_mode: 'deterministic' | 'conversational' | 'extractive';
  audio_mode: 'pandit' | 'akash' | 'standard' | 'none';
  tradition: 'sanatana_dharma' | 'buddhism' | 'jainism' | 'sikhism' | 'generic';
  script: 'devanagari' | 'gurmukhi' | 'iast' | 'latin';
  delivery_intent: 'live_user' | 'background_precompute';
}
```

## 3. Next Steps
1. Introduce a minimal `PramanaPipelineTags` type in `src/lib/ai/pipeline-tags.ts`.
2. Do not rewrite major app flows yet. Instead, progressively attach these tags as metadata when making `/api/tts` or `/api/i18n/meaning` calls.
3. Migrate TTS script detection away from Regex towards explicit `script` tags.
