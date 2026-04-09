# Language Support Plan

Last updated: 2026-04-09

## Goal

Support regional languages in a way that improves trust and usability without mixing three different problems into one:

1. `App UI localization`
2. `Sacred content script and translation support`
3. `User preference and personalization`

These should not be implemented as one global language toggle.

## Product Principle

A user may want:

- the app UI in English
- Bhagavad Gita in Devanagari
- transliteration enabled
- explanation in Hindi

So the product should separate:

- `app_language`
- `script_preference`
- `transliteration_enabled`
- `meaning_language`

## Recommendation

### Phase 1: sacred text support first

Ship the content-layer choices before full app-wide localization.

This includes:

- original script where available
- transliteration
- trusted meaning / translation
- per-tradition script handling

This has the highest value for Pathshala, recitation, Zen mode, and Mala mode.

### Phase 2: app UI localization

Once the text model is stable, localize the shell and product copy.

Recommended first launch languages:

- English
- Hindi
- Punjabi

Recommended second wave:

- Gujarati
- Marathi
- Bengali
- Tamil

Do not launch too many UI languages at once.

### Phase 3: deeper personalization

Let users choose:

- app language
- scripture script
- transliteration on/off
- explanation language

Use profile settings and maybe quick switches in Pathshala.

## Technical Direction

### App UI

Use locale-based routing and message files for UI strings.

Suggested stack:

- Next.js App Router i18n pattern
- `next-intl` for message loading and formatting

Suggested structure:

- `messages/en.json`
- `messages/hi.json`
- `messages/pa.json`

### Sacred content

Do not store sacred text as one flattened translated blob.

The content model should support:

- original text
- script
- transliteration
- one or more translations
- source metadata
- per-verse / per-line rendering

### Preferences

Add profile-level fields later for:

- `app_language`
- `script_preference`
- `meaning_language`
- `transliteration_enabled`

## Accessibility

Regional language support must stay elder-friendly:

- readable typefaces for Indic scripts
- generous line height
- no cramped chips or tiny labels
- explicit language names in their own script and English

## Risks

- translating sacred meaning too casually can reduce trust
- mixing UI translation with scripture translation creates confusion
- too many launch languages increase QA and consistency costs sharply

## Launch Order

1. Pathshala script and transliteration support
2. user preference model for content display
3. app shell localization in English, Hindi, Punjabi
4. broader regional expansion

## Sources

- Next.js App Router internationalization: https://nextjs.org/docs/app/guides/internationalization
- next-intl App Router setup: https://next-intl.dev/docs/getting-started/app-router
- W3C language tags guidance: https://www.w3.org/International/articles/language-tags/
- W3C personal names guidance: https://www.w3.org/International/questions/qa-personal-names

