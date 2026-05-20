# Phase A: Analytics Instrumentation — COMPLETE ✅

## Summary
Successfully enhanced analytics instrumentation across TTS, explain, and reader surfaces. All events now emit rich context (quality, provider, cache status, content metadata) for tracking usage patterns and identifying optimization opportunities.

## Files Changed

### 1. **src/app/api/tts/route.ts**
- **Sarvam generation event** (line ~230): Enhanced with quality, text_length, cache_status='miss'
- **Google fallback event** (line ~330): Enhanced with context object including fallback_used flag
- **Impact**: All TTS generation paths now emit detailed metrics

### 2. **src/app/api/pathshala/explain/route.ts**
- **Explain generation event** (line ~84): Enhanced with content_type, response_mode, tradition, cache status
- **Impact**: All explanation requests tracked with content metadata for pattern analysis

### 3. **src/lib/analytics/reader-events.ts** (NEW)
- **Lightweight client-side analytics helpers** (100 LOC)
- **Exports**: `trackReaderEvent()` and `trackReaderEvents()` for components
- **Events tracked**: reader_opened, language_toggled, transliteration_toggled, tts_requested, explain_requested, content_shared, content_copied
- **Design**: Non-blocking fire-and-forget; safe to call from any component
- **Impact**: Enables any reader surface to emit analytics without custom code

## Analytics Events Now Instrumented

### Server-side (routes)
1. **TTS requests** — provider, model, quality, text_length, cache_status
2. **Explain requests** — content_type, response_mode, tradition, cache status, fallback flag
3. **Response latency** — captured on all events (Date.now() - startTime)

### Client-side (helper available)
- `reader_opened` — content_type, source, tradition
- `language_toggled` — language, has_transliteration
- `transliteration_toggled` — has_transliteration
- `tts_requested` — content_type, source, tradition
- `explain_requested` — content_type, source, tradition, has_meaning
- `content_shared` / `content_copied` — content_type, source

## Build & Lint Status
✅ **npm run build**: PASSED (0 errors, 3.9s)
✅ **npm run lint**: PASSED (0 errors)

## What Still Needs Analytics

The following were documented but not yet instrumented (ready for later phases):

1. **Reader component hooks** — useReaderControls() not yet calling trackReaderEvent()
2. **Reader surface integrations** — Pathshala Recite, Bhakti surfaces not yet using client-side helpers
3. **Repeated content tracking** — Not automated; requires schema design for "repeat_request" event
4. **Precompute triggers** — Will be added when precompute job script is created

## Next Steps (Phases B–F)

### Phase B: Precompute Job (2–3 hours)
- Create `scripts/precompute-hot-content.ts` to batch-generate TTS + explanations
- Use cache infrastructure to store results
- Emit `precomputed` event for tracking

### Phase C: Reader Controls Adoption (2–3 hours)
- Integrate useReaderControls() hook into 2–3 surfaces (Pathshala Recite recommended)
- Add trackReaderEvent() calls for user interactions
- Verify no behavior regressions

### Phase D: Bhakti Stotram Adoption (2 hours)
- Wrap verses in ReadableContent
- Add explicit capabilities + reader controls hook

### Phase E: Bhakti Aarti Adoption (2 hours)
- Wrap step descriptions in ReadableContent
- Add optional TTS for accessibility

### Phase F: Reasoning Cache Expansion (1–2 hours)
- Expand cache to meaning_generate or other stable flows
- Document intentionally uncached (highly personalized) content

## Cost/Benefit Analysis
- **Analytics events instrumented**: 9 event types (3 server-side, 6 client-side ready)
- **Monitoring coverage**: TTS (100%), Explain (100%), Readers (0% — hook available but not integrated)
- **Data available for precompute decisions**: Provider usage, cache hit rate, text length distribution, popular content types
- **Data available for cost optimization**: Cache effectiveness by content type, fallback usage patterns

## Ready for Merge?
✅ **YES** — All changes are additive, non-breaking, and instrumentation is safe (non-blocking client calls, wrapped server events). Backward compatible with any existing callers that don't emit events.
