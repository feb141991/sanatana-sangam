'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface LogRow { log_date: string; step_id: string; created_at: string; }
interface Props  { logs: LogRow[]; tradition: string; }

type Filter = '7d' | '30d' | '90d';
const FILTERS: { key: Filter; label: string; days: number }[] = [
  { key: '7d',  label: '7 Days',  days: 7  },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
];

const DAY_LABELS = ['S','M','T','W','T','F','S'];

// ── Bar chart ─────────────────────────────────────────────────────────────────
function DowChart({ data, amber, isDark }: { data: number[]; amber: string; isDark: boolean }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 72 }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div className="w-full rounded-t-md" style={{ background: amber }}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(4, (v / max) * 58)}px` }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
          <span className="text-[10px] font-semibold" style={{ color: isDark ? 'rgba(200,146,74,0.5)' : 'rgba(100,65,25,0.5)' }}>
            {DAY_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card (clickable → drilldown) ────────────────────────────────────────
function StatCard({ label, value, sub, icon, detail, isDark, amber }: {
  label: string; value: string; sub: string; icon: string;
  detail?: string; isDark: boolean; amber: string;
}) {
  const [open, setOpen] = useState(false);
  const border = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'          : 'rgba(255,255,255,0.90)';
  const text   = isDark ? 'rgba(245,225,185,0.97)'  : '#1A1208';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => detail && setOpen(v => !v)}
      className="rounded-2xl p-4 border"
      style={{ background: bg, borderColor: border, boxShadow: isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)', cursor: detail ? 'pointer' : 'default' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium mb-1" style={{ color: sub }}>{label}</p>
          <p className="font-bold" style={{ fontSize: '1.55rem', color: text, lineHeight: 1.1, fontFamily: 'var(--font-serif)' }}>{value}</p>
        </div>
        <span className="text-2xl leading-none mt-0.5">{icon}</span>
      </div>
      <AnimatePresence>
        {open && detail && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-[11px] mt-3 pt-3 leading-relaxed"
            style={{ color: sub, borderTop: `1px solid ${border}` }}>
            {detail}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Calendar month view ───────────────────────────────────────────────────────
function CalView({ logs, isDark, amber, text, sub, border, bg }: {
  logs: LogRow[]; isDark: boolean; amber: string; text: string; sub: string; border: string; bg: string;
}) {
  const now = new Date();
  const [cal, setCal] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [sel, setSel]  = useState<string | null>(null);

  const dateMap = useMemo(() => {
    const m: Record<string, number> = {};
    logs.forEach(l => { m[l.log_date] = (m[l.log_date] ?? 0) + 1; });
    return m;
  }, [logs]);

  const cells = useMemo(() => {
    const first = new Date(cal.year, cal.month, 1);
    const last  = new Date(cal.year, cal.month + 1, 0);
    const arr: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      arr.push(`${cal.year}-${String(cal.month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cal]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const label    = new Date(cal.year, cal.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCal(c => { const d = new Date(c.year, c.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronLeft size={16} style={{ color: amber }} />
        </button>
        <p className="text-[13px] font-semibold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>{label}</p>
        <button onClick={() => setCal(c => { const d = new Date(c.year, c.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronRight size={16} style={{ color: amber }} />
        </button>
      </div>
      {/* DOW */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} className="text-center text-[9px] font-semibold" style={{ color: sub }}>{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const count = dateMap[iso] ?? 0;
          const isToday = iso === todayIso;
          const isSel   = iso === sel;
          return (
            <motion.button key={iso} whileTap={{ scale: 0.88 }} onClick={() => setSel(s => s === iso ? null : iso)}
              className="aspect-square rounded-full flex items-center justify-center text-[11px] font-semibold"
              style={{
                background: isSel ? amber : count > 0 ? `${amber}28` : 'transparent',
                color: isSel ? '#1c1208' : count > 0 ? amber : sub,
                border: isToday ? `1.5px solid ${amber}` : '1.5px solid transparent',
              }}>
              {String(new Date(iso + 'T12:00:00').getDate())}
            </motion.button>
          );
        })}
      </div>
      {/* Detail panel */}
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 text-[11.5px]" style={{ borderTop: `1px solid ${border}`, color: sub }}>
            {dateMap[sel]
              ? <span style={{ color: text }}>{dateMap[sel]} step{dateMap[sel] !== 1 ? 's' : ''} completed on {new Date(sel + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 🌅</span>
              : <span>No steps logged on {new Date(sel + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NityaInsightsClient({ logs }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const amber  = '#C8924A';
  const green  = '#6BAE75';
  const text   = isDark ? 'rgba(245,225,185,0.97)' : '#1A1208';
  const sub    = isDark ? 'rgba(200,165,110,0.55)'  : 'rgba(100,65,25,0.55)';
  const border = isDark ? 'rgba(200,146,74,0.12)'   : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'           : 'rgba(255,255,255,0.90)';
  const pageBg = isDark ? '#120d07'                  : '#fdf6ec';

  const [filter, setFilter] = useState<Filter>('30d');
  const days = FILTERS.find(f => f.key === filter)!.days;

  const cutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - days + 1);
    return d.toISOString().slice(0, 10);
  }, [filter, days]);

  const filtered = useMemo(() => logs.filter(l => l.log_date >= cutoff), [logs, cutoff]);

  const stats = useMemo(() => {
    const byDate: Record<string, number> = {};
    filtered.forEach(l => { byDate[l.log_date] = (byDate[l.log_date] ?? 0) + 1; });
    const dates       = Object.keys(byDate).sort();
    const activeDays  = dates.length;
    const totalSteps  = filtered.length;
    const avgPerDay   = activeDays > 0 ? (totalSteps / activeDays).toFixed(1) : '0';
    const completionRate = days > 0 ? Math.round((activeDays / days) * 100) : 0;

    // Streak
    const today = new Date().toISOString().slice(0, 10);
    let streak = 0;
    const d = new Date();
    while (true) {
      const iso = d.toISOString().slice(0, 10);
      if (!byDate[iso]) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // Best streak
    let bestStreak = 0, cur = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) { cur = 1; continue; }
      const prev = new Date(dates[i - 1] + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      cur = diff === 1 ? cur + 1 : 1;
      if (cur > bestStreak) bestStreak = cur;
    }
    if (cur > bestStreak) bestStreak = cur;

    // DOW distribution
    const dow = Array(7).fill(0) as number[];
    filtered.forEach(l => { dow[new Date(l.log_date + 'T12:00:00').getDay()]++; });

    // Most common step
    const stepFreq: Record<string, number> = {};
    filtered.forEach(l => { stepFreq[l.step_id] = (stepFreq[l.step_id] ?? 0) + 1; });
    const topStep = Object.entries(stepFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const uniqueSteps = Object.keys(stepFreq).length;

    return { activeDays, totalSteps, avgPerDay, completionRate, streak, bestStreak, dow, topStep, uniqueSteps };
  }, [filtered, days]);

  function handleShare() {
    const text = `🌅 Nitya Karma — ${stats.activeDays} active days, ${stats.completionRate}% completion, ${stats.streak}-day streak 🙏`;
    if (navigator.share) navigator.share({ title: 'My Nitya Karma Insights', text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => alert('Copied to clipboard'));
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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}99` }}>Nitya Karma</p>
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: text }}>Insights</h1>
        </div>
        <button onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <Share2 size={16} style={{ color: amber }} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="px-4 mb-4 flex gap-2">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all"
            style={{
              background: filter === f.key ? amber : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
              color: filter === f.key ? '#1c1208' : sub,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {/* Streak hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-[1.4rem] p-5 border"
          style={{ background: isDark ? 'linear-gradient(135deg,rgba(40,22,8,0.9),rgba(28,15,5,0.95))' : 'linear-gradient(135deg,rgba(255,235,200,0.98),rgba(250,222,175,0.99))', borderColor: `${amber}30` }}>
          <div className="flex items-center gap-4">
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
              <span className="text-4xl">🌅</span>
            </motion.div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${amber}80` }}>Current Streak</p>
              <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: text, lineHeight: 1 }}>
                {stats.streak}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: sub }}>
                {stats.streak === 0 ? 'Start today — consistency is tapas' : `day${stats.streak !== 1 ? 's' : ''} of unbroken dharmic duty`}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: amber }}
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, (stats.completionRate))}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: sub }}>{stats.completionRate}% completion rate over {days} days</p>
        </motion.div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Active Days" value={String(stats.activeDays)} sub={sub} icon="📅" isDark={isDark} amber={amber}
            detail={`You completed at least one step on ${stats.activeDays} out of ${days} days. ${stats.activeDays >= days * 0.8 ? 'Exceptional consistency!' : 'Keep building the daily habit — aim for 80%.'}`} />
          <StatCard label="Total Steps" value={String(stats.totalSteps)} sub={sub} icon="✅" isDark={isDark} amber={amber}
            detail={`${stats.totalSteps} individual steps logged. Each small step is an offering to dharma.`} />
          <StatCard label="Best Streak" value={`${stats.bestStreak}d`} sub={sub} icon="🏆" isDark={isDark} amber={amber}
            detail={`Your longest unbroken run was ${stats.bestStreak} consecutive days. Can you beat it?`} />
          <StatCard label="Avg Steps/Day" value={stats.avgPerDay} sub={sub} icon="📊" isDark={isDark} amber={amber}
            detail={`On active days, you average ${stats.avgPerDay} steps. A full Nitya sequence is typically 5–7 steps.`} />
        </div>

        {/* Unique steps */}
        {stats.uniqueSteps > 0 && (
          <div className="rounded-2xl px-4 py-3.5 border flex items-center gap-3"
            style={{ background: bg, borderColor: border }}>
            <span className="text-xl">🔤</span>
            <div>
              <p className="text-[12px] font-semibold" style={{ color: text }}>{stats.uniqueSteps} unique steps practiced</p>
              <p className="text-[11px] mt-0.5" style={{ color: sub }}>
                {stats.topStep ? `Most consistent: "${stats.topStep.replace(/_/g,' ')}"` : 'Build a complete daily sequence'}
              </p>
            </div>
          </div>
        )}

        {/* Day-of-week chart */}
        <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: `${amber}80` }}>
            Practice by Day of Week
          </p>
          <DowChart data={stats.dow} amber={amber} isDark={isDark} />
          <p className="text-[10px] mt-3 text-center" style={{ color: sub }}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][stats.dow.indexOf(Math.max(...stats.dow))]} is your strongest day
          </p>
        </div>

        {/* Calendar */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: `${amber}80` }}>
            Calendar
          </p>
          <CalView logs={logs} isDark={isDark} amber={amber} text={text} sub={sub} border={border} bg={bg} />
        </div>

        {/* Encouragement */}
        <div className="text-center py-3">
          <p className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: `${amber}60` }}>
            {stats.completionRate >= 80
              ? 'श्रेयान् स्वधर्मो विगुणः — one\'s own dharma, even imperfect, is superior.'
              : 'योगः कर्मसु कौशलम् — excellence in action is yoga. Keep going.'}
          </p>
        </div>
      </div>
    </div>
  );
}
