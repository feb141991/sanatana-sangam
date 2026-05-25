'use client';

// ─── Pathshala Lesson Reader — parchment e-reader ────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase';
import ConfettiOverlay from '@/components/ui/ConfettiOverlay';
import { useSadhana } from '@/contexts/EngineContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Lesson } from '@/lib/pathshala-lessons';
import CanonicalReader from '@/components/pathshala/CanonicalReader';
import { localSpiritualDate } from '@/lib/sacred-time';

interface Props {
  userId: string;
  pathId: string;
  pathTitle: string;
  tradition: string;
  accentColour: string;
  lessons: Lesson[];
  currentLesson: number;
  completedLessons: number[];
  appLanguage?: string;
  meaningLanguage?: string;
  transliterationLanguage?: string;
  showTransliteration?: boolean;
  hindiMeanings?: Record<string, string>;
}

export default function LessonClient({
  userId,
  pathId,
  pathTitle,
  tradition,
  accentColour,
  lessons,
  currentLesson: initialLesson,
  completedLessons: initialCompleted,
  appLanguage,
  meaningLanguage,
  transliterationLanguage,
  showTransliteration = true,
  hindiMeanings,
}: Props) {
  const router   = useRouter();
  const engine   = useSadhana();
  const supabase = useRef(createClient()).current;
  const { t } = useLanguage();

  const totalLessons = lessons.length;

  // ── Lesson navigation ──────────────────────────────────────────────────────
  const [lessonIndex, setLessonIndex] = useState(initialLesson ?? 0);
  const [completed,   setCompleted]   = useState<number[]>(initialCompleted ?? []);
  const [saving,      setSaving]      = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bridge, setBridge] = useState<{ bridge: string; next_step: string } | null>(null);
  const [showBridge, setShowBridge] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const lesson      = lessons[lessonIndex];
  const isCompleted = completed.includes(lessonIndex);
  const progressPct = totalLessons > 0 ? Math.round((completed.length / totalLessons) * 100) : 0;

  // ── Mark lesson complete ───────────────────────────────────────────────────
  async function markComplete() {
    if (isCompleted || saving) return;
    setSaving(true);
    const newCompleted = [...completed, lessonIndex];
    const nextLesson   = Math.min(lessonIndex + 1, totalLessons - 1);
    try {
      const { error } = await supabase
        .from('guided_path_progress')
        .update({
          current_lesson:    nextLesson,
          completed_lessons: newCompleted,
          ...(newCompleted.length === totalLessons ? { status: 'completed', completed_at: new Date().toISOString() } : {}),
        })
        .eq('user_id', userId)
        .eq('path_id', pathId);
      if (error) throw error;
      setCompleted(newCompleted);
      const isPathDone = newCompleted.length === totalLessons;

      const today = localSpiritualDate(
        typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
        4
      );
      // Write immediately so DailySadhanaStrip updates in real-time via storage event
      try { localStorage.setItem(`shoonaya-pathshala-done-${today}`, 'true'); } catch { /* non-fatal */ }

      void (async () => {
        try {
          await supabase
            .from('daily_sadhana')
            .upsert(
              { user_id: userId, date: today, pathshala_done: true },
              { onConflict: 'user_id,date' }
            );
        } catch {
          // Non-fatal: lesson completion should still succeed locally and in guided progress.
        }
      })();

      toast.success(isPathDone ? (t('pathCompleted') || 'Path completed!') : (t('lessonComplete') || 'Lesson completed!'));
      if (isPathDone) setShowConfetti(true);
      if (engine) {
        engine.tracker.trackShlokaRead(pathId, lessonIndex, 0, 0).catch(() => {});
        engine.streaks.markDone(userId, 'shloka').catch(() => {});
      }
      if (newCompleted.length < totalLessons) {
        // Fetch bridge before continuing (with 3 second timeout)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        fetch('/api/pathshala/bridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonTitle: lesson.title,
            pathTitle,
            tradition,
            language: meaningLanguage ?? appLanguage ?? 'en',
            lastEntryMeaning: lesson.entries.at(-1)?.meaning ?? '',
            completedCount: newCompleted.length,
            totalLessons
          }),
          signal: controller.signal
        })
          .then(r => r.json())
          .then(data => {
            clearTimeout(timeout);
            setBridge(data);
            setShowBridge(true);
          })
          .catch(() => {
            // Fallback to normal flow
            goToLesson(nextLesson);
          });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save progress';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function goToLesson(index: number) {
    if (index < 0 || index >= totalLessons) return;
    setLessonIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── CTA text & action ──────────────────────────────────────────────────────
  const ctaAction = isCompleted ? () => goToLesson(lessonIndex + 1) : markComplete;
  const ctaDisabled = isCompleted && lessonIndex === totalLessons - 1;

  const ctaLabel = isCompleted
    ? <><span>{t('nextLesson') || 'Next Lesson'}</span><ChevronRight size={15} /></>
    : saving
      ? <Loader2 size={15} className="animate-spin" />
      : <><CheckCircle2 size={15} /><span>{t('markLessonComplete') || 'Mark Complete'}</span></>;

  if (!lesson) return null;

  return (
    <>
      <ConfettiOverlay show={showConfetti} onComplete={() => setShowConfetti(false)} />
      <CanonicalReader
        entries={lesson.entries}
        title={lesson.title}
        subtitle={pathTitle}
        userId={userId}
        tradition={tradition}
        appLanguage={appLanguage}
        meaningLanguage={meaningLanguage}
        transliterationLanguage={transliterationLanguage}
        showTransliteration={showTransliteration}
        hindiMeanings={hindiMeanings}
        onClose={() => router.push('/pathshala')}
        isModal={false}
        ctaConfig={{
          label: ctaLabel,
          disabled: ctaDisabled || saving,
          action: ctaAction,
        }}
        lessonsNavigation={{
          totalLessons,
          completedLessons: completed,
          currentLesson: lessonIndex,
          onGoToLesson: goToLesson,
          progressPct
        }}
      />
      {showBridge && bridge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#F7EDD8]">
          <div className="max-w-2xl text-center flex flex-col items-center">
            <div className="text-4xl text-[#BFA779] mb-8 font-serif">ॐ</div>
            <p className="text-2xl md:text-3xl text-[#4A3D2A] font-serif leading-relaxed mb-6">
              {bridge.bridge}
            </p>
            <p className="text-lg md:text-xl text-[#7A6B56] italic mb-12">
              {bridge.next_step}
            </p>
            <button
              onClick={() => {
                setShowBridge(false);
                const nextIndex = lessonIndex + 1;
                if (nextIndex >= totalLessons) {
                  router.push('/pathshala');
                } else {
                  goToLesson(nextIndex);
                }
              }}
              className="px-10 py-4 rounded-full text-lg font-medium text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: accentColour || '#8b2e16' }}
            >
              {lessonIndex + 1 >= totalLessons ? "पथ पूर्ण" : "आगे बढ़ें"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
