'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';

interface Session { date: string; rounds: number; bead_count: number; duration_secs: number; mantra_id: string; created_at: string; }
interface Props { sessions: Session[]; shlokaStreak: number; sevaScore: number; tradition: string; }

type Filter = '1d' | '7d' | '30d' | '90d';
const FILTERS: { key: Filter; label: string; days: number }[] = [
  { key: '1d',  label: 'Today',   days: 1  },
  { key: '7d',  label: '7 Days',  days: 7  },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function DowChart({ data, color, isDark }: { data: number[]; color: string; isDark: boolean }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2" style={{ height: 72 }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div className="w-full rounded-t-md" style={{ background: color }}
            initial={{ height: 0 }} animate={{ height: `${Math.max(4, (v / max) * 58)}px` }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
          <span className="text-[10px] font-semibold" style={{ color: isDark ? `${color}66` : `${color}88` }}>{DAY_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, sub, detail, isDark, color }: {
  label: string; value: string; icon: string; sub: string; detail?: string; isDark: boolean; color: string;
}) {
  const [open, setOpen] = useState(false);
  const border = isDark ? 'rgba(180,130,200,0.14)' : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'          : 'rgba(255,255,255,0.90)';
  const text   = isDark ? 'rgba(245,225,185,0.97)'  : '#1A1208';
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
            className="text-[11px] mt-3 pt-3 leading-relaxed" style={{ color: sub, borderTop: `1px solid ${border}` }}>
            {detail}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CalView({ sessions, isDark, color, text, sub, border, bg }: {
  sessions: Session[]; isDark: boolean; color: string; text: string; sub: string; border: string; bg: string;
}) {
  const now = new Date();
  const [cal, setCal] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [sel, setSel]  = useState<string | null>(null);

  const dateMap = useMemo(() => {
    const m: Record<string, Session[]> = {};
    sessions.forEach(s => { if (!m[s.date]) m[s.date] = []; m[s.date].push(s); });
    return m;
  }, [sessions]);

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
  const label = new Date(cal.year, cal.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCal(c => { const d = new Date(c.year, c.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronLeft size={16} style={{ color }} />
        </button>
        <p className="text-[13px] font-semibold" style={{ color: text, fontFamily: 'var(--font-serif)' }}>{label}</p>
        <button onClick={() => setCal(c => { const d = new Date(c.year, c.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronRight size={16} style={{ color }} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-center text-[9px] font-semibold" style={{ color: sub }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const sess = dateMap[iso];
          const isToday = iso === todayIso;
          const isSel   = iso === sel;
          return (
            <motion.button key={iso} whileTap={{ scale: 0.88 }} onClick={() => setSel(s => s === iso ? null : iso)}
              className="aspect-square rounded-full flex items-center justify-center text-[11px] font-semibold"
              style={{
                background: isSel ? color : sess ? `${color}28` : 'transparent',
                color: isSel ? '#fff' : sess ? color : sub,
                border: isToday ? `1.5px solid ${color}` : '1.5px solid transparent',
              }}>
              {String(new Date(iso + 'T12:00:00').getDate())}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 text-[11.5px]" style={{ borderTop: `1px solid ${border}`, color: sub }}>
            {dateMap[sel]
              ? (() => {
                  const s = dateMap[sel];
                  const rounds = s.reduce((a,b) => a + (b.rounds ?? 0), 0);
                  const beads  = s.reduce((a,b) => a + (b.bead_count ?? 0), 0);
                  return <span style={{ color: text }}>{s.length} session{s.length !== 1 ? 's' : ''} · {rounds} rounds · {beads.toLocaleString()} beads 🪷</span>;
                })()
              : <span>No bhakti session on {new Date(sel + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mantra bar ────────────────────────────────────────────────────────────────
function MantraBar({ mantra, count, max, color, isDark, text, sub }: {
  mantra: string; count: number; max: number; color: string; isDark: boolean; text: string; sub: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-semibold truncate" style={{ color: text }}>{mantra.replace(/_/g,' ')}</span>
        <span className="text-[11px] shrink-0 ml-2" style={{ color: sub }}>{count}×</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${(count / max) * 100}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BhaktiInsightsClient({ sessions, shlokaStreak, sevaScore }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const rose   = '#C4789A';   // rose/devotional colour
  const amber  = '#C8924A';
  const text   = isDark ? 'rgba(245,225,185,0.97)' : '#1A1208';
  const sub    = isDark ? 'rgba(200,165,110,0.55)'  : 'rgba(100,65,25,0.55)';
  const border = isDark ? 'rgba(196,120,154,0.15)'  : 'rgba(0,0,0,0.07)';
  const bg     = isDark ? 'var(--card-bg)'           : 'rgba(255,255,255,0.90)';
  const pageBg = isDark ? '#120a10'                  : '#fdf4f8';

  const [filter, setFilter] = useState<Filter>('30d');
  const days = FILTERS.find(f => f.key === filter)!.days;

  const cutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - days + 1);
    return d.toISOString().slice(0, 10);
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => sessions.filter(s => s.date >= cutoff), [sessions, cutoff]);

  const stats = useMemo(() => {
    const byDate: Record<string, Session[]> = {};
    filtered.forEach(s => { if (!byDate[s.date]) byDate[s.date] = []; byDate[s.date].push(s); });

    const activeDays    = Object.keys(byDate).length;
    const totalSessions = filtered.length;
    const totalRounds   = filtered.reduce((a, s) => a + (s.rounds ?? 0), 0);
    const totalBeads    = filtered.reduce((a, s) => a + (s.bead_count ?? 0), 0);
    const totalSecs     = filtered.reduce((a, s) => a + (s.duration_secs ?? 0), 0);

    const dow = Array(7).fill(0) as number[];
    filtered.forEach(s => { dow[new Date(s.date + 'T12:00:00').getDay()]++; });

    const mantraFreq: Record<string, number> = {};
    filtered.forEach(s => { if (s.mantra_id) mantraFreq[s.mantra_id] = (mantraFreq[s.mantra_id] ?? 0) + 1; });
    const mantras = Object.entries(mantraFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxMantra = mantras[0]?.[1] ?? 1;

    return { activeDays, totalSessions, totalRounds, totalBeads, totalSecs, dow, mantras, maxMantra };
  }, [filtered]);

  function handleShare() {
    const t = `🪷 Bhakti Practice — ${stats.activeDays} active days, ${stats.totalRounds} rounds, ${stats.totalBeads.toLocaleString()} beads · 🔥 ${shlokaStreak}-day shloka streak · ⭐ ${sevaScore} Seva points`;
    if (navigator.share) navigator.share({ title: 'My Bhakti Insights', text: t }).catch(() => {});
    else navigator.clipboard?.writeText(t).then(() => alert('Copied to clipboard'));
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: pageBg }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <ChevronLeft size={20} style={{ color: rose }} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: `${rose}99` }}>Bhakti</p>
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: text }}>Devotion Insights</h1>
        </div>
        <button onClick={handleShare} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
          <Share2 size={16} style={{ color: rose }} />
        </button>
      </div>

      {/* Filter */}
      <div className="px-4 mb-4 flex gap-2">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all"
            style={{ background: filter === f.key ? rose : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), color: filter === f.key ? '#fff' : sub }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {/* Devotion hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-[1.4rem] p-5 border"
          style={{ background: isDark ? 'linear-gradient(135deg,rgba(40,15,30,0.9),rgba(28,10,22,0.95))' : 'linear-gradient(135deg,rgba(255,235,245,0.99),rgba(255,220,240,0.99))', borderColor: `${rose}30` }}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Shloka Streak', value: shlokaStreak, icon: '🔥', suffix: 'd' },
              { label: 'Seva Score',    value: sevaScore,    icon: '⭐', suffix: 'pts' },
              { label: 'Active Days',   value: stats.activeDays, icon: '🪷', suffix: 'd' },
            ].map(({ label, value, icon, suffix }) => (
              <div key={label} className="text-center">
                <p className="text-xl mb-0.5">{icon}</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: text }}>{value}</p>
                <p className="text-[9px] uppercase tracking-wide" style={{ color: sub }}>{suffix} · {label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Sessions" value={String(stats.totalSessions)} icon="🕉️" sub={sub} isDark={isDark} color={rose}
            detail={`${stats.totalSessions} bhakti sessions in this period. Each sitting is an offering to the divine.`} />
          <StatCard label="Rounds" value={String(stats.totalRounds)} icon="📿" sub={sub} isDark={isDark} color={rose}
            detail={`${stats.totalRounds} mala rounds chanted. The mantra purifies the mind one bead at a time.`} />
          <StatCard label="Beads Chanted" value={stats.totalBeads >= 1000 ? `${(stats.totalBeads/1000).toFixed(1)}k` : String(stats.totalBeads)} icon="🪷" sub={sub} isDark={isDark} color={rose}
            detail={`${stats.totalBeads.toLocaleString()} individual mantra repetitions. Each bead is a seed of devotion.`} />
          <StatCard label="Time in Bhakti" value={fmtTime(stats.totalSecs)} icon="⏱️" sub={sub} isDark={isDark} color={rose}
            detail={`${fmtTime(stats.totalSecs)} of devoted practice time. Consistency deepens devotion.`} />
        </div>

        {/* Mantra frequency */}
        {stats.mantras.length > 0 && (
          <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: `${rose}80` }}>
              Mantras Chanted
            </p>
            <div className="space-y-3">
              {stats.mantras.map(([m, c]) => (
                <MantraBar key={m} mantra={m} count={c} max={stats.maxMantra} color={rose} isDark={isDark} text={text} sub={sub} />
              ))}
            </div>
          </div>
        )}

        {/* DOW */}
        <div className="rounded-2xl p-4 border" style={{ background: bg, borderColor: border }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: `${rose}80` }}>Practice by Day</p>
          <DowChart data={stats.dow} color={rose} isDark={isDark} />
          {stats.dow.some(v => v > 0) && (
            <p className="text-[10px] mt-3 text-center" style={{ color: sub }}>
              {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][stats.dow.indexOf(Math.max(...stats.dow))]} is your most devoted day
            </p>
          )}
        </div>

        {/* Calendar */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: `${rose}80` }}>Calendar</p>
          <CalView sessions={sessions} isDark={isDark} color={rose} text={text} sub={sub} border={border} bg={bg} />
        </div>

        {/* Quote */}
        <div className="text-center py-3">
          <p className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: `${amber}55` }}>
            भक्तिर्भगवतो सेवा — devotion is service to the divine. You are on the path.
          </p>
        </div>
      </div>
    </div>
  );
}
