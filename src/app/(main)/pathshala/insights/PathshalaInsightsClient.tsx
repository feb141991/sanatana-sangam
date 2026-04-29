'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Share2 } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface ProgressRow {
  path_id: string; status: string; completed_at: string | null;
  current_lesson: number; completed_lessons: number[]; created_at: string; updated_at: string;
}
interface Props { progress: ProgressRow[]; tradition: string; }

// Friendly path names — must match SEED_PATHS ids in PathshalaClient.tsx
const PATH_NAMES: Record<string, { name: string; icon: string; total_lessons: number }> = {
  'bhagavad-gita-intro': { name: 'Bhagavad Gita — Foundations', icon: '📖', total_lessons: 30 },
  'upanishads-core':     { name: 'Core Upanishads',              icon: '🕉️', total_lessons: 20 },
  'stotra-path':         { name: 'Daily Stotra Practice',        icon: '🙏', total_lessons: 14 },
  'yoga-sutras':         { name: 'Patanjali Yoga Sutras',        icon: '🧘', total_lessons: 40 },
  'nitnem-daily':        { name: 'Nitnem — Daily Banis',         icon: '🕉️', total_lessons: 10 },
  'dhammapada-path':     { name: 'Dhammapada — 26 Chapters',    icon: '☸️', total_lessons: 26 },
};

