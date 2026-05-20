# Analytics & Precompute Strategy for ReadableContent + Pipeline-Tagged Flows

## Overview
This document defines analytics tracking signals and precompute priorities for the new readable-content and pipeline-tagged infrastructure, enabling data-driven cost optimization and performance improvements.

---

## 1. Analytics Signals to Track

### 1.1 Reader Interaction Events

**Open Reader**
- Event: `reader_opened`
- Trigger: User clicks "Open in Reader" or swipe-up reader modal
- Dimensions: content_type, source, corpus, tradition, language
- Goal: Measure reader adoption rate; identify high-value content that drives reader usage

**Local Language Toggle**
- Event: `language_toggled`
- Trigger: User toggles between script (Devanagari → Transliteration → English, etc.)
- Dimensions: content_type, source_language, target_language, tradition
- Goal: Measure script preference; detect language gaps; inform localization prioritization

**Transliteration Toggle**
- Event: `transliteration_toggled`
- Trigger: User enables/disables transliteration overlay
- Dimensions: content_type, source_script, tradition
- Goal: Measure transliteration usage; assess need for script-specific features

---

### 1.2 Content Generation Events

**TTS Request**
- Event: `tts_requested`
- Trigger: User requests audio narration; cache hits are still tracked separately
- Dimensions: content_type, audio_mode, source, tradition, language, _cached (true/false)
- Goal: Volume by content_type; cost tracking; cache hit ratio

**Explain Request**
- Event: `explain_requested`
- Trigger: User requests meaning/explanation; track both cache hits and misses
- Dimensions: content_type, response_mode, tradition, language, _cached (true/false)
- Goal: Popular explain targets; cache hit effectiveness; model iteration insights

**Repeated Content Requests**
- Event: `repeated_request`
- Trigger: Same content is requested again (cache hit) OR generated again (cache miss)
- Dimensions: content_hash, content_type, time_since_previous_request, _cached
- Goal: Identify hot content; enable targeted precomputation; understand repeat patterns

---

## 2. Precompute Targets & Strategy

### 2.1 High-Value Precompute Categories

#### **Category 1: Popular TTS (Audio Narration)**
*Goal: Reduce inference latency + cost for hot content*

**Priority 1: Top 20 Kathas**
- Metric: TTS requests per katha (sorted descending)
- Action: Pre-generate audio for top 20 kathas in default voice (Hindi, Sarvam)
- Baseline cost: ~20 × 15 min × $0.015 per min = ~$4.50 (one-time)
- Savings: 20 × 2-5s inference latency per user; ~$0.01 per request saved

**Priority 2: Top 50 Verses (Pathshala)**
- Metric: Recite mode usage (verses played/recited)
- Action: Pre-generate key Upanishad/Gita verses; common stotrams (Gayatri, Devi Mahatmya)
- Baseline cost: ~50 × 1 min × $0.015 = ~$0.75
- Savings: Near-instant playback; high user satisfaction

**Priority 3: Common Stotrams & Mantras (Bhakti, Nitya Karma)**
- Metric: Unique stotram/mantra titles with TTS requests
- Action: Pre-generate 10–15 high-frequency stotrams (Aarti, Hanuman Chalisa, etc.)
- Baseline cost: ~15 × 3 min × $0.015 = ~$0.68
- Savings: ~3–5s latency reduction per request

---

#### **Category 2: Popular Explain Outputs (Cached Reasoning)**
*Goal: Reduce inference cost + latency for hot explanations*

**Priority 1: Top 50 Explanation Queries**
- Metric: Explain requests with response_mode = 'devotional_story_explain', 'scripture_passage_explain', etc.
- Action: Identify queries that repeat frequently; pre-cache top 50
- Baseline: Already cached via persistent reasoning cache on first request; subsequent requests hit cache instantly
- Savings: ~0.1–0.5s latency + ~$0.01–0.05 per generation (inference cost)

