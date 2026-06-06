# Dharma Mitra — Language-Aware Response Architecture

**Date:** 2026-06-06
**Session context:** Making both AI chat surfaces (full page + FAB) respond in the user's app language
**Category:** architecture

## What we decided

Both `AIChatFAB` and the full `/ai-chat` page send a `language` field to the AI API. The language
is sourced from the user's profile `app_language` column and threaded down as a prop from
`layout.tsx`. The FAB additionally exposes a compact in-header selector (EN / हि / ਪੰ) seeded
from `appLanguage`, allowing per-session overrides without changing the profile setting.

## Prop chain

```
layout.tsx (reads appLanguage from profile)
  → AIChatFABWrapper (receives appLanguage prop)
    → AIChatFAB (responseLanguage state seeded from appLanguage)
```

The full `/ai-chat` page reads `appLanguage` the same way but does not expose a per-session
selector — it always uses the profile language.

## API language resolution (canonical fallback order)

```
body.language || body.appLanguage || profile?.app_language || 'en'
```

`body.language` is the explicit per-request field; `body.appLanguage` is a legacy/fallback
field sent by older clients. The final fallback to `'en'` ensures no request is ever
language-undefined.

## System prompt enforcement

The language instruction in the system prompt uses a MUST directive, not a soft preference:

> "You MUST respond in the language indicated by code X. Do not switch unless user explicitly
> requests it."

This was deliberately made mandatory. A "preferred" framing gave the model latitude to
drift back to English mid-conversation, which breaks the experience for Hindi and Punjabi users
who rely on script-correct responses (Devanagari for `hi`, Gurmukhi for `pa`).

## Supported language codes

| Code | Language | Script |
|------|----------|--------|
| `en` | English | Latin |
| `hi` | Hindi | Devanagari |
| `pa` | Punjabi | Gurmukhi |

## Constraints this creates

- New languages must be added to the in-FAB selector UI as well as the system prompt language
  table. Adding only one of the two creates a mismatch.
- The API fallback chain means `body.language` always wins — clients that want to override the
  profile setting should use this field.
- The system prompt MUST directive should never be softened to "preferred" or "try to" — the
  model will silently drift to English if given an out.
- `responseLanguage` state in the FAB is local to the session; it is not persisted and does not
  update `app_language` in the profile.

## What we explicitly rejected

- **"Preferred" language framing in the system prompt** — gives model too much latitude; causes
  drift back to English mid-conversation.
- **Persisting the FAB per-session language selector to the profile** — the selector is a
  low-friction in-session toggle, not a settings change. Persisting it would silently override
  the user's profile preference.
- **Single language source on the client** — the fallback chain was kept to support legacy clients
  that send `appLanguage` instead of `language`.

---
