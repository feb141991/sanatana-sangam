'use client';

// ─── Pathshala Recite Mode ────────────────────────────────────────────────────
// Focused scripture recitation practice.
// Free: read-along mode with large text, auto-scroll, timing.
// Shruti: mic recording → Shruti Engine AI voice scoring (no gate — available to all).

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Mic, MicOff, Play, Pause,
  Eye, EyeOff, Timer, Sparkles, BookOpen,
  CheckCircle2, Volume2, VolumeX, Loader2, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GITA_FULL_DATA } from '@/lib/gita-full-data';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';
import { SEED_PATHS } from '@/app/(main)/pathshala/PathshalaClient';
import { usePathshala, useSadhana } from '@/contexts/EngineContext';
import { usePremium } from '@/hooks/usePremium';
import type { LibraryEntry } from '@/lib/library-content';
import type { RecitationResult } from '@sangam/pathshala-engine';
import CircularProgress from '@/components/ui/CircularProgress';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';

// ─── Pick recite content for a path ────────────────────────────────────────────
function getReciteVerses(pathId: string, lessonIndex: number): LibraryEntry[] {
  const ENTRIES_PER_LESSON = 4;
  let pool: LibraryEntry[] = [];

  switch (pathId) {
    case 'bhagavad-gita-intro': {
      const ch = lessonIndex + 1;
      pool = GITA_FULL_DATA.filter(e => (e.tags as readonly string[]).includes(`chapter-${ch}`)).slice(0, 8) as unknown as LibraryEntry[];
      break;
    }
    case 'stotra-path':
      pool = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'stotra');
      break;
    case 'nitnem-daily':
      pool = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'gurbani' || e.category === 'nitnem');
      break;
    case 'dhammapada-path':
      pool = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'dhammapada');
      break;
    case 'yoga-sutras':
      pool = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'yoga_sutra');
      break;
    case 'upanishads-core':
      pool = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'upanishad');
      break;
    default:
      pool = GITA_FULL_DATA.slice(0, 40) as unknown as LibraryEntry[];
  }

  const start = lessonIndex * ENTRIES_PER_LESSON;
  const slice = pool.slice(start, start + ENTRIES_PER_LESSON);
  return slice.length > 0 ? slice : pool.slice(0, ENTRIES_PER_LESSON);
}

// ─── TTS is now stateful — managed inside ReciteClient via speakCurrent/stopTTS ─

// ─── Score ring colour ────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

// ─── ScorePanel ───────────────────────────────────────────────────────────────
function ScorePanel({ result, accent, onDismiss }: {
  result: RecitationResult;
  accent: string;
  onDismiss: () => void;
}) {
  const score  = result.scores?.overall ?? 0;
  const color  = scoreColor(score);
  const label  = score >= 80 ? '🌟 Excellent' : score >= 60 ? '👍 Good' : '💪 Keep Practising';

  const subScores = result.scores
    ? Object.entries(result.scores).filter(([k, v]) => k !== 'overall' && v !== null) as [string, number][]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      className="glass-panel rounded-2xl border border-white/10 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[color:var(--brand-ink)]">Shruti Feedback</p>
        <button onClick={onDismiss} className="text-xs text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition">Dismiss</button>
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="28" cy="28" r="22"
              fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - score / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[color:var(--brand-ink)]">{label}</p>
          {result.feedback && (
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-snug line-clamp-3">{result.feedback}</p>
          )}
        </div>
      </div>

      {/* Sub-scores */}
      {subScores.slice(0, 3).map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--brand-muted)] w-16 flex-shrink-0 capitalize">{key}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${val}%`, background: scoreColor(val) }}
            />
          </div>
          <span className="text-[10px] font-medium text-[color:var(--brand-muted)] w-6 text-right">{Math.round(val)}</span>
        </div>
      ))}

      {/* Corrections */}
      {result.corrections && result.corrections.length > 0 && (
        <div className="space-y-1 pt-1">
          {result.corrections.slice(0, 3).map((c, i) => (
            <div key={i} className="text-[11px] text-[color:var(--brand-muted)] leading-snug">
              <span className="text-orange-300 font-medium">{c.word}</span>
              {c.said ? <> — said &ldquo;{c.said}&rdquo;</> : null}
              {c.rule ? <span className="opacity-60"> · {c.rule}</span> : null}
            </div>
          ))}
        </div>
      )}

      {/* Transcript (collapsed by default) */}
      {result.transcript && (
        <p className="text-[10px] text-[color:var(--brand-muted)]/50 leading-relaxed border-t border-white/6 pt-2 italic line-clamp-2">
          Heard: {result.transcript}
        </p>
      )}
    </motion.div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  pathId: string;
  tradition: string;
  accentColour: string;
  currentLesson: number;
}

