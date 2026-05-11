import type { CapacitorConfig } from '@capacitor/cli';

// ─── Capacitor Configuration ──────────────────────────────────────────────────
//
// Option A (current): server.url points to live Vercel deployment.
//   → Native app is a shell around your deployed web app.
//   → Everything works immediately — server components, auth, API routes.
//   → Requires internet. No offline.
//
// Option B (future): comment out `server` block entirely and set
//   next.config.js `output: 'export'`. Capacitor serves the static
//   `out/` bundle locally. Fully offline-capable.
//
// Switch by toggling the `server` block below.
// ─────────────────────────────────────────────────────────────────────────────

const config: CapacitorConfig = {
  // ── App identity ─────────────────────────────────────────────────────────
  appId:   'com.shoonaya.app',
  appName: 'Shoonaya',

  // ── Web asset directory ───────────────────────────────────────────────────
  // Option A: webDir is irrelevant when server.url is set (it overrides it).
  // Option B: set to 'out' (Next.js static export output).
  webDir: 'out',

  // ── Option A — Live URL mode ──────────────────────────────────────────────
  // Comment this entire block out when switching to Option B.
  server: {
    // Replace with your actual Vercel URL.
    // In development, use your local network IP so the device can reach it:
    //   url: 'http://192.168.x.x:3000'
    url:             'https://sanatana-sangam.vercel.app',
    cleartext:       false,   // never allow HTTP in production
    allowNavigation: [
      '*.supabase.co',         // Supabase API + storage
      '*.onesignal.com',       // push notifications
      'generativelanguage.googleapis.com', // Gemini (if called client-side)
    ],
  },

  // ── Plugin configuration ──────────────────────────────────────────────────
  plugins: {

    // Push Notifications — uses OneSignal, but Capacitor's native push
    // must be registered first to get the device token for OneSignal.
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Status Bar — match your brand colour
    StatusBar: {
      style:           'DARK',   // 'DARK' = white icons (good on orange bg)
      backgroundColor: '#ff7722', // Sangam orange
      overlaysWebView: false,
    },

    // Splash Screen
    SplashScreen: {
      launchShowDuration:     2000,
      launchAutoHide:         true,
      backgroundColor:        '#FDF6E3',  // Sangam cream
      androidSplashResourceName: 'splash',
      showSpinnerShortly:     false,
    },

    // Microphone — permissions are declared in native manifests separately.
    // No plugin config needed here for @capacitor/microphone.

    // Local Notifications — for offline reminders (vrata alerts, sadhana nudges)
    LocalNotifications: {
      smallIcon:     'ic_stat_sangam',
      iconColor:     '#ff7722',
    },

    // Keyboard behaviour
    Keyboard: {
      resize:          'body',
      resizeOnFullScreen: true,
    },
  },

  // ── Android-specific ─────────────────────────────────────────────────────
  android: {
    buildOptions: {
      keystorePath:    undefined,  // set via env in CI
      keystoreAlias:   undefined,
    },
    // Allows the WebView to access Supabase Storage URLs over HTTPS
    allowMixedContent: false,
    // Required for audio recording — see android/app/src/main/AndroidManifest.xml
    // RECORD_AUDIO permission is added there.
  },

  // ── iOS-specific ──────────────────────────────────────────────────────────
  ios: {
    contentInset: 'automatic',
    // NSMicrophoneUsageDescription is in ios/App/App/Info.plist
    // NSCameraUsageDescription added for future QR/photo features
    // WKWebView is the default — no UIWebView
  },
};

export default config;
