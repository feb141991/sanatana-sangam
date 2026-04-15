// ─── useNativeAudio — Capacitor-aware audio recording hook ───────────────────
//
// This is the native-app replacement for the browser MediaRecorder approach
// used in pathshala-engine's useRecitation hook.
//
// How it works:
//   - On WEB:    Falls back to browser MediaRecorder (same as useRecitation)
//   - On NATIVE: Uses capacitor-voice-recorder for proper
//                iOS/Android native recording with correct permissions.
//
// Usage (drop-in for any recording screen):
//
//   const audio = useNativeAudio()
//
//   await audio.requestPermission()   // ask once on first use
//   await audio.start()               // begin recording
//   await audio.stop()                // stop → returns Blob
//
//   // Then pass the blob to shruti.uploadAndScore()
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useCallback, useRef, useState } from 'react'
import { isNative, getBestAudioMime } from '@/lib/platform'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AudioPermissionStatus = 'unknown' | 'granted' | 'denied' | 'prompt'

export interface NativeAudioState {
  isRecording:       boolean
  isPreparing:       boolean          // requesting permission or initialising
  durationMs:        number           // live counter
  audioLevel:        number           // 0–100 amplitude
  permissionStatus:  AudioPermissionStatus
  error:             string | null
}

export interface UseNativeAudioReturn extends NativeAudioState {
  requestPermission: () => Promise<boolean>
  start:             () => Promise<void>
  stop:              () => Promise<Blob | null>
  cancel:            () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNativeAudio(): UseNativeAudioReturn {
  const [state, setState] = useState<NativeAudioState>({
    isRecording:      false,
    isPreparing:      false,
    durationMs:       0,
    audioLevel:       0,
    permissionStatus: 'unknown',
    error:            null,
  })

  // Web fallback refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<BlobPart[]>([])
  const streamRef        = useRef<MediaStream | null>(null)
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef     = useRef<number>(0)
  const analyserRef      = useRef<AnalyserNode | null>(null)
  const animFrameRef     = useRef<number | null>(null)
  const audioCtxRef      = useRef<AudioContext | null>(null)

  // ── Permission ──────────────────────────────────────────────────────────────

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isPreparing: true, error: null }))

    if (isNative()) {
      // ── Capacitor native permission request (via capacitor-voice-recorder) ──
      try {
        const { VoiceRecorder } = await import('capacitor-voice-recorder')
        const status  = await VoiceRecorder.requestAudioRecordingPermission()
        const granted = status.value === true
        setState(prev => ({
          ...prev,
          isPreparing:      false,
          permissionStatus: granted ? 'granted' : 'denied',
          error: granted ? null : 'Microphone permission denied. Enable it in device Settings.',
        }))
        return granted
      } catch (err) {
        // Plugin not installed — fall back to web
        console.warn('[useNativeAudio] capacitor-voice-recorder not available, falling back to web', err)
      }
    }

    // ── Web permission request (PWA fallback) ──
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())   // just checking permission
      setState(prev => ({ ...prev, isPreparing: false, permissionStatus: 'granted' }))
      return true
    } catch (err) {
      const msg = (err as Error).name === 'NotAllowedError'
        ? 'Microphone access denied. Allow it in browser settings.'
        : `Microphone error: ${(err as Error).message}`
      setState(prev => ({ ...prev, isPreparing: false, permissionStatus: 'denied', error: msg }))
      return false
    }
  }, [])

  // ── Start ───────────────────────────────────────────────────────────────────

  const start = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isPreparing: true, error: null, durationMs: 0 }))

    if (isNative()) {
      try {
        const { VoiceRecorder } = await import('capacitor-voice-recorder')

        // Check/request permission natively
        const perm = await VoiceRecorder.requestAudioRecordingPermission()
        if (!perm.value) {
          setState(prev => ({
            ...prev, isPreparing: false,
            error: 'Microphone permission denied.',
            permissionStatus: 'denied',
          }))
          return
        }

        await VoiceRecorder.startRecording()
        startTimeRef.current = Date.now()

        // Live duration counter
        timerRef.current = setInterval(() => {
          setState(prev => ({ ...prev, durationMs: Date.now() - startTimeRef.current }))
        }, 100)

        setState(prev => ({
          ...prev,
          isRecording:      true,
          isPreparing:      false,
          permissionStatus: 'granted',
        }))
        return
      } catch (err) {
        console.warn('[useNativeAudio] VoiceRecorder not available, falling back to web', err)
        // Fall through to web fallback
      }
    }

    // ── Web fallback ──────────────────────────────────────────────────────────
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch (err) {
      setState(prev => ({
        ...prev, isPreparing: false,
        error: (err as Error).name === 'NotAllowedError'
          ? 'Microphone access denied.'
          : `Cannot access microphone: ${(err as Error).message}`,
        permissionStatus: 'denied',
      }))
      return
    }

    streamRef.current  = stream
    chunksRef.current  = []

    const mime     = getBestAudioMime()
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    // Start amplitude meter
    try {
      const ctx      = new AudioContext()
      const source   = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioCtxRef.current  = ctx
      analyserRef.current  = analyser
      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setState(prev => ({ ...prev, audioLevel: Math.min(100, Math.round((avg / 128) * 100)) }))
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } catch { /* amplitude meter is non-critical */ }

    recorder.start(250)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, durationMs: Date.now() - startTimeRef.current }))
    }, 100)

    setState(prev => ({ ...prev, isRecording: true, isPreparing: false, permissionStatus: 'granted' }))
  }, [])

  // ── Stop ────────────────────────────────────────────────────────────────────

  const stop = useCallback(async (): Promise<Blob | null> => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null

    setState(prev => ({ ...prev, isRecording: false, audioLevel: 0 }))

    if (isNative()) {
      try {
        const { VoiceRecorder } = await import('capacitor-voice-recorder')
        const result = await VoiceRecorder.stopRecording()

        // VoiceRecorder returns base64 — convert to Blob
        const base64 = result.value.recordDataBase64 ?? ''
        const mime   = result.value.mimeType || 'audio/aac'
        const binary = atob(base64)
        const bytes  = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        return new Blob([bytes], { type: mime })
      } catch (err) {
        console.warn('[useNativeAudio] VoiceRecorder stop failed', err)
        return null
      }
    }

    // ── Web fallback stop ─────────────────────────────────────────────────────
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') { resolve(null); return }

      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []
        resolve(blob)
      }
      recorder.stop()
    })
  }, [])

  // ── Cancel ──────────────────────────────────────────────────────────────────

  const cancel = useCallback((): void => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    if (isNative()) {
      import('capacitor-voice-recorder')
        .then(({ VoiceRecorder }) => VoiceRecorder.stopRecording().catch(() => {}))
        .catch(() => {})
    } else {
      mediaRecorderRef.current?.stop()
    }

    setState({
      isRecording: false, isPreparing: false,
      durationMs: 0, audioLevel: 0,
      permissionStatus: state.permissionStatus,
      error: null,
    })
  }, [state.permissionStatus])

  return { ...state, requestPermission, start, stop, cancel }
}
