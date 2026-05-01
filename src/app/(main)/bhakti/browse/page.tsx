'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, BookOpen } from 'lucide-react';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { STOTRAMS, DEITY_META, MOOD_META } from '@/lib/stotrams';
import { Suspense } from 'react';

const TYPE_LABELS: Record<string, string> = {
  mantra: 'Mantra', stotram: 'Stotram', kirtan: 'Kirtan',
  bhajan: 'Bhajan', dhyana: 'Dhyana', simran: 'Simran',
};

const TRADITION_LABELS: Record<string, string> = {
  hindu: 'Hindu', sikh: 'Sikh', buddhist: 'Buddhist', jain: 'Jain', all: 'All',
};

const DEITIES = Object.entries(DEITY_META).map(([id, m]) => ({ id, ...m }));
const MOODS   = Object.entries(MOOD_META).map(([id, m]) => ({ id, ...m }));
const TYPES   = Object.entries(TYPE_LABELS).map(([id, label]) => ({ id, label }));

function BrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';

  const [deity,  setDeity]  = useState<string>(searchParams.get('deity') ?? 'all');
  const [mood,   setMood]   = useState<string>(searchParams.get('mood')  ?? 'all');
  const [type,   setType]   = useState<string>('all');

  // ── Tokens ──────────────────────────────────────────────────────────────────
  const pageBg  = isDark ? '#110a06' : '#fdf6ee';
  const cardBg  = isDark ? 'rgba(28,18,10,0.9)' : 'rgba(255,244,228,0.97)';
  const cardBdr = isDark ? 'rgba(200,146,74,0.12)' : 'rgba(180,110,30,0.14)';
  const pillIn  = isDark ? 'rgba(28,18,10,0.7)'  : 'rgba(235,215,185,0.8)';
  const pillInB = isDark ? 'rgba(200,146,74,0.10)': 'rgba(180,120,40,0.18)';
  const pillAct = 'rgba(200,146,74,0.16)';
  const pillActB= 'rgba(200,146,74,0.40)';
  const textH   = isDark ? '#f5dfa0' : '#2a1002';
  const textS   = isDark ? 'rgba(245,210,130,0.48)' : 'rgba(100,55,10,0.52)';
  const textD   = isDark ? 'rgba(245,210,130,0.32)' : 'rgba(100,55,10,0.38)';
  const amber   = '#C8924A';

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return STOTRAMS.filter(s => {
      const deityOk  = deity === 'all' || s.deity === deity || s.deity === 'universal';
      const moodOk   = mood === 'all';  // mood filtering not in stotrams data yet — show all
      const typeOk   = type === 'all' || s.type === type;
      return deityOk && moodOk && typeOk;
    });
  }, [deity, mood, type]);

  function PillRow<T extends { id: string; label?: string; emoji?: string }>({
    items, active, onSelect, title,
  }: { items: T[]; active: string; onSelect: (id: string) => void; title: string }) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: textD }}>{title}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[{ id: 'all', label: 'All', emoji: '✨' } as T, ...items].map(item => {
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => onSelect(item.id)}
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap"
                style={{ background: isActive ? pillAct : pillIn, border: `1px solid ${isActive ? pillActB : pillInB}`, color: isActive ? '#f5dfa0' : textS }}>
                {'emoji' in item && item.emoji ? `${item.emoji} ` : ''}{item.label ?? item.id}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: pageBg }}>
      {/* Header */}
      <div style={{ height: 'max(env(safe-area-inset-top,0px),16px)' }} />
      <div className="flex items-center gap-3 px-4 pb-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.18)' }}>
          <ChevronLeft size={18} style={{ color: amber }} />
        </button>
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: textH }}>Sacred Library</h1>
          <p className="text-[11px]" style={{ color: textS }}>Mantras, stotrams & bhajans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 space-y-3 mb-4 rounded-[1.5rem] mx-4 py-4"
        style={{ background: isDark ? 'rgba(18,12,8,0.9)' : 'rgba(255,245,228,0.95)', border: `1px solid ${cardBdr}` }}>
        <PillRow
          items={DEITIES.map(d => ({ id: d.id, label: d.label, emoji: d.emoji }))}
          active={deity} onSelect={setDeity} title="Deity" />
        <PillRow
          items={TYPES.map(t => ({ id: t.id, label: t.label }))}
          active={type} onSelect={setType} title="Type" />
        <PillRow
          items={MOODS.map(m => ({ id: m.id, label: m.label, emoji: m.emoji }))}
          active={mood} onSelect={setMood} title="Mood" />
      </div>

      {/* Results count */}
      <div className="px-4 mb-3">
        <p className="text-[11px]" style={{ color: textD }}>{filtered.length} track{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Track cards */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🙏</p>
            <p className="text-sm" style={{ color: textS }}>No tracks match these filters</p>
            <button onClick={() => { setDeity('all'); setMood('all'); setType('all'); }}
              className="mt-4 text-xs font-semibold" style={{ color: amber }}>
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((stotram, i) => {
            const deity = DEITY_META[stotram.deity] ?? DEITY_META.universal;
            return (
              <motion.div key={stotram.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}>
                <div className="rounded-[1.5rem] p-4 relative overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${deity.color}22` }}>
                  {/* Color accent strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.5rem]"
                    style={{ background: deity.color, opacity: 0.6 }} />

                  <div className="flex items-start gap-3 pl-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{stotram.deityEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight" style={{ color: textH }}>{stotram.title}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: deity.color }}>{stotram.titleDevanagari}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                            style={{ background: `${deity.color}18`, color: deity.color }}>
                            {TYPE_LABELS[stotram.type] ?? stotram.type}
                          </span>
                          {stotram.verses.length > 1 && (
                            <span className="text-[9px]" style={{ color: textD }}>{stotram.verses.length} verses</span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] mt-2 leading-relaxed line-clamp-2" style={{ color: textS }}>
                        {stotram.description}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/bhakti/stotram/${stotram.id}`}
                          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                          style={{ background: `${deity.color}18`, border: `1px solid ${deity.color}30`, color: deity.color }}>
                          <BookOpen size={11} /> Read
                        </Link>
                        {stotram.audioTrackId && (
                          <Link href={`/bhakti/stotram/${stotram.id}?autoplay=1`}
                            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                            style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.22)', color: amber }}>
                            <Play size={11} /> Listen
                          </Link>
                        )}
                        <span className="ml-auto text-[10px]" style={{ color: textD }}>
                          {TRADITION_LABELS[stotram.tradition] ?? stotram.tradition}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-2xl">🙏</span></div>}>
      <BrowseInner />
    </Suspense>
  );
}
