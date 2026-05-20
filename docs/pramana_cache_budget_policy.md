# Pramana Cache & AI Budget Policy

This document defines the exact cache and AI-spend policies for Shoonaya, specifically focusing on a Sarvam-first architecture. It dictates what must be cached globally, per-user, or avoided entirely to ensure scalability, cost efficiency, and low latency.

## 1. Global Caching (Shared Across All Users)

Data that does not change per user and is expensive to generate must be cached globally.

- **Translations & Meanings (`/api/i18n/meaning`)**:
  - **Policy**: Must be cached in the `content_meanings` table in Supabase.
  - **Key**: `[entry_id]_[target_language]` or `Hash(source_meaning)_[target_language]`.
  - **Invalidation**: Never invalidates automatically. Must be updated manually or via admin tool if corrections are needed.
  - **Cost Saving**: Prevents duplicate Sarvam Translate API calls for common Dharmic terms (e.g., Ahimsa, Dharma) across thousands of users.

- **Text-to-Speech Audio (`/api/tts`)**:
  - **Policy**: Audio files generated from static text (e.g., sutras, shlokas) must be cached via CDN (Cloudflare/Vercel Edge Network) and/or stored in a persistent bucket (like Supabase Storage).
  - **Key**: `Hash(text_quality_rate_language)`.
  - **Invalidation**: Immutable. If text changes, a new hash is generated.
  - **Cost Saving**: Drastically reduces Sarvam Bulbul API costs for repeatedly played verses in Pathshala or Nitya Karma.

- **Precomputed Pathshala Insights**:
  - **Policy**: High-traffic scriptures (like the Bhagavad Gita) should have their `PathshalaExplain` outputs precomputed during build or via an admin cron job.
  - **Cost Saving**: A single Sarvam Reasoning call per verse instead of one per user request.

## 2. Per-User Caching (User-Specific Data)

Data personalized to the user should be cached per session or per day.

- **Personal Daily Plans & Nitya Karma**:
  - **Policy**: Generated once per day per user and cached in the database (e.g., `user_daily_plans`).
  - **Key**: `[user_id]_[date]`.
  - **Invalidation**: Midnight local time or explicit user refresh.

- **Chat History & Context**:
  - **Policy**: Context is loaded from the database; the active window is maintained per session.
  - **Key**: `[user_id]_[session_id]`.

## 3. Strict "Never Call AI" Zones

Certain features must remain purely deterministic for speed and safety.

- **Core UI & Navigation Text**: Handled via static i18n files.
- **Calendar & Panchang Lookups**: Calculated using astronomical libraries (e.g., Swiss Ephemeris). Never use LLMs for date math or Tithi calculations.
- **Static Sutra/Verse Fetching**: Retrieving the original Sanskrit/Pali text must hit the database directly.

## 4. AI Budget Controls & Rate Limiting

Controls to protect the AI budget, especially for open-ended lanes like DharmaChat.

- **DharmaChat Limits**:
  - **Free Tier**: 5 messages per day.
  - **Pro Tier**: 100 messages per day.
  - **Enforcement**: Tracked via `sadhana_events` in Supabase.
  
- **Token Limits (Reasoning)**:
  - Default `max_tokens` across all reasoning endpoints should be capped strictly (e.g., 512 or 800 tokens) to prevent runaway generation costs.

- **Graceful Fallback & Degradation**:
  - If the primary provider (e.g., Sarvam) fails, the system must either gracefully inform the user or fall back to an available self-hosted model.
  - **Implementation**: The Inference Provider seam (`PRAMANA_INFERENCE_PROVIDER`) supports switching, but run-time dynamic failover requires a circuit-breaker wrapper around `generateWithProvider`.

---

## Feature-by-Feature Guidance Summary

| Feature | Primary AI Action | Caching Strategy | Cost Mitigation |
| :--- | :--- | :--- | :--- |
| **Pathshala** | Verse explanation | Global (Precompute) | Build-time ingestion |
| **Bhakti** | Story explanation | Global (Precompute) | Build-time ingestion |
| **TTS** | Text to audio | Global (CDN/Storage) | Deduplicate exact strings |
| **Translations**| Word meaning | Global (Supabase) | `content_meanings` table |
| **DharmaChat** | Conversation | Per-User History | Strict daily msg quotas |
| **Notifications**| Milestone alerts | None (Templates) | Do not use AI for basic alerts |

**Biggest Cost-Saving Wins**:
1. CDN caching for Sarvam TTS outputs (prevents 99% of redundant audio generation costs).
2. Supabase caching for Sarvam translations (terms are highly repetitive).
3. Precomputing Pathshala insights for standard texts (e.g., Gita).
