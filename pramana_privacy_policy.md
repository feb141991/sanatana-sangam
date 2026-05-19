# Pramana User-Context & Personalization Policy

Pramana uses a strict, policy-enforced user-context architecture designed to enable context-aware spiritual personalization without reading unrestricted or sensitive user data. All personalization features are governed by the classification boundaries outlined in this document.

---

## 📋 Data Classification Model

| Data Category | Policy Classification | Code Type | Examples | Transmission Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Public Corpus** | `PUBLIC_CORPUS` | (no type — corpus data) | Scripture verses, commentaries, translations, moral fables | Always included in retrieval context |
| **User Preferences** | `USER_PREFERENCE` | `UserPreferenceContext` | `preferredLanguage`, `preferredTradition`, `themePreference`, `fontSizePreference` | Passed as metadata parameters |
| **Behavior Summary** | `USER_BEHAVIOR_SUMMARY` | `UserBehaviorSummaryContext` | `morningUser`, `shortSessionPreference`, `bhaktiLeaningScore`, `studyLeaningScore`, `sessionCountLast7Days` | Via `summarizeUserSignals()` only |
| **Restricted Private** | `RESTRICTED_PRIVATE` | `RestrictedPrivateContext` | `fullName`, `email`, `phoneNumber`, `locationName`, `gotraOrLineage`, `privateJournalEntriesCount` | ❌ Never sent to LLM |
| **Never-Send** | `NEVER_SEND` | `NeverSendContext` | `passwords`, `apiTokens`, `sessionToken`, `latitude`, `longitude` | 🟥 Blocked at schema level |

---

## 🔐 Prompt-Facing Type Boundary

Only `SafeUserSummaryContext` fields may appear in AI prompt text. The allowed fields are:

| Field | Type | Source | Purpose in Prompt |
| :--- | :--- | :--- | :--- |
| `preferredLanguage` | `string` | `UserPreferenceContext` | Language instruction hint |
| `preferredTradition` | `string` | `UserPreferenceContext` | Commentary school selection |
| `sessionPreference` | `'short' \| 'detailed'` | `UserBehaviorSummaryContext` | Response length guidance |
| `timeOfDayPreference` | `'morning' \| 'evening' \| 'flexible'` | `UserBehaviorSummaryContext` | Tone adjustment hint |
| `leaningType` | `'bhakti' \| 'study' \| 'balanced'` | `UserBehaviorSummaryContext` | Devotional vs study emphasis |

**No fields from `RestrictedPrivateContext` or `NeverSendContext` are represented in any prompt-facing type.**

---

## 🛡️ Architectural Rules

### 1. What Stays Deterministic Only
* **Panchang & Muhurata Calculations**: Computed via mathematical algorithms. No AI access to raw coordinates.
* **Lineage & Community Access Controls**: Enforced by Supabase RLS. No LLM involvement.

### 2. Context Summarization Layer
The `summarizeUserSignals()` function in `@sangam/pramana-core` is the **only** pathway from raw user data to prompt context. It reads only `preferences` and `behaviorSummary` fields and ignores `privateData` and `sensitiveNeverSend` entirely.

```typescript
function summarizeUserSignals(signals: Partial<RawUserSignals>): SafeUserSummaryContext
```

### 3. getUserSummaryContextNote() — Prompt Injection Point
The `getUserSummaryContextNote()` helper in `context-builder.ts` converts a `SafeUserSummaryContext` into a human-readable annotation appended to the prompt. If no context is provided (`undefined`), the helper returns an empty string — no personalization note is added.

---

## 📲 Future Feature Boundaries

### Notifications
Personalized notification content (e.g. "Good morning, start your sadhana") may reference:
- ✅ `timeOfDayPreference` (to choose morning vs evening phrasing)
- ✅ `preferredLanguage` (to localize the notification)
- ❌ Must NOT include `fullName`, `email`, or any `RestrictedPrivateContext` field in notification text sent to AI

### Recommendations
Personalized content recommendations (e.g. "Try this Upanishad passage next") may reference:
- ✅ `leaningType` (bhakti vs study)
- ✅ `sessionPreference` (short vs detailed)
- ❌ Must NOT use raw session logs, clickstream data, or private journal content

### Reading Personalization
Adjustments to reading UX (font size, theme) are handled client-side from `UserPreferenceContext` and **never** sent to the LLM.

---

## ⚙️ Explicit Opt-In Requirements

Before activating personalized AI features in production, the platform will implement:
1. An explicit UI toggle in **Settings** allowing the practitioner to enable/disable AI-assisted personalization.
2. Granular toggles per data type (e.g. "Allow time-of-day personalization", "Allow devotional/study leaning").
3. A clear "What Pramana knows about you" transparency view.
