# Pramana TTS Analytics & Precompute Strategy

This document outlines how Shoonaya will leverage TTS request data to continuously optimize AI spend and improve synthesized speech quality.

## 1. Analytics Signals to Track

To build a cost-efficient TTS engine, we must track and analyze the following telemetry on every TTS request:

- **Cache Hit vs. Miss Ratio**: 
  - *Metric*: Percentage of requests served from storage vs. hitting the provider API.
  - *Goal*: Target > 90% cache hit rate for structured learning paths.
- **Top Uncached Passages**:
  - *Metric*: Frequency of specific hashes generating a cache miss.
  - *Goal*: Identify dynamic texts that could be generalized or pre-cached.
- **Provider Failure & Latency Rates**:
  - *Metric*: HTTP status codes and response times for Sarvam vs. Google fallback.
  - *Goal*: Automatically shift traffic to the fastest provider during high load.
- **Language & Voice Usage Distribution**:
  - *Metric*: Count of requests per language (`hi-IN`, `en-IN`, etc.) and quality profile (`pandit` vs. `standard`).
  - *Goal*: Determine where to invest in custom voice cloning or specialized prompt engineering.
- **Replay Frequency**:
  - *Metric*: Client-side event tracking when a user replays the same audio segment.
  - *Goal*: If users replay a specific verse frequently, prioritize its manual review for pronunciation perfection.

## 2. Precompute Strategy

To save costs and guarantee zero-latency playback, certain content must be pre-generated rather than waiting for the first user to request it.

### What Should Be Pre-Generated (Zero Runtime AI)
1. **Core Pathshala Verses**: All canonical texts (Bhagavad Gita, Upanishads) must have their Sanskrit recitation (`pandit` quality) and English explanations (`akash`/`standard` quality) generated at build time or via a bulk admin script.
2. **Nitya Karma Shlokas**: Daily prayers and morning routines are identical for most users.
3. **Bhakti Katha Narration**: Static stories in the Bhakti lane.

### What Remains On-Demand (Live AI)
1. **DharmaChat Voice Output**: Completely dynamic conversations cannot be precomputed.
2. **Personalized Sanskar/Milestone Alerts**: If the text includes the user's name or dynamic dates (e.g., "Rahul, today is Ekadashi").

## 3. Biggest Cost-Saving Opportunities

1. **Pathshala Bulk Ingestion**: Running a script to generate all 700 verses of the Bhagavad Gita once will cost roughly $5 in API credits. Waiting for 10,000 users to request them individually without a persistent object cache would cost $50,000.
2. **Deterministic UI Audio**: Ensuring that "Next Lesson" or standard button audios are statically linked rather than dynamically generated.
3. **Error Suppression**: Tracking repeated failure hashes prevents the system from infinitely retrying a malformed string against the Sarvam API.
