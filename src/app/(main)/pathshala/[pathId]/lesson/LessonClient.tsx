'use client';

// ─── Pathshala Lesson Viewer ──────────────────────────────────────────────────
// Displays scripture lessons grouped by chapter/section.
// Free: read + expand + mark complete.
// Pro (future): AI explanation, voice scoring, flashcards.

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Circle,
  BookOpen, Mic, Sparkles, ChevronDown, ChevronUp,
  Share2, Lock, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import { GITA_FULL_DATA } from '@/lib/gita-full-data';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';
import { SEED_PATHS } from '@/app/(main)/pathshala/PathshalaClient';
import type { LibraryEntry } from '@/lib/library-content';

// ─── Lesson content builder ────────────────────────────────────────────────────
// Groups library entries into paginated lessons (~4 entries each)
const ENTRIES_PER_LESSON = 4;

function getPathLessons(pathId: string): { title: string; entries: LibraryEntry[] }[] {
  let entries: LibraryEntry[] = [];

  switch (pathId) {
    case 'bhagavad-gita-intro': {
      // Group by chapter — one lesson per chapter
      const chapters = Array.from({ length: 18 }, (_, i) => i + 1);
      return chapters.map(ch => {
        const tag = `chapter-${ch}`;
        const chEntries = GITA_FULL_DATA.filter(e => (e.tags as readonly string[]).includes(tag));
        // Limit to first 8 verses per chapter to keep lessons digestible
        return {
          title: `Chapter ${ch}`,
          entries: chEntries.slice(0, 8) as unknown as LibraryEntry[],
        };
      }).filter(l => l.entries.length > 0);
    }

    case 'upanishads-core': {
      // Core four Upanishads: Isha, Kena, Katha, Mandukya
      const upanishads = ['isha', 'kena', 'katha', 'mandukya'];
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (const name of upanishads) {
        const uEntries = ALL_LIBRARY_ENTRIES.filter(e =>
          e.category === 'upanishad' && e.tags.some(t => t.includes(name))
        );
        // Chunk into groups
        for (let i = 0; i < uEntries.length; i += ENTRIES_PER_LESSON) {
          result.push({
            title: `${name.charAt(0).toUpperCase() + name.slice(1)} Upanishad — Part ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
            entries: uEntries.slice(i, i + ENTRIES_PER_LESSON),
          });
        }
      }
      return result.length > 0 ? result : [{ title: 'Upanishad Verses', entries: ALL_LIBRARY_ENTRIES.filter(e => e.category === 'upanishad').slice(0, ENTRIES_PER_LESSON) }];
    }

    case 'stotra-path': {
      const stotraEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'stotra');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < stotraEntries.length; i += ENTRIES_PER_LESSON) {
        result.push({
          title: `Stotra Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
          entries: stotraEntries.slice(i, i + ENTRIES_PER_LESSON),
        });
      }
      return result.length > 0 ? result : [{ title: 'Daily Stotras', entries: stotraEntries.slice(0, 4) }];
    }

    case 'yoga-sutras': {
      const yogaEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'yoga_sutra');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      // Group by chapter
      const yogaChapters = ['samadhi', 'sadhana', 'vibhuti', 'kaivalya'];
      for (const chapter of yogaChapters) {
        const cEntries = yogaEntries.filter(e => e.tags.some(t => t.includes(chapter)));
        for (let i = 0; i < cEntries.length; i += ENTRIES_PER_LESSON) {
          result.push({
            title: `${chapter.charAt(0).toUpperCase() + chapter.slice(1)} Pada — Part ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
            entries: cEntries.slice(i, i + ENTRIES_PER_LESSON),
          });
        }
      }
      return result.length > 0 ? result : [{ title: 'Yoga Sutras', entries: yogaEntries.slice(0, 4) }];
    }

    case 'nitnem-daily': {
      const gurbaniEntries = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'gurbani' || e.category === 'nitnem');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < gurbaniEntries.length; i += ENTRIES_PER_LESSON) {
        result.push({
          title: `Nitnem Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`,
          entries: gurbaniEntries.slice(i, i + ENTRIES_PER_LESSON),
        });
      }
      return result.length > 0 ? result : [{ title: 'Nitnem Banis', entries: gurbaniEntries.slice(0, 4) }];
    }

    case 'dhammapada-path': {
      const dhamma = ALL_LIBRARY_ENTRIES.filter(e => e.category === 'dhammapada');
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < dhamma.length; i += ENTRIES_PER_LESSON) {
        result.push({
          title: `Chapter ${Math.floor(i / ENTRIES_PER_LESSON) + 1} — Dhammapada`,
          entries: dhamma.slice(i, i + ENTRIES_PER_LESSON),
        });
      }
      return result.length > 0 ? result : [{ title: 'Dhammapada', entries: dhamma.slice(0, 4) }];
    }

    default: {
      // Fallback: first 30 Gita verses split into groups
      entries = GITA_FULL_DATA.slice(0, 30) as unknown as LibraryEntry[];
      const result: { title: string; entries: LibraryEntry[] }[] = [];
      for (let i = 0; i < entries.length; i += ENTRIES_PER_LESSON) {
        result.push({ title: `Session ${Math.floor(i / ENTRIES_PER_LESSON) + 1}`, entries: entries.slice(i, i + ENTRIES_PER_LESSON) });
      }
      return result;
    }
  }
}

// ─── Entry Card ────────────────────────────────────────────────────────────────
function VerseCard({
  entry,
  accentColour,
  index,
}: {
  entry: LibraryEntry;
  accentColour: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0); // first verse auto-opens

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-panel rounded-2xl overflow-hidden border border-white/8"
    >
      <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[color:var(--brand-ink)]">{entry.title}</p>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5">{entry.source}</p>
          </div>
          {expanded
            ? <ChevronUp size={15} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
            : <ChevronDown size={15} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
          }
        </div>
        <p
          className="mt-2.5 text-base leading-relaxed font-medium"
          style={{ color: accentColour, fontFamily: 'var(--font-deva, serif)' }}
        >
          {entry.original.split('\n')[0]}
          {entry.original.includes('\n') && !expanded ? '…' : ''}
        </p>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3">
              {/* Full original */}
              {entry.original.includes('\n') && (
                <div>
                  <p className="text-[10px] font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider mb-1.5">Original</p>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: accentColour, fontFamily: 'var(--font-deva, serif)' }}
                  >
                    {entry.original}
                  </p>
                </div>
              )}

              {/* Transliteration */}
              {entry.transliteration && (
                <div>
                  <p className="text-[10px] font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider mb-1.5">Transliteration</p>
                  <p className="text-sm italic text-[color:var(--brand-muted)] leading-relaxed">{entry.transliteration}</p>
                </div>
              )}

              {/* Meaning */}
              <div>
                <p className="text-[10px] font-semibold text-[color:var(--brand-muted)] uppercase tracking-wider mb-1.5">Meaning</p>
                <p className="text-sm text-[color:var(--brand-ink)] leading-relaxed">{entry.meaning}</p>
              </div>

              {/* Attribution */}
              {entry.attribution && (
                <p className="text-[10px] text-[color:var(--brand-muted)]/50 leading-relaxed pt-1">{entry.attribution}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  completedLessons: number[];
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LessonClient({
  userId,
  pathId,
  tradition: _tradition,
  accentColour,
  currentLesson: initialLesson,
  completedLessons: initialCompleted,
}: Props) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const path = SEED_PATHS.find(p => p.id === pathId);
  const lessons = useMemo(() => getPathLessons(pathId), [pathId]);
  const totalLessons = lessons.length;

  const [lessonIndex, setLessonIndex] = useState(initialLesson ?? 0);
  const [completed, setCompleted] = useState<number[]>(initialCompleted ?? []);
  const [saving, setSaving] = useState(false);

  const lesson = lessons[lessonIndex];
  const isCompleted = completed.includes(lessonIndex);
  const progressPct = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;

  async function markComplete() {
    if (isCompleted || saving) return;
    setSaving(true);
    const newCompleted = [...completed, lessonIndex];
    const nextLesson = Math.min(lessonIndex + 1, totalLessons - 1);

    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .update({
          current_lesson: nextLesson,
          completed_lessons: newCompleted,
          ...(newCompleted.length === totalLessons ? { status: 'completed', completed_at: new Date().toISOString() } : {}),
        })
        .eq('user_id', userId)
        .eq('path_id', pathId);

      if (error) throw error;

      setCompleted(newCompleted);
      toast.success(newCompleted.length === totalLessons ? 'Path completed! 🎉 Jai Ho!' : 'Lesson complete 🙏');

      if (newCompleted.length < totalLessons) {
        setLessonIndex(nextLesson);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not save progress');
    } finally {
      setSaving(false);
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= totalLessons) return;
    setLessonIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <BookOpen size={40} className="text-[color:var(--brand-muted)]" />
        <p className="text-[color:var(--brand-ink)] font-semibold">No lessons found for this path</p>
        <Link href="/pathshala" className="text-sm underline" style={{ color: accentColour }}>
          Back to Pathshala
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">

      {/* Header */}
      <div className="sticky top-0 z-30 glass-panel border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/pathshala')}
            className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center"
            style={{ background: `${accentColour}14` }}
          >
            <ChevronLeft size={18} style={{ color: accentColour }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[color:var(--brand-muted)] truncate">{path?.title ?? pathId}</p>
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">
              {lesson.title}
              <span className="text-xs font-normal text-[color:var(--brand-muted)] ml-2">
                {lessonIndex + 1} / {totalLessons}
              </span>
            </p>
          </div>
          <Link
            href={`/pathshala/${pathId}/recite`}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10"
            style={{ color: accentColour, background: `${accentColour}10` }}
          >
            <Mic size={13} /> Recite
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mt-2 max-w-2xl mx-auto">
          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: accentColour }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] text-[color:var(--brand-muted)] mt-1">{progressPct}% complete · {completed.length}/{totalLessons} lessons</p>
        </div>
      </div>

      {/* Lesson content */}
      <div className="px-4 pt-4 space-y-3">
        {lesson.entries.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={36} className="mx-auto mb-3 text-[color:var(--brand-muted)]" />
            <p className="text-sm text-[color:var(--brand-muted)]">Content for this lesson is coming soon.</p>
          </div>
        ) : (
          lesson.entries.map((entry, i) => (
            <VerseCard key={entry.id} entry={entry} accentColour={accentColour} index={i} />
          ))
        )}

        {/* AI Explanation teaser (Pro feature) */}
        <div className="glass-panel rounded-2xl border border-white/6 p-4 flex items-start gap-3">
          <Lock size={16} className="text-[color:var(--brand-muted)] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[color:var(--brand-ink)]">AI Teacher Explanation</p>
            <p className="text-xs text-[color:var(--brand-muted)] mt-0.5 leading-relaxed">
              Dharma Mitra can explain each verse in depth, connect it to your personal practice, and answer your questions — in the language of your choice.
            </p>
            <Link
              href="/ai-chat"
              className="inline-flex mt-2 items-center gap-1 text-xs font-semibold"
              style={{ color: accentColour }}
            >
              <Sparkles size={12} /> Ask Dharma Mitra about this →
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => goTo(lessonIndex - 1)}
            disabled={lessonIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-sm font-semibold text-[color:var(--brand-muted)] disabled:opacity-30 transition-opacity"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {isCompleted ? (
            <button
              onClick={() => goTo(lessonIndex + 1)}
              disabled={lessonIndex === totalLessons - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-[#1c1c1a] disabled:opacity-40 transition-opacity"
              style={{ background: accentColour }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={markComplete}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-[#1c1c1a] disabled:opacity-60 transition-all"
              style={{ background: accentColour }}
            >
              {saving
                ? <Loader2 size={15} className="animate-spin" />
                : <><CheckCircle2 size={15} /> Mark Complete</>
              }
            </button>
          )}
        </div>

        {/* Lesson index */}
        {totalLessons <= 30 && (
          <div className="pt-2">
            <p className="text-xs text-[color:var(--brand-muted)] mb-2">Jump to lesson</p>
            <div className="flex flex-wrap gap-1.5">
              {lessons.map((l, i) => {
                const done = completed.includes(i);
                const current = i === lessonIndex;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="w-8 h-8 rounded-full text-xs font-semibold transition-all flex items-center justify-center"
                    style={{
                      background: current ? accentColour : done ? `${accentColour}20` : 'rgba(255,255,255,0.06)',
                      color: current ? '#1c1c1a' : done ? accentColour : 'var(--brand-muted)',
                      border: current ? 'none' : `1px solid ${done ? `${accentColour}30` : 'rgba(255,255,255,0.08)'}`,
                    }}
                    title={l.title}
                  >
                    {done && !current ? <CheckCircle2 size={12} /> : i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
