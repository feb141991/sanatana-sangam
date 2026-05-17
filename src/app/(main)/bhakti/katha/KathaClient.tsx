'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BookOpen, Clock, Search, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Katha, KathaTradition } from '@/lib/katha-library';

interface Props {
  todayKatha: Katha;
  weekKathas: Katha[];
  traditionKathas: Katha[];
  allKathas: Katha[];
  tradition: string;
  userName: string;
}

const TRADITION_LABELS: Record<string, { label: string; termKatha: string; color: string }> = {
  hindu:    { label: 'Hindu',    termKatha: 'Kathas',  color: '#FF6B35' },
  sikh:     { label: 'Sikh',     termKatha: 'Sakhis',  color: '#1B7FD4' },
  buddhist: { label: 'Buddhist', termKatha: 'Dhamma Stories', color: '#7C5CBF' },
  jain:     { label: 'Jain',     termKatha: 'Kathas',  color: '#2D9E4A' },
};

const OCCASION_LABELS: Record<string, string> = {
  ekadashi: 'Ekadashi', purnima: 'Purnima', amavasya: 'Amavasya',
  pradosh: 'Pradosh', chaturthi: 'Chaturthi', shivaratri: 'Shivaratri',
  navratri: 'Navratri', diwali: 'Diwali', holi: 'Holi',
  janmashtami: 'Janmashtami', ramnavami: 'Ram Navami',
  'ganesh-chaturthi': 'Ganesh Chaturthi', 'karva-chauth': 'Karva Chauth',
  teej: 'Teej', gurpurab: 'Gurpurab', baisakhi: 'Baisakhi',
  vesak: 'Vesak', paryushana: 'Paryushana', general: 'General',
};

const TRADITIONS = ['all', 'hindu', 'sikh', 'buddhist', 'jain'] as const;

// ── View config: maps ?view= param → heading + pre-filter function ──────────
interface ViewConfig {
  heading: string;
  sub: string;
  filter: (k: Katha) => boolean;
  /** Hide the tradition tabs when a specific view is active */
  lockTabs: boolean;
}

const VIEW_CONFIGS: Record<string, ViewConfig> = {
  puranic: {
    heading: 'Puranic Tales',
    sub: 'Ramayana, Mahabharata & the Puranas',
    filter: k => k.tradition === 'hindu' && !k.tags.includes('panchatantra') && !k.tags.includes('heroes'),
    lockTabs: true,
  },
  bani: {
    heading: 'Bani & Sakhis',
    sub: 'Guru stories, sakhis and kirtan wisdom',
    filter: k => k.tradition === 'sikh',
    lockTabs: true,
  },
  dhamma: {
    heading: 'Dhamma Stories',
    sub: "Buddha's parables & Jataka tales",
    filter: k => k.tradition === 'buddhist',
    lockTabs: true,
  },
  jain: {
    heading: 'Jain Kathas',
    sub: 'Tirthankara stories & moral tales',
    filter: k => k.tradition === 'jain',
    lockTabs: true,
  },
  panchatantra: {
    heading: 'Panchatantra',
    sub: 'Ancient animal fables & wisdom tales',
    filter: k => k.tags.includes('panchatantra'),
    lockTabs: true,
  },
  heroes: {
    heading: 'Heroes of Bharat',
    sub: 'Warriors, saints & unsung legends',
    filter: k =>
      k.tags.some(t => ['warriors', 'saints', 'heroes', 'martyrdom', 'seva', 'sacrifice'].includes(t)) &&
      !k.tags.includes('panchatantra'),
    lockTabs: true,
  },
};