**Priority 2: Meaning/Definition Queries (High Frequency)**
- Metric: meaning_generate requests for common terms
- Action: Pre-generate definitions for 100+ Sanskrit/spiritual terms in top 3 languages
- Baseline cost: ~100 × $0.003 = ~$0.30
- Savings: Instant meaning lookups; improves user experience in reader

**Priority 3: Instructional Content (Nitya Karma, Vrat)**
- Metric: Help/explain requests on step descriptions
- Action: Pre-generate explanations for common steps (sandhya ritual, aarti steps, fasting rules)
- Baseline cost: Low (20–30 unique steps × $0.005 = ~$0.15)
- Savings: Reduces late-night user confusion; improves ritual accuracy

---

### 2.2 Precompute Strategy by Domain

#### **Pathshala**
| Target | Volume | Frequency | Cost | Savings | Priority |
|--------|--------|-----------|------|---------|----------|
| Top 20 Kathas (TTS) | 20 | Daily | $4.50 | $20–40/day user-time | **P0** |
| Top 50 Verses (TTS) | 50 | Hourly | $0.75 | $10–20/day user-time | **P1** |
| Top 50 Explain Queries | 50 | Already cached | $0 | Free after first hit | **P1** |
| Sanskrit term definitions | 100 | Per-session | $0.30 | $0–2/user | **P2** |

**Recommendation:** Pre-compute top 20 Kathas + 50 verses on server startup or via scheduled job.

---

#### **Bhakti (Katha, Stotram, Aarti, Japa)**
| Target | Volume | Frequency | Cost | Savings | Priority |
|--------|--------|-----------|------|---------|----------|
| Top 15 Stotrams (TTS) | 15 | Hourly | $0.68 | $5–15/day | **P0** |
| Top 10 Aartis (TTS + description explain) | 10 | Daily | $0.30 | $2–5/day | **P1** |
| Japa guidance audio | 5–10 | Daily | $0.15 | $1–2/day | **P2** |
| Bhajan meanings | 30 | Per-session | $0.15 | Low (niche) | **P2** |

**Recommendation:** Pre-compute 15 top stotrams; add 10 aartis if cost permits. Japa guidance is lower priority.

---

#### **Nitya Karma (Daily Ritual, Sandhya, Vrat)**
| Target | Volume | Frequency | Cost | Savings | Priority |
|--------|--------|-----------|------|---------|----------|
| Daily sandhya prayer + explanation | 1 | Daily | $0.005 | $1–3/day | **P0** |
| Vrat fasting rule explanations | 10 | Varies | $0.05 | $0–1/day | **P1** |
| Ritual step descriptions + meanings | 20 | Per-session | $0.10 | Low | **P2** |
| Jyotish personalized guidance | 5–10 | Per-user | $0.05–0.10 | High variance | **P1** |

**Recommendation:** Always pre-compute daily sandhya prayer; add vrat rules on-demand if traffic spikes.

---

#### **Vrat (Fasting, Special Days)**
| Target | Volume | Frequency | Cost | Savings | Priority |
|--------|--------|-----------|------|---------|----------|
| Upcoming Vrat checklist & meaning | 5–10 per month | Per-festival | $0.03–0.10 | $2–10/month | **P1** |
| Vrat recipe descriptions | 20 | Seasonal | $0.10 | Low | **P2** |

**Recommendation:** Pre-compute Vrat details 1–2 weeks before major festivals.

---

## 3. Implementation Plan

### Phase 1: Instrumentation (Immediate)
- Add analytics event hooks to:
  - Reader open (React component click)
  - TTS requests (route-side before cache check)
  - Explain requests (route-side before cache check)
  - Cache hits/misses (emit as P3 events with `_cached` flag)
- Log events to event sink for aggregation
- No blocking; events are fire-and-forget