// ─── Mode types ────────────────────────────────────────────────────────────────
type ReciteMode = 'read' | 'hidden' | 'timed';
type RecordState = 'idle' | 'recording' | 'preview' | 'uploading' | 'done' | 'error';

export default function ReciteClient({
  userId,
  pathId,
  tradition: _tradition,
  accentColour,
  currentLesson,
}: Props) {
  const router    = useRouter();
  const pathshala = usePathshala();
  const engine    = useSadhana();
  const isPro     = usePremium();
  const path      = SEED_PATHS.find(p => p.id === pathId);
  const verses    = useMemo(() => getReciteVerses(pathId, currentLesson), [pathId, currentLesson]);

  const [verseIndex,   setVerseIndex]   = useState(0);
  const [mode,         setMode]         = useState<ReciteMode>('read');
  const [showTranslit, setShowTranslit] = useState(true);
  const [showMeaning,  setShowMeaning]  = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completed,    setCompleted]    = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // TTS state
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [ttsLoading,  setTtsLoading]  = useState(false);
  const [ttsRate,     setTtsRate]     = useState<0.5 | 0.75 | 1 | 1.25>(0.75);
  const [autoPlay,    setAutoPlay]    = useState(false);
  const ttsRateRef    = useRef<number>(0.75);
  const autoPlayRef   = useRef(false);
  const audioRef      = useRef<HTMLAudioElement | null>(null);

  // ExplainEngine state
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult,  setExplainResult]  = useState<{
    explanation: { word_by_word: string; meaning: string; commentary: string; daily_application: string; contemplation: string; related_text: string };
    tradition: string;
    teacher: string;
  } | null>(null);

  async function explainVerse() {
    if (!verse || explainLoading) return;
    setExplainResult(null);
    setExplainLoading(true);
    try {
      const res = await fetch('/api/pathshala/explain', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sanskrit:       verse.original,
          transliteration: verse.transliteration,
          translation:    verse.meaning,
          source:         verse.source,
          title:          verse.title,
          tradition:      _tradition,
          language:       'en',
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error ?? `Explain failed (${res.status})`);
      }
      const data = await res.json();
      setExplainResult(data);
    } catch (err: any) {
      const msg = err?.message ?? 'Could not generate explanation';
      toast.error(msg.includes('503') ? 'Explain unavailable — GEMINI_API_KEY not set in Vercel' : msg);
    } finally {
      setExplainLoading(false);
    }
  }

  // Shruti recording state
  const [recordState,      setRecordState]      = useState<RecordState>('idle');
  const [lastResult,       setLastResult]        = useState<RecitationResult | null>(null);
  const [micGranted,       setMicGranted]        = useState<boolean | null>(null);
  const [recordingBlob,    setRecordingBlob]     = useState<Blob | null>(null);
  const [recordingMime,    setRecordingMime]     = useState<string>('audio/webm');
  const [previewPlaying,   setPreviewPlaying]    = useState(false);
  // If engine hasn't loaded within ENGINE_TIMEOUT_MS we allow recording but skip AI scoring
  const [engineTimedOut, setEngineTimedOut] = useState(false);
  const ENGINE_TIMEOUT_MS = 5000;

  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const verse = verses[verseIndex];

  // Engine timeout — if pathshala isn't ready after ENGINE_TIMEOUT_MS, unlock mic anyway
  useEffect(() => {
    if (pathshala) { setEngineTimedOut(false); return; }
    const t = setTimeout(() => setEngineTimedOut(true), ENGINE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [pathshala]);

  // Keep refs in sync with state; also apply speed change to currently-playing audio
  useEffect(() => {
    ttsRateRef.current = ttsRate;
    if (audioRef.current) audioRef.current.playbackRate = ttsRate;
  }, [ttsRate]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  // ── TTS controller (Google Cloud TTS — sa-IN for Devanagari) ─────────────────
  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsSpeaking(false);
    setTtsLoading(false);
  }, []);

  const speakCurrent = useCallback(async (textOverride?: string) => {
    const text = (textOverride || '').trim();
    if (!text) return;
    stopTTS();
    setTtsLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, rate: ttsRateRef.current }),
      });
      if (!res.ok) throw new Error('TTS fetch failed');
      const { audioContent } = await res.json() as { audioContent: string };
      // Decode base64 MP3 and play
      const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
      const blob  = new Blob([bytes], { type: 'audio/mpeg' });
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
      setIsSpeaking(true);
    } catch {
      setIsSpeaking(false);
    } finally {
      setTtsLoading(false);
    }
    // Fire-and-forget engine listen tracking
    if (engine) {
      engine.tracker.track('shloka_listen', { path_id: pathId, lesson: currentLesson, verse_index: verseIndex }).catch(() => {});
    }
  }, [stopTTS, engine, pathId, currentLesson, verseIndex]);

  // Stop TTS on unmount
  useEffect(() => () => { stopTTS(); }, [stopTTS]);

  // ── Preview: play back the just-recorded audio before submitting ──────────
  const playPreview = useCallback(() => {
    if (!recordingBlob) return;
    if (previewAudioRef.current) { previewAudioRef.current.pause(); }
    const url   = URL.createObjectURL(recordingBlob);
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.onended = () => { setPreviewPlaying(false); URL.revokeObjectURL(url); };
    audio.onerror = () => { setPreviewPlaying(false); URL.revokeObjectURL(url); };
    audio.play().then(() => setPreviewPlaying(true)).catch(() => setPreviewPlaying(false));
  }, [recordingBlob]);

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null; }
    setPreviewPlaying(false);
  }, []);

  const resetRecording = useCallback(() => {
    stopPreview();
    setRecordingBlob(null);
    setRecordState('idle');
    setLastResult(null);
  }, [stopPreview]);

  // ── Submit recording for AI scoring ──────────────────────────────────────
  const submitRecording = useCallback(async () => {
    if (!recordingBlob || !verse) return;
    stopPreview();
    setRecordState('uploading');
    try {
      if (!pathshala) {
        toast('Practice recorded ✓ (Shruti scoring offline — engine loading)', {
          icon: '🎤', duration: 3500,
          style: { background: '#1c1c1a', color: 'var(--brand-ink)' },
        });
        setRecordState('idle');
        setRecordingBlob(null);
        return;
      }
      const chunkId      = `${pathId}--verse-${verseIndex}`;
      const expectedText = verse.original || verse.transliteration || verse.title;
      const result = await pathshala.shruti.uploadAndScore(userId, {
        audioBlob: recordingBlob,
        chunkId,
        expectedText,
        language: 'sa',
      });
      setLastResult(result);
      setRecordState('done');
      setRecordingBlob(null);
      const score = result.scores?.overall ?? 0;
      const emoji = score >= 80 ? '🌟' : score >= 60 ? '👍' : '💪';
      toast.success(`${emoji} Shruti score: ${Math.round(score)}/100`, { duration: 3500 });
      if (engine) {
        engine.tracker.track('shloka_listen', { path_id: pathId, lesson: currentLesson, verse_index: verseIndex }).catch(() => {});
      }
    } catch (err: any) {
      console.error('[Shruti] submitRecording error:', err);
      toast.error(err?.message?.slice(0, 80) ?? 'Scoring failed — please try again');
      setRecordState('error');
    }
  }, [recordingBlob, verse, stopPreview, pathshala, pathId, verseIndex, userId, engine, currentLesson]);

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // Reset score + stop TTS on verse change; optionally auto-play new verse
  useEffect(() => {
    setLastResult(null);
    setRecordState('idle');
    chunksRef.current = [];
    // Stop any ongoing speech
    stopTTS();
    // Auto-play the incoming verse after a brief settle delay
    // Prefer original Devanagari for sa-IN voice; fall back to transliteration
    if (autoPlayRef.current && verse) {
      const text = verse.original || verse.transliteration || '';
      const t = setTimeout(() => { speakCurrent(text); }, 400);
      return () => clearTimeout(t);
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseIndex]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function markVerseComplete() {
    if (!completed.includes(verseIndex)) {
      setCompleted(c => [...c, verseIndex]);
      setShowConfetti(true);
      toast.success('Verse marked ✓', { duration: 1500 });
      // Fire-and-forget engine tracking
      if (engine) {
        engine.tracker.trackShlokaRead(pathId, currentLesson, verseIndex, timerSeconds).catch(() => {});
        engine.streaks.markDone(userId, 'shloka').catch(() => {});
      }
    }
    if (verseIndex < verses.length - 1) {
      setVerseIndex(v => v + 1);
      setTimerSeconds(0);
      setTimerRunning(false);
    }
  }

  // ── Shruti recording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!verse) return;
    setLastResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        // Stop all mic tracks
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          toast.error('Recording too short — please recite the verse aloud');
          setRecordState('idle');
          return;
        }
        // Go to preview — user listens back before submitting for scoring
        setRecordingBlob(blob);
        setRecordingMime(mimeType);
        setRecordState('preview');
      };

      mr.start(500); // collect chunks every 500ms
      mediaRecRef.current = mr;
      setRecordState('recording');
    } catch (err: any) {
      setMicGranted(false);
      if (err?.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow mic in browser settings.');
      } else {
        toast.error('Could not access microphone: ' + (err?.message ?? 'Unknown error'));
      }
      setRecordState('idle');
    }
  }, [verse]);

  const stopRecording = useCallback(() => {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  if (!verse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <BookOpen size={40} className="text-[color:var(--brand-muted)]" />
        <p className="text-[color:var(--brand-ink)] font-semibold">No recitation content found</p>
        <Link href="/pathshala" style={{ color: accentColour }} className="text-sm underline">
          Back to Pathshala
        </Link>
      </div>
    );
  }

  const progressPct  = verses.length > 0 ? Math.round((completed.length / verses.length) * 100) : 0;
  const isRecording  = recordState === 'recording';
  const isUploading  = recordState === 'uploading';
  const shrutiReady  = !!pathshala;
  // Mic is usable when engine is ready, OR after ENGINE_TIMEOUT_MS grace period (offline fallback)
  const micEnabled   = shrutiReady || engineTimedOut;

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <div className="sticky top-0 z-30 glass-panel border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/pathshala/${pathId}/lesson`)}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center"
            style={{ background: `${accentColour}14` }}
          >
            <ChevronLeft size={18} style={{ color: accentColour }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[color:var(--brand-muted)] truncate">{path?.title ?? pathId}</p>
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
              Recite · Verse {verseIndex + 1} of {verses.length}
            </p>
          </div>

          {/* Timer */}
          <button
            onClick={() => setTimerRunning(r => !r)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 tabular-nums"
            style={{
              background: timerRunning ? `${accentColour}18` : 'rgba(255,255,255,0.05)',
              color: timerRunning ? accentColour : 'var(--brand-muted)',
              borderColor: timerRunning ? `${accentColour}30` : 'rgba(255,255,255,0.1)',
            }}
          >
            <Timer size={12} />
            {formatTime(timerSeconds)}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-2 flex items-center gap-2.5">
          <CircularProgress
            pct={progressPct}
            accent={accentColour}
            size={36}
            strokeWidth={3}
            label={<span className="text-[8px] font-bold" style={{ color: accentColour }}>{progressPct}%</span>}
          />
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{completed.length}/{verses.length} verses</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1.5">
          {([
            { id: 'read'   as ReciteMode, label: 'Read-Along', icon: BookOpen, pro: false },
            { id: 'hidden' as ReciteMode, label: 'From Memory', icon: EyeOff,  pro: true  },
            { id: 'timed'  as ReciteMode, label: 'Timed',       icon: Timer,   pro: true  },
          ] as { id: ReciteMode; label: string; icon: any; pro: boolean }[]).map(({ id, label, icon: Icon, pro }) => {
            const locked = pro && !isPro;
            return (
              <button
                key={id}
                onClick={() => {
                  if (locked) {
                    toast('🔒 Upgrade to Sangam Pro to unlock', {
                      style: { background: '#1c1c1a', color: 'var(--brand-ink)' },
                    });
                    return;
                  }
                  setMode(id);
                }}
                className="flex-1 relative flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all overflow-hidden"
                style={{
                  background: mode === id ? accentColour : 'rgba(255,255,255,0.06)',
                  color: mode === id ? '#1c1c1a' : locked ? 'rgba(255,255,255,0.3)' : 'var(--brand-muted)',
                  opacity: locked ? 0.65 : 1,
                }}
              >
                <Icon size={12} />
                {label}
                {locked && (
                  <Lock size={9} className="absolute top-1 right-1.5 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main verse card */}
      <div className="flex-1 px-4 py-2 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${verseIndex}-${mode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-3xl border border-white/8 p-5 space-y-4"
          >
            {/* Source + TTS controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider">{verse.source}</p>
                <p className="text-sm font-bold text-[color:var(--brand-ink)] mt-0.5">{verse.title}</p>
              </div>

              {/* Waveform animation while speaking */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-end gap-[3px] h-5 flex-shrink-0"
                  >
                    {[0, 0.12, 0.24, 0.12, 0].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full"
                        style={{ background: accentColour }}
                        animate={{ scaleY: [0.25, 1, 0.25] }}
                        transition={{ duration: 0.65, repeat: Infinity, delay, ease: 'easeInOut' }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Play / Stop TTS button */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopTTS();
                  } else {
                    // Prefer Devanagari original for sa-IN voice accuracy
                    speakCurrent(verse.original || verse.transliteration || '');
                  }
                }}
                disabled={ttsLoading}
                className="w-9 h-9 rounded-full border flex items-center justify-center transition-all flex-shrink-0"
                style={{
                  color: accentColour,
                  background: isSpeaking ? `${accentColour}25` : `${accentColour}10`,
                  borderColor: isSpeaking ? `${accentColour}50` : 'rgba(255,255,255,0.10)',
                }}
                title={isSpeaking ? 'Stop reading' : 'Listen — Sanskrit voice'}
              >
                {ttsLoading
                  ? <Loader2 size={15} className="animate-spin" />
                  : isSpeaking
                    ? <VolumeX size={15} />
                    : <Volume2 size={15} />
                }
              </button>
            </div>

            {/* Speed selector + auto-play toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[color:var(--brand-muted)] uppercase tracking-wider font-medium">Speed</span>
                {([0.5, 0.75, 1, 1.25] as const).map(rate => (
                  <button
                    key={rate}
                    onClick={() => setTtsRate(rate)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
                    style={{
                      background: ttsRate === rate ? accentColour : 'rgba(255,255,255,0.08)',
                      color: ttsRate === rate ? '#1c1c1a' : 'var(--brand-muted)',
                    }}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
              <button
                onClick={() => setAutoPlay(a => !a)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ml-auto"
                style={{
                  background: autoPlay ? `${accentColour}20` : 'rgba(255,255,255,0.06)',
                  color: autoPlay ? accentColour : 'var(--brand-muted)',
                  border: autoPlay ? `1px solid ${accentColour}40` : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Play size={9} /> Auto
              </button>
            </div>

            {/* Original script — hidden in 'from memory' mode */}
            {mode !== 'hidden' && (
              <div
                className="text-center py-2 text-xl leading-loose font-medium"
                style={{ color: accentColour, fontFamily: 'var(--font-deva, serif)' }}
              >
                {verse.original}
              </div>
            )}

            {/* Placeholder for hidden mode */}
            {mode === 'hidden' && (
              <div className="text-center py-8 border border-dashed rounded-2xl"
                style={{ borderColor: `${accentColour}30` }}>
                <EyeOff size={28} className="mx-auto mb-2" style={{ color: accentColour }} />
                <p className="text-sm font-semibold text-[color:var(--brand-ink)]">Recite from memory</p>
                <p className="text-xs text-[color:var(--brand-muted)] mt-1">Tap &ldquo;Reveal&rdquo; to check yourself</p>
                <button
                  onClick={() => setMode('read')}
                  className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: `${accentColour}18`, color: accentColour }}
                >
                  Reveal
                </button>
              </div>
            )}

            {/* Transliteration toggle */}
            {mode !== 'hidden' && (
              <div>
                <button
                  onClick={() => setShowTranslit(s => !s)}
                  className="flex items-center gap-1.5 text-xs text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition mb-2"
                >
                  {showTranslit ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showTranslit ? 'Hide' : 'Show'} transliteration
                </button>
                <AnimatePresence>
                  {showTranslit && verse.transliteration && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-sm italic text-[color:var(--brand-muted)] leading-relaxed overflow-hidden"
                    >
                      {verse.transliteration}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Meaning toggle */}
            <div>
              <button
                onClick={() => setShowMeaning(s => !s)}
                className="flex items-center gap-1.5 text-xs text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)] transition mb-2"
              >
                {showMeaning ? <EyeOff size={12} /> : <Eye size={12} />}
                {showMeaning ? 'Hide' : 'Show'} meaning
              </button>
              <AnimatePresence>
                {showMeaning && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="text-sm text-[color:var(--brand-ink)] leading-relaxed overflow-hidden"
                  >
                    {verse.meaning}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ── Explain button ───────────────────────────────────────────────── */}
            <div className="pt-1 border-t border-white/6">
              <button
                onClick={explainVerse}
                disabled={explainLoading}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all w-full justify-center"
                style={{
                  background: explainResult ? `${accentColour}18` : 'rgba(255,255,255,0.06)',
                  color: explainLoading ? 'var(--brand-muted)' : accentColour,
                  border: `1px solid ${explainResult ? accentColour + '40' : 'rgba(255,255,255,0.10)'}`,
                }}
              >
                {explainLoading
                  ? <><Loader2 size={12} className="animate-spin" /> Asking teacher…</>
                  : <><Sparkles size={12} /> {explainResult ? 'Refresh explanation' : 'Explain this verse'}</>
                }
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── ExplainEngine result panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {explainResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-3xl border border-white/8 p-5 space-y-4"
              style={{ background: `linear-gradient(135deg, ${accentColour}08, rgba(255,255,255,0.02))` }}
            >
              {/* Teacher tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪔</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColour + 'aa' }}>
                      {explainResult.tradition}
                    </p>
                    <p className="text-xs font-semibold text-[color:var(--brand-muted)]">
                      In the spirit of {explainResult.teacher}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExplainResult(null)}
                  className="text-xs text-[color:var(--brand-muted)] hover:text-[color:var(--brand-ink)]"
                >
                  ✕
                </button>
              </div>

              {/* Word by word */}
              {explainResult.explanation.word_by_word && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColour + '88' }}>
                    Word by Word
                  </p>
                  <p className="text-xs text-[color:var(--brand-muted)] leading-relaxed italic">
                    {explainResult.explanation.word_by_word}
                  </p>
                </div>
              )}

              {/* Meaning */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColour + '88' }}>
                  Meaning
                </p>
                <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed">
                  {explainResult.explanation.meaning}
                </p>
              </div>

              {/* Commentary */}
              {explainResult.explanation.commentary && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColour + '88' }}>
                    Commentary
                  </p>
                  <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed">
                    {explainResult.explanation.commentary}
                  </p>
                </div>
              )}

              {/* Daily application */}
              {explainResult.explanation.daily_application && (
                <div className="rounded-2xl px-4 py-3" style={{ background: `${accentColour}10`, border: `1px solid ${accentColour}25` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentColour }}>
                    Today&apos;s Practice
                  </p>
                  <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed">
                    {explainResult.explanation.daily_application}
                  </p>
                </div>
              )}

              {/* Contemplation */}
              {explainResult.explanation.contemplation && (
                <p className="text-sm text-center italic text-[color:var(--brand-muted)] border-t border-white/6 pt-3 leading-relaxed">
                  &ldquo;{explainResult.explanation.contemplation}&rdquo;
                </p>
              )}

              {/* Related text */}
              {explainResult.explanation.related_text && (
                <p className="text-[10px] text-[color:var(--brand-muted)] text-right">
                  Also explore: {explainResult.explanation.related_text}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Shruti Voice Scoring ─────────────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl border border-white/8 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[color:var(--brand-ink)]">🎤 Voice Recitation</p>
              <p className="text-[10px] text-[color:var(--brand-muted)] mt-0.5">
                {recordState === 'preview'
                  ? 'Listen back, then submit for scoring'
                  : shrutiReady
                    ? 'Record your recitation — Shruti Engine scores pronunciation'
                    : engineTimedOut
                      ? 'AI scoring offline — recording still available'
                      : 'Shruti engine loading…'}
              </p>
            </div>
            {/* Mic / stop button — hidden in preview state */}
            {recordState !== 'preview' && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isUploading || !micEnabled}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-40"
                style={{
                  background: isRecording
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : `linear-gradient(135deg, ${accentColour}, ${accentColour}cc)`,
                  boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.25)' : 'none',
                }}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isUploading
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : isRecording
                    ? <MicOff size={18} className="text-white" />
                    : <Mic size={18} className="text-white" />
                }
              </button>
            )}
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-red-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              <span className="text-xs text-red-300 font-medium">Recording… tap ⏹ to stop</span>
            </motion.div>
          )}

          {/* ── Preview panel ─────────────────────────────────────────────────── */}
          {recordState === 'preview' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {/* Listen back row */}
              <div className="flex items-center gap-3 py-1">
                <button
                  onClick={previewPlaying ? stopPreview : playPreview}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accentColour}20`, border: `1px solid ${accentColour}40` }}
                >
                  {previewPlaying
                    ? <Pause size={16} style={{ color: accentColour }} />
                    : <Play  size={16} style={{ color: accentColour }} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[color:var(--brand-ink)]">Your recording</p>
                  <p className="text-[10px] text-[color:var(--brand-muted)]">
                    {previewPlaying ? 'Playing…' : 'Tap to listen back'}
                  </p>
                </div>
                {/* Re-record */}
                <button
                  onClick={resetRecording}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--brand-muted)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  Re-record
                </button>
              </div>
              {/* Submit button */}
              <button
                onClick={submitRecording}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${accentColour}, ${accentColour}cc)`, color: '#1c1c1a' }}
              >
                <CheckCircle2 size={13} />
                Submit for Shruti scoring
              </button>
            </motion.div>
          )}

          {isUploading && (
            <div className="flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-[color:var(--brand-muted)]" />
              <p className="text-xs text-[color:var(--brand-muted)]">Uploading and scoring…</p>
            </div>
          )}

          {micGranted === false && (
            <p className="text-xs text-orange-300">
              Mic access denied. Allow microphone in your browser settings and reload.
            </p>
          )}

          {recordState === 'error' && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-red-300 flex-1">Scoring failed. Check your connection.</p>
              <button onClick={resetRecording} className="text-[10px] text-[color:var(--brand-muted)] underline">Retry</button>
            </div>
          )}
        </div>

        {/* Score panel */}
        <AnimatePresence>
          {lastResult && (
            <ScorePanel
              result={lastResult}
              accent={accentColour}
              onDismiss={() => setLastResult(null)}
            />
          )}
        </AnimatePresence>

        {/* Verse navigation + complete */}
        <div className="flex gap-3">
          <button
            onClick={() => { setVerseIndex(v => Math.max(0, v - 1)); setTimerSeconds(0); setTimerRunning(false); }}
            disabled={verseIndex === 0}
            className="w-12 flex items-center justify-center py-3 rounded-2xl border border-white/10 text-[color:var(--brand-muted)] disabled:opacity-30 transition-opacity"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={markVerseComplete}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-[#1c1c1a] transition-all"
            style={{ background: accentColour }}
          >
            {completed.includes(verseIndex)
              ? <><CheckCircle2 size={15} /> Done · Next Verse</>
              : <><CheckCircle2 size={15} /> Mark & Continue</>
            }
          </button>

          <button
            onClick={() => { setVerseIndex(v => Math.min(verses.length - 1, v + 1)); setTimerSeconds(0); setTimerRunning(false); }}
            disabled={verseIndex === verses.length - 1}
            className="w-12 flex items-center justify-center py-3 rounded-2xl border border-white/10 text-[color:var(--brand-muted)] disabled:opacity-30 transition-opacity"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Session stats */}
        {completed.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Practiced', value: completed.length },
              { label: 'Remaining', value: verses.length - completed.length },
              { label: 'Session',   value: formatTime(timerSeconds) },
            ].map(stat => (
              <div key={stat.label} className="glass-panel rounded-xl border border-white/6 py-2.5 text-center">
                <p className="text-sm font-bold text-[color:var(--brand-ink)]">{stat.value}</p>
                <p className="text-[10px] text-[color:var(--brand-muted)] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Dharma Mitra link */}
        <Link
          href="/ai-chat"
          className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/6 text-sm font-semibold transition-all glass-panel"
          style={{ color: accentColour }}
        >
          <Sparkles size={15} />
          Ask Dharma Mitra about this verse
          <ChevronRight size={14} className="ml-auto text-[color:var(--brand-muted)]" />
        </Link>
      </div>
    </div>
  );
}
