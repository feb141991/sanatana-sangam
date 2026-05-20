# Sarvam AI Rollout Plan for Shoonaya

This plan outlines the staged rollout strategy for integrating Sarvam AI across Shoonaya's features. It defines the recommended provider, caching strategy, necessity of AI, and fallback mechanisms for each major application lane.

## 1. Feature-by-Feature Rollout Strategy

### Pathshala (Guided Scriptural Learning)
- **Current / Immediate**: Precompute using Sarvam Reasoning (`sarvam-hosted`).
- **Cache Strategy**: **Global (Build-time Precomputation)**. Explanations for fixed verses (e.g., Bhagavad Gita, Upanishads) do not change per user. Generate insights once and store them statically or in the database.
- **Is AI Required at Runtime?**: **No**. Serve precomputed JSON.
- **Fallback**: Fall back to raw verse translation if the precomputed insight is missing.

### Bhakti (Stories, Panchatantra, Katha)
- **Current / Immediate**: Precompute using Sarvam Reasoning (`sarvam-hosted`).
- **Cache Strategy**: **Global (Build-time Precomputation)**. Similar to Pathshala, stories are static.
- **Is AI Required at Runtime?**: **No**. Serve precomputed JSON.
- **Fallback**: Display raw story text and pre-authored static summaries.

### TTS (Text-to-Speech)
- **Current / Immediate**: Live runtime generation using Sarvam Bulbul (`sarvam-tts`).
- **Cache Strategy**: **Global (CDN / Storage)**. Hash the input text, language, and voice quality. Store the resulting MP3 at the edge. Over 95% of TTS requests (sutras, daily prayers) will be cache hits.
- **Is AI Required at Runtime?**: **Yes**, but only for the first time a specific phrase is requested.
- **Fallback**: Google Cloud TTS (Wavenet/Neural2).

### Translations & Meanings (`/api/i18n/meaning`)
- **Current / Immediate**: Live runtime generation using Sarvam Translate API.
- **Cache Strategy**: **Global (Database)**. Store translations in the `content_meanings` Supabase table. Keys are based on the entry ID or a hash of the source text plus the target language.
- **Is AI Required at Runtime?**: **Yes**, for novel terms. **No**, for cached terms.
- **Fallback**: Generic Reasoning API (`runMeaningGenerate` via Gemini/Self-hosted), then static English translation.

### DharmaChat (Conversational AI)
- **Current / Immediate**: Gemini Hosted (until Sarvam reasoning quality matches production SLA for open dialogue).
- **Future Optimization**: Switch to Sarvam Reasoning (`sarvam-hosted`) once internal staging proves safety and coherence for dynamic chat.
- **Cache Strategy**: **Per-User (Database)**. Store chat history and context window per session.
- **Is AI Required at Runtime?**: **Yes**. This is the only fully dynamic open-ended AI feature.
- **Fallback**: Provide graceful degradation messages (e.g., "The pandit is resting") if the provider times out.
- **Budget Control**: Strict daily message limits tracked via `sadhana_events`.

### Notifications & Reminders
- **Current / Immediate**: Static Templates.
- **Cache Strategy**: N/A.
- **Is AI Required at Runtime?**: **Never**. Do not use AI to generate standard milestone alerts, Tithi reminders, or streak notifications. Use deterministic i18n strings.
- **Fallback**: N/A.

---

## 2. Implementation Phasing

### Phase 1: Immediate Implementation (High ROI, Low Risk)
*These items drastically reduce AI spend while immediately leveraging Sarvam's Indic language strengths.*
1. **TTS Caching & Bulbul Integration**: Switch to Sarvam TTS for natural Indic voices and implement CDN/Storage caching for generated audio.
2. **Translation API & Caching**: Route meaning generation through the Sarvam Translate endpoint and ensure the `content_meanings` table absorbs the majority of traffic.

### Phase 2: Later Optimization (Pipeline Adjustments)
1. **Pathshala & Bhakti Precomputation Pipeline**: Build admin scripts to pre-generate all verse and story insights using Sarvam reasoning. Remove live API calls from the client flow entirely for standard scriptures.

### Phase 3: Not Worth Using AI For (Strictly Avoid)
1. **Notifications**: Use static templates.
2. **Panchang / Calendar Math**: Use deterministic astronomical libraries.
3. **Core App UI Localisation**: Use standard static translation files (i18n JSONs).

---

## 3. Rollout Checklist

- [x] Implement Sarvam Reasoning Provider (`sarvam.ts`).
- [x] Implement Sarvam Translate Adapter (`sarvam-translate.ts`).
- [x] Implement Sarvam TTS integration (`/api/tts/route.ts`).
- [x] Define global Cache & Budget Policy (`pramana_cache_budget_policy.md`).
- [ ] **Next Step**: Implement CDN/Bucket caching layer for TTS audio responses.
- [ ] **Next Step**: Build the admin precomputation script for Pathshala verses.