### Phase 2: Analytics Collection & Dashboard (Week 1)
- Query event sink for:
  - Top 20 kathas by TTS request volume
  - Top 50 verses by explain requests
  - Cache hit ratio by content_type
  - Reader open rate by surface
- Create simple dashboard or CSV export for decision-making

### Phase 3: Precompute Job (Week 2)
- Create `/scripts/precompute-hot-content.ts`
- Inputs: Top N content from Phase 2 analytics
- Logic:
  1. Batch TTS requests for top content
  2. Store results in persistent cache
  3. Emit `precomputed` events for tracking
- Run on-demand or scheduled (e.g., weekly)

### Phase 4: Cost Optimization (Week 3+)
- Monitor cache hit ratio; adjust precompute targets
- Identify seasonal patterns (e.g., Vrat season)
- Consider provider switching (e.g., Sarvam vs Google) based on cost/quality tradeoffs

---

## 4. Analytics Event Schema

```typescript
interface AnalyticsEvent {
  timestamp: ISO8601
  event_name: 'reader_opened' | 'language_toggled' | 'transliteration_toggled' | 'tts_requested' | 'explain_requested' | 'repeated_request'
  user_id: string // hashed/pseudonymous
  session_id: string
  
  // Content dimensions
  content_type: 'katha' | 'verse' | 'stotram' | 'mantra' | 'prayer' | 'instruction' | 'checklist'
  content_id: string // hash of title/source
  source: string // 'Gita', 'Upanishad', 'Bhakti_Katha', etc.
  corpus: string // corpus ID
  tradition: string // 'hindu', 'sikh', 'buddhist', 'jain'
  
  // Context
  language: string // 'hi', 'en', 'sa', etc.
  response_mode?: string // 'devotional_story_explain', 'scripture_passage_explain', etc.
  
  // Performance & cost tracking
  latency_ms?: number
  cache_hit?: boolean
  provider?: string // 'sarvam', 'google', 'hosted'
  model?: string
  
  // Custom fields
  [key: string]: any
}
```

---

## 5. Cost & Savings Estimates

### Current State (Estimated)
- Monthly TTS inference: ~500 requests × $0.01 avg = ~$5
- Monthly explain inference: ~1000 requests × $0.005 avg = ~$5
- **Total: ~$10/month**

### After Precompute (Estimated)
- TTS pre-computed: 100 popular items (one-time cost: ~$1.50)
- Cache hit ratio improves from ~20% → ~60%
- Monthly TTS inference: 500 × 0.4 × $0.01 = ~$2
- Monthly explain inference: 1000 × 0.3 × $0.005 = ~$1.50
- **Total: ~$3.50/month + $1.50 one-time = ~4.5x cost reduction**

---

## 6. Key Metrics to Monitor

1. **Cache Hit Ratio (by content_type)**
   - Target: >50% for kathas, >60% for verses
   - Current: ~20% (TTS), ~15% (explain)

2. **Time to First TTS/Explain**
   - Target: <100ms for cache hit, <2s for generation
   - Monitor: p50, p95 latencies

3. **User Satisfaction (Proxy)**
   - Reader open rate (higher = better)
   - Repeated request rate (higher = good content)

4. **Cost per User**
   - Target: <$0.05 per monthly active user
   - Current: ~$0.10 (estimated)

---

## 7. Next Steps

1. **Immediate:** Add `_cached` flag to reasoning cache wrapper; emit events
2. **Week 1:** Collect 1 week of analytics data; identify top 20 kathas
3. **Week 2:** Implement precompute job; pre-generate top content
4. **Week 3:** Monitor cache hit ratio; adjust targets based on data
5. **Week 4+:** Roll out to production; measure cost savings

---

## References
- TTS Cache: `src/lib/tts/cache.ts`
- Reasoning Cache: `src/lib/ai/reasoning-cache.ts`
- Explain Route: `src/app/api/pathshala/explain/route.ts`
- TTS Route: `src/app/api/tts/route.ts`
