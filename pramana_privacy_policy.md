# Pramana User-Context & Personalization Policy

Pramana uses a strict, policy-enforced user-context architecture designed to enable context-aware spiritual personalization without reading unrestricted or sensitive user data. All personalization features are governed by the classification boundaries outlined in this document.

---

## 📋 Data Classification Model

| Data Category | Policy Status | Examples of Data | Transmission Policy |
| :--- | :--- | :--- | :--- |
| **Public Corpus Context** | ✅ **Always Allowed** | Scripture verses, commentaries, translations, manifest structure, moral fables. | Included in retrieved context block to ground responses. |
| **User Preference Context** | ✅ **Allowed (Opt-in/Default)** | Preferred tradition, preferred language, theme settings, font size. | Passed as high-level metadata key-value parameters. |
| **User Behavior Summary** | ✅ **Allowed (Safe Aggregates)** | Morning-user indicator, session duration category (short/long), study vs. devotional leaning indexes. | Handled via summarizers; raw event feeds/clickstreams are strictly excluded. |
| **Restricted Private Data** | ❌ **Disallowed** | Full name, email address, phone number, lineage/Gotra name, family tree nodes, private journals. | Never passed to LLM prompt builders. |
| **Never-Send Fields** | 🟥 **Strictly Disallowed** | Secrets, passwords, session tokens, exact GPS coordinate values (latitude/longitude). | Blocked at the schema contract level. |

---

## 🛡️ Privacy Boundaries & Architectural Rules

### 1. What Stays Deterministic Only
* **Panchang & Muhurata Calculations**: Lunar days (tithis), nakshatras, and solar transits are calculated strictly via mathematical algorithms and astronomers' charts. The AI engine is never given access to raw location coordinates or used to dynamically generate astrological predictions.
* **Lineage & Community Access Controls**: Kul assignment, membership validations, and neighborhood/Sabha visibility are enforced strictly by Supabase RLS (Row Level Security) and database constraints. The LLM never makes access control decisions.

### 2. Context Summarization Layer
To prevent raw user logs from bleeding into prompts, the application utilizes a safe summarizer:
```typescript
export function summarizeUserSignals(signals: Partial<RawUserSignals>): SafeUserSummaryContext {
  // Converts raw interaction metrics into simple, high-level behavioral tags
  // (e.g., morningUser: true -> timeOfDayPreference: 'morning')
}
```

### 3. Future Explicit Opt-In Requirements
Before extending this context layer to personalized notifications, spiritual suggestions, or daily recommendations, the platform will implement:
* An explicit UI toggle in the **Settings** view allowing the practitioner to toggle personalized AI suggestions.
* Granular toggles for each data type (e.g., "Allow time-of-day personalization", "Allow reading reading style leaning indices").
