// ============================================================
// useRecitation — MediaRecorder + Shruti engine hook
// ============================================================
// Drop this into your PWA's hooks folder.
// No external packages needed — uses browser-native MediaRecorder.
//
// Usage:
//   const rec = useRecitation({ shruti, userId, chunk, language })
//   <button onClick={rec.start}>Record</button>
//   <button onClick={rec.stop}>Stop & Score</button>
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ShrutiEngine } from '../ai/shruti'
import type { RecitationResult, ScriptureChunk } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecorderStatus =
  | 'idle'
  | 'requesting_mic'   // waiting for browser mic permission
  | 'ready'            // mic granted, not recording
  | 'recording'        // actively recording
  | 'processing'       // uploaded, waiting for AI score
  | 'scored'           // score received
  | 'error'

export interface RecitationState {
  status:        RecorderStatus
  durationMs:    number           // live counter while recording
  audioBlob:     Blob | null      // raw recorded audio
  audioUrl:      string | null    // local object URL for playback
  result:        RecitationResult | null
  error:         string | null
  recordingId:   string | null    // Supabase recording row id
}

export interface UseRecitationOptions {
  shruti:       ShrutiEngine
  userId:       string
  chunk:        ScriptureChunk           // the verse being recited
  language:     string                   // ISO code: 'sa', 'hi', 'ta', etc.
  enrollmentId?: string                  // optional — ties to a curriculum path
  onScored?:    (result: RecitationResult) => void
  onError?:     (msg: string) => void
}

export interface UseRecitationReturn extends RecitationState {
  start:           () => Promise<void>   // request mic + begin recording
  stop:            () => void            // stop + auto-upload + score
  reset:           () => void            // clear everything, back to idle
  submitForGuru:   () => Promise<void>   // flag for human guru review
  audioLevel:      number                // 0–100, live amplitude meter
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRecitation(opts: UseRecitationOptions): UseRecitationReturn {
  const { shruti, userId, chunk, language, enrollmentId, onScored, onError } = opts

  const [state, setState] = useState<RecitationState>({
    status:      'idle',
    durationMs:  0,
    audioBlob:   null,
    audioUrl:    null,
    result:      null,
    error:       null,
    recordingId: null,
  })

  const [audioLevel, setAudioLevel] = useState(0)

  // Refs — survive re-renders without causing them
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const streamRef         = useRef<MediaStream | null>(null)
  const chunksRef         = useRef<BlobPart[]>([])
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef      = useRef<number>(0)
  const analyserRef       = useRef<AnalyserNode | null>(null)
  const animFrameRef      = useRef<number | null>(null)
  const audioCtxRef       = useRef<AudioContext | null>(null)

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      _stopTimer()
      _stopAmplitude()
      _releaseStream()
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _setStatus(status: RecorderStatus, extras: Partial<RecitationState> = {}) {
    setState(prev => ({ ...prev, status, ...extras }))
  }

  function _setError(msg: string) {
    _setStatus('error', { error: msg })
    onError?.(msg)
  }

  function _stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function _startTimer() {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, durationMs: Date.now() - startTimeRef.current }))
    }, 100)
  }

  function _releaseStream() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function _stopAmplitude() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
    setAudioLevel(0)
  }

  function _startAmplitude(stream: MediaStream) {
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
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)))
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } catch {
      // AudioContext not critical — amplitude meter just won't work
    }
  }

  /** Pick the best supported MIME type for the current browser */
  function _bestMime(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) ?? ''
  }

  // ── start() ───────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (state.status === 'recording') return

    _setStatus('requesting_mic', { error: null, result: null, audioBlob: null, audioUrl: null, durationMs: 0, recordingId: null })

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch (err) {
      _setError(
        (err as Error).name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone in browser settings.'
          : `Could not access microphone: ${(err as Error).message}`
      )
      return
    }

    streamRef.current = stream
    chunksRef.current = []

    const mime = _bestMime()
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      _stopTimer()
      _stopAmplitude()
      _releaseStream()

      const blob    = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      const audioUrl = URL.createObjectURL(blob)

      setState(prev => ({ ...prev, status: 'processing', audioBlob: blob, audioUrl, durationMs: Date.now() - startTimeRef.current }))

      // Upload + score
      try {
        const result = await shruti.uploadAndScore(userId, {
          audioBlob:    blob,
          chunkId:      chunk.id,
          language,
          expectedText: chunk.sanskrit ?? chunk.id,
          enrollmentId,
        })

        setState(prev => ({ ...prev, status: 'scored', result }))
        onScored?.(result)
      } catch (err) {
        _setError(`Scoring failed: ${(err as Error).message}`)
      }
    }

    recorder.onerror = () => {
      _setError('Recording error — please try again.')
      _stopTimer()
      _stopAmplitude()
      _releaseStream()
    }

    recorder.start(250) // collect data every 250ms
    _startTimer()
    _startAmplitude(stream)
    _setStatus('recording')

  }, [state.status, shruti, userId, chunk, language, enrollmentId, onScored])  // eslint-disable-line

  // ── stop() ────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // ── reset() ───────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    stop()
    _stopTimer()
    _stopAmplitude()
    _releaseStream()
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl)
    setState({
      status:      'idle',
      durationMs:  0,
      audioBlob:   null,
      audioUrl:    null,
      result:      null,
      error:       null,
      recordingId: null,
    })
    setAudioLevel(0)
  }, [stop, state.audioUrl]) // eslint-disable-line

  // ── submitForGuru() ───────────────────────────────────────────────────────

  const submitForGuru = useCallback(async () => {
    if (!state.recordingId) {
      _setError('No recording to submit for guru review.')
      return
    }
    try {
      await shruti.submitForGuruReview(state.recordingId)
    } catch (err) {
      _setError(`Guru submit failed: ${(err as Error).message}`)
    }
  }, [state.recordingId, shruti])  // eslint-disable-line

  return { ...state, start, stop, reset, submitForGuru, audioLevel }
}
