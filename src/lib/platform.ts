// ─── Platform Detection ───────────────────────────────────────────────────────
//
// Detects whether the app is running:
//   - In a Capacitor native shell (Android / iOS)
//   - In a web browser (PWA / desktop)
//
// Usage:
//   import { isNative, isAndroid, isIOS, getPlatform } from '@/lib/platform'
//
//   if (isNative()) {
//     // Use Capacitor plugins
//   } else {
//     // Use browser APIs
//   }
// ─────────────────────────────────────────────────────────────────────────────

// Safe check — Capacitor sets window.Capacitor when running in native shell
export function isNative(): boolean {
  if (typeof window === 'undefined') return false
  return !!((window as unknown as Record<string, unknown>)['Capacitor'])
}

export function isAndroid(): boolean {
  if (!isNative()) return false
  return /android/i.test(navigator.userAgent)
}

export function isIOS(): boolean {
  if (!isNative()) return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function isWeb(): boolean {
  return !isNative()
}

export type Platform = 'android' | 'ios' | 'web'

export function getPlatform(): Platform {
  if (isAndroid()) return 'android'
  if (isIOS())     return 'ios'
  return 'web'
}

// ── Safe audio MIME type per platform ────────────────────────────────────────
// Used by useRecitation when running as PWA (not Capacitor native).
// Capacitor's audio recorder handles format selection natively.
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

// ── Safe haptic feedback ──────────────────────────────────────────────────────
// Vibrates on native, silently no-ops on web.
// Requires @capacitor/haptics to be installed.
export async function hapticLight(): Promise<void> {
  if (!isNative()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch { /* Haptics not installed — silent fail */ }
}

export async function hapticMedium(): Promise<void> {
  if (!isNative()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch { /* silent fail */ }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Success })
  } catch { /* silent fail */ }
}
