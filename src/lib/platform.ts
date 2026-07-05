// ─── Platform Detection ───────────────────────────────────────────────────────
//
// Historically this detected a Capacitor native shell (Android / iOS) vs. the
// browser/PWA. The Capacitor native wrapper has been deprecated in favor of
// the standalone Expo/React Native app (see shoonaya-mobile repo) — this app
// now only ever runs as a web app / installed PWA, so all "native" branches
// below are permanently inert and kept only so existing call sites don't need
// to change.
//
// Usage:
//   import { isNative, isAndroid, isIOS, getPlatform } from '@/lib/platform'
// ─────────────────────────────────────────────────────────────────────────────

export function isNative(): boolean {
  return false
}

export function isAndroid(): boolean {
  return false
}

export function isIOS(): boolean {
  return false
}

export function isWeb(): boolean {
  return true
}

export type Platform = 'android' | 'ios' | 'web'

export function getPlatform(): Platform {
  return 'web'
}

// ── Safe audio MIME type per platform ────────────────────────────────────────
// Used by useRecitation / useNativeAudio (browser MediaRecorder path).
export function getBestAudioMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',  // Chrome, Edge, Android WebView
    'audio/webm',
    'audio/ogg;codecs=opus',   // Firefox
    'audio/mp4',               // Safari / iOS WebView fallback
  ]
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) ?? 'audio/webm'
}

// ── Haptic feedback ───────────────────────────────────────────────────────────
// No native shell to delegate to anymore. Falls back to the Web Vibration API
// where supported (no-ops silently on iOS Safari / unsupported browsers).
export async function hapticLight(): Promise<void> {
  try { navigator.vibrate?.(10) } catch { /* no-op */ }
}

export async function hapticMedium(): Promise<void> {
  try { navigator.vibrate?.(20) } catch { /* no-op */ }
}

export async function hapticSuccess(): Promise<void> {
  try { navigator.vibrate?.([10, 30, 10]) } catch { /* no-op */ }
}
