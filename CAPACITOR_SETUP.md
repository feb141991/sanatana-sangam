# Capacitor Native App Setup — Sanatana Sangam

## Prerequisites

- Node.js 18+
- For Android: Android Studio + JDK 17
- For iOS: Xcode 15+ (Mac only) + CocoaPods

---

## Step 1 — Install packages

```bash
npm install
```

This installs all Capacitor packages added to package.json:
- `@capacitor/core` — core runtime
- `@capacitor/cli` — build tooling (dev dep)
- `@capacitor/microphone` — mic permission + access
- `@capacitor-community/audio-recorder` — native recording
- `@capacitor/push-notifications` — native push
- `@capacitor/local-notifications` — offline reminders
- `@capacitor/haptics` — vibration feedback
- `@capacitor/status-bar` — status bar colour
- `@capacitor/splash-screen` — splash screen
- `@capacitor/keyboard` — keyboard resize behaviour
- `@capacitor/network` — online/offline detection
- `@capacitor/preferences` — local key-value storage
- `@capacitor/app` — app state (foreground/background)

---

## Step 2 — Initialise Capacitor (first time only)

```bash
npx cap init "Sanatana Sangam" com.sanatanasangam.app --web-dir out
```

> capacitor.config.ts is already configured — this just verifies the setup.

---

## Step 3 — Add native platforms (first time only)

```bash
npx cap add android
npx cap add ios          # Mac only
```

This creates `android/` and `ios/` folders at the project root.

---

## Step 4 — Apply native permission configs

### Android
Copy the permission entries from `native-config/android/AndroidManifest.additions.xml`
into `android/app/src/main/AndroidManifest.xml` inside `<manifest>`.

Copy `native-config/android/network_security_config.xml` to
`android/app/src/main/res/xml/network_security_config.xml` (create the `xml/` folder).

Add to your `<application>` tag:
```xml
android:networkSecurityConfig="@xml/network_security_config"
```

### iOS
Copy the permission entries from `native-config/ios/Info.plist.additions.xml`
into `ios/App/App/Info.plist` inside the root `<dict>`.

---

## Step 5 — CocoaPods install (iOS only)

```bash
cd ios/App
pod install
cd ../..
```

---

## Daily Development Workflow

### Option A — Live URL mode (current, fastest)
The app points to your deployed Vercel URL. Just build and sync:

```bash
# Build static + sync to native
npm run cap:sync

# Open in Android Studio
npm run cap:android

# Open in Xcode (Mac)
npm run cap:ios
```

### Live reload during development (your device on same WiFi)
```bash
# Android live reload
npm run cap:live:android

# iOS live reload
npm run cap:live:ios
```

---

## Building for Production / App Store

### Android (APK / AAB)
```bash
npm run cap:sync
# Then in Android Studio: Build → Generate Signed Bundle/APK
```

### iOS (IPA)
```bash
npm run cap:sync
# Then in Xcode: Product → Archive → Distribute App
```

---

## How the Recorder Works on Native

`src/hooks/useNativeAudio.ts` handles everything:

- On **web/PWA**: uses browser `MediaRecorder` API
- On **Android/iOS**: uses `@capacitor-community/audio-recorder` which
  calls native AVAudioRecorder (iOS) or MediaRecorder JNI (Android)

The output is always a `Blob` — the rest of the flow
(upload → `shruti.uploadAndScore()` → AI score) is identical on all platforms.

### iOS audio format
iOS records as `audio/aac` (M4A container). Groq Whisper accepts it natively.

### Android audio format
Android records as `audio/aac` or `audio/webm` depending on API level.
Groq Whisper accepts both.

---

## Option B — Static Export (future, full offline)

When ready to move off live URL mode:

1. Move all API routes to Supabase Edge Functions
2. Convert server components to client components
3. Build and deploy:

```bash
NEXT_CAPACITOR=true npm run build
# This generates out/ folder
npm run cap:sync
```

Key things to migrate for static export:
- `src/app/(main)/layout.tsx` — remove server Supabase calls, move to client
- `src/app/api/ai/chat/route.ts` → Supabase Edge Function
- `src/app/api/cron/` → Supabase pg_cron jobs (already in sadhana-engine)
- `src/lib/supabase-server.ts` → replace all usage with browser client
