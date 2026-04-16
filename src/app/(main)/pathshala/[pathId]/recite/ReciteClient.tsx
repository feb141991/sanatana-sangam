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
  CheckCircle2, Volume2, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GITA_FULL_DATA } from '@/lib/gita-full-data';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';
import { SEED_PATHS } from '@/app/(main)/pathshala/PathshalaClient';
import { usePathshala } from '@/contexts/EngineContext';
import type { LibraryEntry } from '@/lib/library-content';
import type { RecitationResult } from '@sangam/pathshala-engine';

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

// ─── TTS helper — uses browser SpeechSynthesis ────────────────────────────────
function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.75;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

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
type RecordState = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

export default function ReciteClient({
  userId,
  pathId,
  tradition: _tradition,
  accentColour,
  currentLesson,
}: Props) {
  const router    = useRouter();
  const pathshala = usePathshala();
  const path      = SEED_PATHS.find(p => p.id === pathId);
  const verses    = useMemo(() => getReciteVerses(pathId, currentLesson), [pathId, currentLesson]);

  const [verseIndex,   setVerseIndex]   = useState(0);
  const [mode,         setMode]         = useState<ReciteMode>('read');
  const [showTranslit, setShowTranslit] = useState(true);
  const [showMeaning,  setShowMeaning]  = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completed,    setCompleted]    = useState<number[]>([]);

  // Shruti recording state
  const [recordState,  setRecordState]  = useState<RecordState>('idle');
  const [lastResult,   setLastResult]   = useState<RecitationResult | null>(null);
  const [micGranted,   setMicGranted]   = useState<boolean | null>(null); // null=unknown

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const verse = verses[verseIndex];

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // Reset score on verse change
  useEffect(() => {
    setLastResult(null);
    setRecordState('idle');
    chunksRef.current = [];
  }, [verseIndex]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function markVerseComplete() {
    if (!completed.includes(verseIndex)) {
      setCompleted(c => [...c, verseIndex]);
      toast.success('Verse marked ✓', { duration: 1500 });
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
      mr.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          toast.error('Recording too short — please recite the verse aloud');
          setRecordState('idle');
          return;
        }

        setRecordState('uploading');

        try {
          if (!pathshala) {
            toast.error('Engine not ready — please try again');
            setRecordState('error');
            return;
          }

          const chunkId      = `${pathId}--verse-${verseIndex}`;
          const expectedText = verse.original || verse.transliteration || verse.title;
          const language     = 'sa'; // Sanskrit — default; could be inferred from tradition

          const result = await pathshala.shruti.uploadAndScore(userId, {
            audioBlob: blob,
            chunkId,
            expectedText,
            language,
          });

          setLastResult(result);
          setRecordState('done');
          const score = result.scores?.overall ?? 0;
          const emoji = score >= 80 ? '🌟' : score >= 60 ? '👍' : '💪';
          toast.success(`${emoji} Shruti score: ${Math.round(score)}/100`, { duration: 3500 });
        } catch (err: any) {
          console.error('[Shruti] uploadAndScore error:', err);
          toast.error(err?.message?.slice(0, 80) ?? 'Scoring failed — please try again');
          setRecordState('error');
        }
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
  }, [verse, pathId, verseIndex, userId, pathshala]);

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

  const progressPct = verses.length > 0 ? Math.round((completed.length / verses.length) * 100) : 0;
  const isRecording  = recordState === 'recording';
  const isUploading  = recordState === 'uploading';
  const shrutiReady  = !!pathshala;

  return (
    <div className="min-h-screen pb-28 flex flex-col">

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
        <div className="mt-2 h-1 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: accentColour }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Mode selector */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-1.5">
          {([
            { id: 'read'   as ReciteMode, label: 'Read-Along', icon: BookOpen },
            { id: 'hidden' as ReciteMode, label: 'From Memory', icon: EyeOff  },
            { id: 'timed'  as ReciteMode, label: 'Timed',       icon: Timer   },
          ] as { id: ReciteMode; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: mode === id ? accentColour : 'rgba(255,255,255,0.06)',
                color: mode === id ? '#1c1c1a' : 'var(--brand-muted)',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
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
            {/* Source */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider">{verse.source}</p>
                <p className="text-sm font-bold text-[color:var(--brand-ink)] mt-0.5">{verse.title}</p>
              </div>
              <button
                onClick={() => speakText(verse.transliteration || verse.original)}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center transition-all hover:border-white/20"
                style={{ color: accentColour, background: `${accentColour}10` }}
                title="Listen (browser TTS)"
              >
                <Volume2 size={15} />
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
          </motion.div>
        </AnimatePresence>

        {/* ── Shruti Voice Scoring ─────────────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl border border-white/8 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[color:var(--brand-ink)]">🎤 Voice Recitation</p>
              <p className="text-[10px] text-[color:var(--brand-muted)] mt-0.5">
                {shrutiReady
                  ? 'Record your recitation — Shruti Engine scores pronunciation'
                  : 'Shruti engine loading…'}
              </p>
            </div>
            {/* Mic button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading || !shrutiReady}
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
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-red-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              <span className="text-xs text-red-300 font-medium">Recording… tap 🛑 to stop</span>
            </motion.div>
          )}

          {isUploading && (
            <p className="text-xs text-[color:var(--brand-muted)]">Uploading and scoring…</p>
          )}

          {micGranted === false && (
            <p className="text-xs text-orange-300">
              Mic access denied. Allow microphone in your browser settings and reload.
            </p>
          )}

          {recordState === 'error' && (
            <p className="text-xs text-red-300">Scoring failed. Check your internet connection and try again.</p>
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
