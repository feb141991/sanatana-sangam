# Deprecated Capacitor Setup

The Capacitor native-wrapper path for Shoonaya was retired on 2026-07-03.

The web/PWA repo no longer owns a native shell. The canonical native app is the standalone Expo/React Native repository:

`/Users/Business(C)/shoonaya-mobile`

Removed from this repo:

- `capacitor.config.ts`
- `native-config/`
- stub `android/` web asset
- `@capacitor/*` dependencies
- `capacitor-voice-recorder`

Do not restart native app work from this web repo. Use this repo as the web/API/Supabase/source-contract project and use `shoonaya-mobile` for native implementation.