export default function KathaClient({
  todayKatha, weekKathas, traditionKathas, allKathas, tradition, userName
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trad = TRADITION_LABELS[tradition] ?? TRADITION_LABELS.hindu;
  const initialQuery = searchParams.get('search') ?? '';
  const viewParam = searchParams.get('view') ?? '';
  const viewCfg = VIEW_CONFIGS[viewParam] ?? null;

  const [activeFilter, setActiveFilter] = useState<'all' | KathaTradition>(
    viewCfg ? 'all' : initialQuery ? 'all' : tradition as any
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showSearch, setShowSearch] = useState(Boolean(initialQuery));

  // Page heading — view-specific or fall back to tradition term
  const pageHeading = viewCfg?.heading ?? `${trad.termKatha}`;
  const pageSubHeading = viewCfg?.sub ?? 'Sacred Library';

  // 1. Get the list of all kathas matching the current filter/view (for Today's Pick and Weekly Sadhana)
  const allowedKathas = allKathas.filter(k => {
    if (viewCfg) {
      return viewCfg.filter(k);
    }
    if (activeFilter === 'hindu') {
      return k.tradition === 'hindu' && !k.tags.includes('panchatantra') && !k.tags.includes('heroes');
    }
    if (activeFilter === 'sikh') {
      return k.tradition === 'sikh';
    }
    if (activeFilter === 'buddhist') {
      return k.tradition === 'buddhist';
    }
    if (activeFilter === 'jain') {
      return k.tradition === 'jain';
    }
    // 'all' shows all tradition-filtered scriptural stories (excluding fables and heroes)
    return !k.tags.includes('panchatantra') && !k.tags.includes('heroes');
  });

  // 2. Select a stable today's pick from allowedKathas
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const activeTodayKatha = allowedKathas.length > 0
    ? allowedKathas[dayOfYear % allowedKathas.length]
    : todayKatha;

  // 3. Select 5 unique weekly sadhanas from the allowed set, excluding today's pick
  const activeWeekKathas = allowedKathas
    .filter(k => k.id !== activeTodayKatha.id)
    .slice(0, 5);

  const filtered = allKathas.filter(k => {
    // 1. If a view is active, apply its pre-filter
    if (viewCfg) {
      if (!viewCfg.filter(k)) return false;
    } else {
      // 2. If no view is active, filter the main tabs as per card separation:
      // - 'hindu' tab shows Puranic/scriptural tales (no Panchatantra, no Heroes)
      // - 'sikh' tab shows Sikh Sakhis
      // - 'buddhist' tab shows Dhamma Stories
      // - 'jain' tab shows Jain Kathas
      // - 'all' tab shows a unified stream of spiritual scriptural stories (no Panchatantra, no Heroes)
      if (activeFilter === 'hindu') {
        if (k.tradition !== 'hindu' || k.tags.includes('panchatantra') || k.tags.includes('heroes')) return false;
      } else if (activeFilter === 'sikh') {
        if (k.tradition !== 'sikh') return false;
      } else if (activeFilter === 'buddhist') {
        if (k.tradition !== 'buddhist') return false;
      } else if (activeFilter === 'jain') {
        if (k.tradition !== 'jain') return false;
      } else if (activeFilter === 'all') {
        if (k.tags.includes('panchatantra') || k.tags.includes('heroes')) return false;
      }
    }

    // 3. Apply search query
    const matchSearch = searchQuery.trim() === '' ||
      k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.deity ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      OCCASION_LABELS[k.occasion]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchSearch;
  });

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden theme-bg theme-ink font-outfit selection:bg-[var(--brand-primary-soft)]">
      {/* Atmospheric ambient glows */}
      <div className="fixed top-0 right-0 w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] bg-[var(--brand-primary-soft)] blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[50vw] h-[50vw] max-w-[300px] max-h-[300px] bg-[var(--brand-primary-soft)] blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-3 backdrop-blur-[30px] bg-[var(--surface-raised)] border-b border-[var(--card-border)]">
        <div className="flex items-center justify-between gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl border border-[var(--card-border)] flex items-center justify-center bg-[var(--card-bg)] flex-shrink-0"
          >
            <ChevronLeft size={20} className="text-[var(--brand-primary)]" />
          </motion.button>

          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)] mb-0.5 opacity-70">{pageSubHeading}</span>
            <h1 className="text-[17px] font-serif font-bold theme-ink tracking-tight">{pageHeading}</h1>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowSearch(s => !s)}
            className="w-10 h-10 rounded-2xl border border-[var(--card-border)] flex items-center justify-center bg-[var(--card-bg)] flex-shrink-0"
          >
            <Search size={18} className={showSearch ? 'text-[var(--brand-primary)]' : 'theme-muted'} />
          </motion.button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 10 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by deity, occasion, title…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-9 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] theme-ink text-sm outline-none focus:border-[var(--brand-primary)]/40 transition-all"
                  autoFocus
                />
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 theme-muted" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted hover:theme-ink transition-colors text-lg leading-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ── */}
      <main className="px-4 pt-5 space-y-6">

        {/* ── Today's Pick — Hero Card ── */}
        {!searchQuery && activeTodayKatha && (
          <section>
            <Link href={`/bhakti/katha/${activeTodayKatha.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.985 }}
                className="group relative rounded-3xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)]"
                style={{ background: 'linear-gradient(135deg, rgba(200,146,74,0.12) 0%, var(--card-bg) 65%)' }}
              >
                {/* Subtle radial glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--brand-primary)]/[0.07] blur-[60px] rounded-full pointer-events-none" />

                <div className="relative z-10 p-5">
                  {/* Labels row */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20">
                      <Sparkles size={11} className="text-[var(--brand-primary)]" />
                      <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.25em]">Today&apos;s Pick</span>
                    </div>
                    <span className="text-[10px] font-bold theme-muted uppercase tracking-[0.2em]">
                      {activeTodayKatha.durationMin} min
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-serif font-bold theme-ink leading-tight tracking-tight group-hover:text-[var(--brand-primary)] transition-colors duration-500 mb-2">
                    {activeTodayKatha.title}
                  </h2>

                  {/* Preview */}
                  <p className="theme-muted text-sm leading-relaxed line-clamp-2 font-light mb-4">
                    &quot;{activeTodayKatha.preview}&quot;
                  </p>

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] theme-muted">
                        {TRADITION_LABELS[activeTodayKatha.tradition]?.label}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] theme-muted">
                        {OCCASION_LABELS[activeTodayKatha.occasion]}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shadow-md">
                      <BookOpen size={16} strokeWidth={1.5} className="text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </section>
        )}

        {/* ── This Week — Horizontal Scroll ── */}
        {!searchQuery && activeWeekKathas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--brand-primary)] opacity-70 block mb-0.5">This Week</span>
                <h3 className="text-base font-serif font-bold theme-ink tracking-tight">Weekly Sadhana</h3>
              </div>
              <button className="text-[10px] font-black text-[var(--brand-primary)] opacity-60 uppercase tracking-[0.3em] flex items-center gap-1">
                All <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x -mx-4 snap-always px-4">
              {activeWeekKathas.map((k, i) => (
                <motion.div
                  key={k.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 80 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-[220px] snap-start"
                >
                  <KathaCard katha={k} size="compact" />
                </motion.div>
              ))}
              <div className="flex-shrink-0 w-4" />
            </div>
          </section>
        )}

        {/* ── Browse All — Filter + Grid ── */}
        <section className="pb-6">
          {/* Section header */}
          <div className="flex items-end justify-between mb-3 px-0.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--brand-primary)] opacity-70 block mb-0.5">
                {searchQuery ? 'Results' : 'Explore'}
              </span>
              <h3 className="text-base font-serif font-bold theme-ink tracking-tight">
                {searchQuery ? 'Revealing Insights' : 'All Kathas'}
              </h3>
            </div>
            {!searchQuery && (
              <span className="text-[11px] theme-muted font-medium">{filtered.length} stories</span>
            )}
          </div>

          {/* Filter tabs — hidden when a view already scopes the content */}
          {!searchQuery && !viewCfg?.lockTabs && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none -mx-4 px-4 mb-4">
              {TRADITIONS.map(t => (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setActiveFilter(t)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border transition-all duration-300 ${
                    activeFilter === t
                      ? 'border-[var(--brand-primary)]/50 text-[var(--brand-primary)] bg-[var(--brand-primary-soft)]'
                      : 'border-[var(--card-border)] theme-muted bg-[var(--card-bg)]'
                  }`}
                >
                  {t === 'all' ? 'All' : TRADITION_LABELS[t]?.label ?? t}
                </motion.button>
              ))}
            </div>
          )}

          {/* Katha grid — hero portrait layout OR regular */}
          {viewParam === 'heroes' && !searchQuery ? (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-full py-16 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <BookOpen size={36} className="theme-muted opacity-40" />
                    <p className="theme-muted text-sm font-medium">No heroes found.</p>
                  </motion.div>
                ) : (
                  filtered.map((k, i) => (
                    <motion.div
                      key={k.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: (i % 8) * 0.05, type: 'spring', damping: 22, stiffness: 120 }}
                    >
                      <HeroCard katha={k} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-full py-16 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <BookOpen size={36} className="theme-muted opacity-40" />
                    <p className="theme-muted text-sm font-medium">The archive is silent. Try another keyword.</p>
                  </motion.div>
                ) : (
                  filtered.map((k, i) => (
                    <motion.div
                      key={k.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: (i % 8) * 0.05, type: 'spring', damping: 22, stiffness: 120 }}
                    >
                      <KathaCard katha={k} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function KathaCard({ katha, size = 'normal' }: { katha: Katha; size?: 'normal' | 'compact' }) {
  const trad = TRADITION_LABELS[katha.tradition] ?? TRADITION_LABELS.hindu;

  if (size === 'compact') {
    return (
      <Link href={`/bhakti/katha/${katha.id}`}>
        <motion.div
          whileTap={{ scale: 0.96 }}
          className="group relative rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col gap-3 h-[160px] justify-between transition-all duration-300 hover:border-[var(--brand-primary-soft)]"
        >
          {/* Tradition badge */}
          <div
            className="text-[9px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border self-start"
            style={{ color: trad.color, borderColor: `${trad.color}30`, background: `${trad.color}10` }}
          >
            {trad.label}
          </div>

          {/* Title */}
          <h3 className="theme-ink font-serif font-bold text-[13px] leading-snug tracking-tight line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors duration-300 flex-1">
            {katha.title}
          </h3>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold theme-muted">
            <Clock size={11} className="text-[var(--brand-primary)] opacity-50" />
            {katha.durationMin} min
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/bhakti/katha/${katha.id}`}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="group relative rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col gap-3 transition-all duration-300 hover:border-[var(--brand-primary-soft)]"
      >
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div
            className="text-[9px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border"
            style={{ color: trad.color, borderColor: `${trad.color}30`, background: `${trad.color}10` }}
          >
            {trad.label}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold theme-muted">
            <Clock size={11} className="text-[var(--brand-primary)] opacity-50" />
            {katha.durationMin}m
          </div>
        </div>

        {/* Title */}
        <h3 className="theme-ink font-serif font-bold text-[15px] leading-snug tracking-tight line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors duration-300">
          {katha.title}
        </h3>

        {/* Preview */}
        <p className="theme-muted text-[12px] leading-relaxed line-clamp-2 font-light">
          {katha.preview}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
          <span className="text-[9px] font-black uppercase tracking-[0.15em] theme-muted bg-[var(--card-bg)] px-2.5 py-1 rounded-full border border-[var(--card-border)]">
            {OCCASION_LABELS[katha.occasion] ?? katha.occasion}
          </span>
          <div className="w-7 h-7 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] flex items-center justify-center text-[var(--brand-primary)] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <ChevronRight size={14} strokeWidth={2} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── Hero portrait card — compact 2-col grid for Heroes of Bharat view ──────
function HeroCard({ katha }: { katha: Katha }) {
  const trad = TRADITION_LABELS[katha.tradition] ?? TRADITION_LABELS.hindu;
  // Extract the hero's short name — everything before the em-dash
  const shortName = katha.title.includes('—')
    ? katha.title.split('—')[0].trim()
    : katha.title;
  // Subtitle after the dash
  const subtitle = katha.title.includes('—')
    ? katha.title.split('—')[1]?.trim()
    : null;

  return (
    <Link href={`/bhakti/katha/${katha.id}`}>
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="group relative rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden flex flex-col transition-all duration-300 hover:border-[var(--brand-primary-soft)]"
      >
        {/* Portrait panel */}
        <div
          className="w-full aspect-[4/3] flex items-center justify-center text-[56px] leading-none relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${trad.color}18 0%, ${trad.color}08 100%)` }}
        >
          {/* Subtle radial glow behind portrait */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(circle at 50% 60%, ${trad.color} 0%, transparent 70%)` }}
          />
          <span className="relative z-10 drop-shadow-sm">{katha.portrait ?? '🦁'}</span>
          {/* Tradition pip */}
          <span
            className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border"
            style={{ color: trad.color, borderColor: `${trad.color}40`, background: `${trad.color}15` }}
          >
            {trad.label}
          </span>
        </div>

        {/* Info panel */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <h3 className="theme-ink font-serif font-bold text-[13px] leading-tight tracking-tight line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors duration-300">
            {shortName}
          </h3>
          {subtitle && (
            <p className="theme-muted text-[10px] leading-snug line-clamp-1 font-light">{subtitle}</p>
          )}
          <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] font-bold theme-muted">
            <Clock size={10} className="text-[var(--brand-primary)] opacity-50" />
            {katha.durationMin} min
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
