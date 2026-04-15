// ============================================================
// RecitationRecorder — Drop-in React component
// ============================================================
// Requires: React 18+, Tailwind CSS (core utilities only)
//
// Usage:
//   import { RecitationRecorder } from '@sangam/pathshala-engine/components/RecitationRecorder'
//
//   <RecitationRecorder
//     shruti={pathshalaEngine.shruti}
//     userId={currentUserId}
//     chunk={verseChunk}
//     language="sa"
//     onScored={(result) => console.log(result)}
//   />
// ============================================================

import { useCallback, useRef } from 'react'
import { useRecitation } from '../hooks/useRecitation'
import type { ShrutiEngine } from '../ai/shruti'
import type { ScriptureChunk, RecitationResult } from '../types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface RecitationRecorderProps {
  shruti:        ShrutiEngine
  userId:        string
  chunk:         ScriptureChunk
  language:      string
  enrollmentId?: string
  onScored?:     (result: RecitationResult) => void
  className?:    string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 65) return 'text-yellow-600'
  return 'text-red-500'
}

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-green-50 border-green-200'
  if (score >= 65) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

// ── Waveform bars (live amplitude visualiser) ─────────────────────────────────

function WaveformBars({ level, active }: { level: number; active: boolean }) {
  const bars = 20
  return (
    <div className="flex items-center justify-center gap-0.5 h-10">
      {Array.from({ length: bars }).map((_, i) => {
        const seed     = Math.sin(i * 2.3) * 0.5 + 0.5       // static shape
        const animated = active ? (Math.random() * (level / 100)) : 0
        const height   = active
          ? Math.max(4, Math.round((seed * 0.4 + animated * 0.6) * 36))
          : 4
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              active ? 'bg-orange-500' : 'bg-gray-300'
            }`}
            style={{ height: `${height}px` }}
          />
        )
      })}
    </div>
  )
}

// ── Score pill ────────────────────────────────────────────────────────────────

function ScorePill({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined || value === null) return null
  return (
    <div className={`flex flex-col items-center border rounded-lg px-3 py-2 ${scoreBg(value)}`}>
      <span className={`text-xl font-bold ${scoreColor(value)}`}>{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RecitationRecorder({
  shruti,
  userId,
  chunk,
  language,
  enrollmentId,
  onScored,
  className = '',
}: RecitationRecorderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const rec = useRecitation({
    shruti,
    userId,
    chunk,
    language,
    enrollmentId,
    onScored,
  })

  const handlePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.paused
        ? audioRef.current.play()
        : audioRef.current.pause()
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 ${className}`}>

      {/* Verse reference */}
      <div className="text-center">
        <p className="text-xs font-medium text-orange-500 uppercase tracking-wide">
          Recite Aloud
        </p>
        {chunk.sanskrit && (
          <p className="mt-2 text-lg font-semibold text-gray-800 leading-relaxed font-serif">
            {chunk.sanskrit}
          </p>
        )}
        {chunk.transliteration && (
          <p className="mt-1 text-sm text-gray-500 italic">{chunk.transliteration}</p>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* Waveform / status area */}
      <div className="flex flex-col items-center gap-2 min-h-16 justify-center">
        {rec.status === 'idle' || rec.status === 'ready' ? (
          <p className="text-sm text-gray-400">Tap the mic to begin</p>
        ) : rec.status === 'requesting_mic' ? (
          <p className="text-sm text-gray-400 animate-pulse">Waiting for microphone…</p>
        ) : rec.status === 'recording' ? (
          <>
            <WaveformBars level={rec.audioLevel} active={true} />
            <p className="text-sm font-mono text-orange-600 tabular-nums">
              {formatDuration(rec.durationMs)}
            </p>
          </>
        ) : rec.status === 'processing' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Analysing your recitation…</p>
          </div>
        ) : rec.status === 'scored' && rec.result ? (
          <WaveformBars level={0} active={false} />
        ) : rec.status === 'error' ? (
          <p className="text-sm text-red-500 text-center">{rec.error}</p>
        ) : null}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">

        {/* Primary mic / stop button */}
        {rec.status !== 'recording' ? (
          <button
            onClick={rec.start}
            disabled={rec.status === 'requesting_mic' || rec.status === 'processing'}
            className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all
                       flex items-center justify-center shadow-md"
            aria-label="Start recording"
          >
            {/* Mic icon */}
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21H9v2h6v-2h-2v-2.07A8 8 0 0 0 20 11h-2a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93z"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={rec.stop}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95
                       transition-all flex items-center justify-center shadow-md animate-pulse"
            aria-label="Stop recording"
          >
            {/* Stop icon */}
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        )}

        {/* Playback button — only when audio exists */}
        {rec.audioUrl && rec.status !== 'recording' && (
          <button
            onClick={handlePlayback}
            className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95
                       transition-all flex items-center justify-center"
            aria-label="Play back recording"
          >
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        )}

        {/* Reset button — when scored or errored */}
        {(rec.status === 'scored' || rec.status === 'error') && (
          <button
            onClick={rec.reset}
            className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95
                       transition-all flex items-center justify-center"
            aria-label="Try again"
            title="Try again"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

      </div>

      {/* Hidden audio element for playback */}
      {rec.audioUrl && (
        <audio ref={audioRef} src={rec.audioUrl} className="hidden" />
      )}

      {/* ── Score results ────────────────────────────────────────────────── */}
      {rec.status === 'scored' && rec.result && (
        <RecitationScoreCard result={rec.result} onRequestGuru={rec.submitForGuru} />
      )}

    </div>
  )
}

// ── Score Card (also exported standalone) ─────────────────────────────────────

interface RecitationScoreCardProps {
  result:           RecitationResult
  onRequestGuru?:   () => Promise<void>
  className?:       string
}

export function RecitationScoreCard({ result, onRequestGuru, className = '' }: RecitationScoreCardProps) {
  const { scores, feedback, corrections, transcript, word_accuracy } = result

  const overallColor = scoreColor(scores.overall)
  const overallBg    = scoreBg(scores.overall)

  const dimensionLabels: Record<string, string> = {
    uccharan: 'Pronunciation',
    sandhi:   'Sandhi',
    visarga:  'Visarga',
    laya:     'Rhythm',
    svara:    'Svara',
    fluency:  'Fluency',
  }

  const dimensionEntries = Object.entries(dimensionLabels)
    .filter(([key]) => scores[key as keyof typeof scores] !== undefined && scores[key as keyof typeof scores] !== null)

  return (
    <div className={`space-y-4 pt-2 ${className}`}>

      {/* Overall score hero */}
      <div className={`rounded-xl border p-4 text-center ${overallBg}`}>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Overall Score</p>
        <p className={`text-5xl font-bold ${overallColor}`}>{scores.overall}<span className="text-2xl text-gray-400">/100</span></p>
        {word_accuracy !== undefined && (
          <p className="text-sm text-gray-500 mt-1">
            Word accuracy: <span className="font-semibold text-gray-700">{Math.round(word_accuracy * 100)}%</span>
          </p>
        )}
      </div>

      {/* Dimension breakdown */}
      {dimensionEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {dimensionEntries.map(([key, label]) => (
            <ScorePill
              key={key}
              label={label}
              value={scores[key as keyof typeof scores] as number}
            />
          ))}
        </div>
      )}

      {/* AI feedback */}
      {feedback && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Feedback</p>
          <p className="text-sm text-amber-900 leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* What you said vs expected */}
      {transcript && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">You said</p>
          <p className="text-sm text-gray-700 italic">{transcript}</p>
        </div>
      )}

      {/* Per-word corrections */}
      {corrections && corrections.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Corrections</p>
          {corrections.map((c, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 text-sm ${
                c.severity === 'critical' ? 'border-red-200 bg-red-50' :
                c.severity === 'moderate' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold text-gray-800">{c.word}</span>
                  {c.said && (
                    <span className="text-gray-500"> · you said <em>{c.said}</em></span>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${
                  c.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  c.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {c.severity}
                </span>
              </div>
              {c.rule && (
                <p className="text-gray-600 mt-1">{c.rule}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Request guru review */}
      {onRequestGuru && (
        <button
          onClick={onRequestGuru}
          className="w-full text-center text-sm text-orange-600 hover:text-orange-700
                     border border-orange-200 hover:border-orange-300 rounded-xl py-2.5
                     transition-colors bg-orange-50 hover:bg-orange-100"
        >
          Request Guru Review
        </button>
      )}

    </div>
  )
}
