# Morning-card fonts

Read from disk at run time by `src/lib/marketing/social/morning/card-renderer.ts`. They ship with the
`/api/admin/marketing/social/morning-cards` routes through `outputFileTracingIncludes` in `next.config.js`.

## What is here

| File | Family | Used for | Provenance |
|---|---|---|---|
| `CormorantGaramond_600SemiBold.ttf`, `..._Italic.ttf` | Cormorant Garamond | translation, wordmark | Copied unmodified from the native app's `@expo-google-fonts/cormorant-garamond` 0.4.1, 2026-10-15 |
| `Inter_500Medium.ttf`, `Inter_600SemiBold.ttf` | Inter | labels, citation | Copied unmodified from `@expo-google-fonts/inter` 0.4.2, 2026-10-15 |
| `Mukta_500Medium.ttf`, `Mukta_700Bold.ttf` | Mukta | Devanagari verses | Copied unmodified from `@expo-google-fonts/mukta` 0.4.1, 2026-10-15 |
| `NotoSansGurmukhi-Medium.ttf` | Noto Sans Gurmukhi Medium | Gurmukhi verses | Official Google Fonts Noto repository, SIL OFL 1.1 |
| `OFL-*.txt` | | licences | SIL Open Font License 1.1, from each package |

These are the same families the app uses (`FONTS` in the native `lib/constants.ts`), plus Noto Sans Gurmukhi for server-rendered Gurbani cards.
All are under the SIL Open Font License 1.1, which allows use and embedding in products.

## Installed Fonts

- **Devanagari**: `Mukta_500Medium.ttf` (Mukta Medium) & `Mukta_700Bold.ttf` (Mukta Bold)
- **Gurmukhi**: `NotoSansGurmukhi-Medium.ttf` (Noto Sans Gurmukhi Medium)
- **Latin**: `CormorantGaramond` (SemiBold, Italic) & `Inter` (Medium, SemiBold)

## Why two text engines

Indic scripts are set with sharp's text API (Pango/HarfBuzz) for correct shaping. Latin text is set with
satori (`next/og`), because sharp's text engine silently substituted a system sans for Inter, Cormorant
Garamond and Kalam in testing (macOS, sharp 0.34.5). Only Mukta registered there. Re-test on the deployed
runtime before relying on the Indic path in production: the run-time font check will fail loudly if the
file does not load.