function getPathInfo(id: string) {
  return PATH_NAMES[id] ?? { name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: '📚', total_lessons: 0 };
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, sub, detail, isDark, amber }: {
  label: string; value: string; icon: string; sub: string; detail?: string; isDark: boolean; amber: string;
}) {
  const [open, setOpen] = useState(false);
  const border = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'         : 'rgba(255,255,255,0.90)';
  const text   = isDark ? 'rgba(245,225,185,0.97)' : '#1A1208';

  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={() => detail && setOpen(v => !v)}
      className="rounded-2xl p-4 border"
      style={{ background: bg, borderColor: border, boxShadow: isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)', cursor: detail ? 'pointer' : 'default' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium mb-1" style={{ color: sub }}>{label}</p>
          <p className="font-bold" style={{ fontSize: '1.55rem', color: text, lineHeight: 1.1, fontFamily: 'var(--font-serif)' }}>{value}</p>
        </div>
        <span className="text-2xl leading-none mt-0.5">{icon}</span>
      </div>
      <AnimatePresence>
        {open && detail && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-[11px] mt-3 pt-3 leading-relaxed"
            style={{ color: sub, borderTop: `1px solid ${border}` }}>
            {detail}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Path progress card ────────────────────────────────────────────────────────
function PathCard({ row, isDark, amber }: { row: ProgressRow; isDark: boolean; amber: string }) {
  const [open, setOpen] = useState(false);
  const info    = getPathInfo(row.path_id);
  const border  = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(0,0,0,0.07)';
  const bg      = isDark ? 'var(--card-bg)'         : 'rgba(255,255,255,0.90)';
  const text    = isDark ? 'rgba(245,225,185,0.97)' : '#1A1208';
  const sub     = isDark ? 'rgba(200,165,110,0.55)' : 'rgba(100,65,25,0.55)';
  const done       = row.status === 'completed';
  const left       = row.status === 'dismissed';
  const completedCount = Array.isArray(row.completed_lessons) ? row.completed_lessons.length : 0;
  const totalLessons   = info.total_lessons > 0 ? info.total_lessons : Math.max(1, row.current_lesson + 1);
  const pct            = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  const statusBadge = done
    ? <span className="text-[10px] rounded-full px-2 py-0.5 font-bold" style={{ background: `${amber}20`, color: amber }}>Done ✓</span>
    : left
      ? <span className="text-[10px] rounded-full px-2 py-0.5 font-bold" style={{ background: 'rgba(255,255,255,0.07)', color: sub }}>Left</span>
      : <span className="text-[10px] rounded-full px-2 py-0.5 font-bold" style={{ background: 'rgba(72,200,120,0.14)', color: '#4BC878' }}>Active</span>;

  const subLine = done
    ? `Completed${row.completed_at ? ' ' + new Date(row.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}`
    : left
      ? `Left at lesson ${row.current_lesson} · ${completedCount} lesson${completedCount !== 1 ? 's' : ''} done`
      : `Lesson ${row.current_lesson} · ${completedCount}/${totalLessons} done`;

  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={() => setOpen(v => !v)}
      className="rounded-2xl p-4 border cursor-pointer"
      style={{
        background: left ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') : bg,
        borderColor: done ? `${amber}40` : border,
        boxShadow: isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)',
        opacity: left ? 0.65 : 1,
      }}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{info.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold truncate" style={{ color: text }}>{info.name}</p>
            {statusBadge}
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: sub }}>{subLine}</p>
        </div>
      </div>
      {!done && !left && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
          <motion.div className="h-full rounded-full" style={{ background: amber }}
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
        </div>
      )}
      {left && pct > 0 && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
          <div className="h-full rounded-full" style={{ background: sub, width: `${pct}%` }} />
        </div>
      )}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 text-[11px] space-y-1" style={{ borderTop: `1px solid ${border}`, color: sub }}>
            <p>Started: {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            {row.updated_at && <p>Last active: {new Date(row.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
            <p>Lessons completed: {Array.isArray(row.completed_lessons) ? row.completed_lessons.length : 0}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PathshalaInsightsClient({ progress }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const amber  = '#8BA888';   // sage green for Pathshala
  const amberA = '#C8924A';
  const text   = isDark ? 'rgba(245,225,185,0.97)' : '#1A1208';
  const sub    = isDark ? 'rgba(200,165,110,0.55)'  : 'rgba(100,65,25,0.55)';
  const border = isDark ? 'rgba(139,168,136,0.15)'  : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'           : 'rgba(255,255,255,0.90)';
  const pageBg = isDark ? '#0d1209'                  : '#f4f8f4';

  const stats = useMemo(() => {
    const completed  = progress.filter(p => p.status === 'completed');
    const active     = progress.filter(p => p.status === 'active');
    const dismissed  = progress.filter(p => p.status === 'dismissed');

    // "Enrolled" = any path the user has touched that isn't just left behind.
    // Dismissed paths are excluded from the enrolled count (user actively left them).
    const enrolled = progress.filter(p => p.status !== 'dismissed');

    // Lessons done — exclude dismissed paths (they don't count toward current progress)
    const totalLessons = enrolled.reduce(
      (s, p) => s + (Array.isArray(p.completed_lessons) ? p.completed_lessons.length : 0),
      0,
    );
    const totalPaths    = enrolled.length;
    const completedPaths = completed.length;

    // Days since first non-dismissed enrollment
    const nonDismissed = enrolled.length > 0 ? enrolled : progress; // fallback
    const first = nonDismissed.length > 0
      ? new Date(nonDismissed.reduce((a, b) => a.created_at < b.created_at ? a : b).created_at)
      : null;
    const daysOnJourney = first ? Math.max(1, Math.round((Date.now() - first.getTime()) / 86400000)) : 0;

    return { completed, active, dismissed, totalLessons, totalPaths, completedPaths, daysOnJourney };
  }, [progress]);

  function handleShare() {
    const t = `📚 Pathshala — ${stats.completedPaths} paths completed, ${stats.totalLessons} lessons, ${stats.daysOnJourney} days of learning 🙏`;
    if (navigator.share) navigator.share({ title: 'My Pathshala Insights', text: t }).catch(() => {});
    else navigator.clipboard?.writeText(t).then(() => alert('Copied to clipboard'));
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: pageBg }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronLeft size={20} style={{ color: amber }} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}99` }}>Pathshala</p>
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: text }}>Study Insights</h1>
        </div>
        <button onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <Share2 size={16} style={{ color: amber }} />
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-[1.4rem] p-5 border"
          style={{ background: isDark ? 'linear-gradient(135deg,rgba(15,28,15,0.9),rgba(10,20,10,0.95))' : 'linear-gradient(135deg,rgba(230,245,230,0.99),rgba(215,235,215,0.99))', borderColor: `${amber}30` }}>
          <div className="flex items-center gap-4">
            <motion.span className="text-4xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>📖</motion.span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}80` }}>Learning Journey</p>
              <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: text, lineHeight: 1 }}>{stats.daysOnJourney}</p>
              <p className="text-[12px] mt-0.5" style={{ color: sub }}>
                {stats.daysOnJourney === 0 ? 'Enroll in your first path' : `day${stats.daysOnJourney !== 1 ? 's' : ''} on the study path`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Paths Enrolled" value={String(stats.totalPaths)} icon="🗺️" sub={sub} isDark={isDark} amber={amber}
            detail={`${stats.totalPaths} paths started. ${stats.completedPaths > 0 ? `You've completed ${stats.completedPaths} of them — excellent!` : 'Complete your first path to earn your first milestone.'}`} />
          <StatCard label="Paths Complete" value={String(stats.completedPaths)} icon="🏆" sub={sub} isDark={isDark} amber={amber}
            detail={`${stats.completedPaths} complete path${stats.completedPaths !== 1 ? 's' : ''}. Each completion is a milestone in your knowledge journey.`} />
          <StatCard label="Lessons Done" value={String(stats.totalLessons)} icon="✅" sub={sub} isDark={isDark} amber={amber}
            detail={`${stats.totalLessons} individual lessons completed across all your paths.`} />
          <StatCard label="Active Paths" value={String(stats.active.length)} icon="📚" sub={sub} isDark={isDark} amber={amber}
            detail={stats.active.length > 0 ? `${stats.active.length} path${stats.active.length !== 1 ? 's' : ''} in progress. Continue your studies daily.` : 'No active paths — start a new study journey.'} />
        </div>

        {/* Path list — active/completed first, dismissed at bottom */}
        {progress.length > 0 ? (
          <div className="space-y-4">
            {/* Active + completed */}
            {stats.active.length > 0 || stats.completed.length > 0 ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: `${amber}80` }}>
                  Your Paths
                </p>
                <div className="space-y-3">
                  {[...stats.active, ...stats.completed].map(row => (
                    <PathCard key={row.path_id} row={row} isDark={isDark} amber={amber} />
                  ))}
                </div>
              </div>
            ) : null}

            {/* Dismissed / left paths */}
            {stats.dismissed.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: sub }}>
                  Left Paths
                </p>
                <div className="space-y-3">
                  {stats.dismissed.map(row => (
                    <PathCard key={row.path_id} row={row} isDark={isDark} amber={amber} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl p-6 border text-center" style={{ background: bg, borderColor: border }}>
            <p className="text-3xl mb-3">📚</p>
            <p className="text-sm font-semibold" style={{ color: text }}>No study paths yet</p>
            <p className="text-[12px] mt-1" style={{ color: sub }}>Enroll in a Pathshala path to begin your scripture journey</p>
          </div>
        )}

        {/* Encouragement */}
        <div className="text-center py-3">
          <p className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: `${amberA}55` }}>
            विद्या ददाति विनयम् — knowledge gives humility. Keep studying.
          </p>
        </div>
      </div>
    </div>
  );
}
