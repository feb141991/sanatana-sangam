'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Lock, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SACRED_RELICS, getUnlockedRelics, type Relic } from '@/lib/relics';
import PageIntro from '@/components/ui/PageIntro';

type FilterMode = 'all' | 'unlocked' | 'locked';

function getRequirementCopy(relic: Relic, streak: number, sevaScore: number) {
  if (relic.milestoneType === 'streak') {
    const remaining = Math.max(0, relic.milestoneValue - streak);
    return `Need ${remaining} more ${remaining === 1 ? 'day' : 'days'}`;
  }
  const remaining = Math.max(0, relic.milestoneValue - sevaScore);
  return `Need ${remaining} more points`;
}

export default function KoshClient({
  streak,
  sevaScore,
  tradition,
  activeSymbolId,
  userId,
}: {
  streak: number;
  sevaScore: number;
  tradition: string;
  activeSymbolId: string | null;
  userId: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null);
  const [activeRelicId, setActiveRelicId] = useState(activeSymbolId);
  const [lockedHintId, setLockedHintId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visibleRelics = useMemo(
    () => SACRED_RELICS.filter((relic) => relic.tradition === 'universal' || relic.tradition === tradition),
    [tradition],
  );
  const unlockedRelics = useMemo(
    () => getUnlockedRelics(streak, sevaScore, tradition),
    [streak, sevaScore, tradition],
  );
  const unlockedIds = useMemo(() => new Set(unlockedRelics.map((relic) => relic.id)), [unlockedRelics]);
  const unlockedCount = unlockedRelics.length;
  const totalVisible = visibleRelics.length;
  const nextRelic = visibleRelics.find((relic) => !unlockedIds.has(relic.id)) ?? null;

  const filteredRelics = useMemo(() => {
    if (filter === 'unlocked') return visibleRelics.filter((relic) => unlockedIds.has(relic.id));
    if (filter === 'locked') return visibleRelics.filter((relic) => !unlockedIds.has(relic.id));
    return visibleRelics;
  }, [filter, unlockedIds, visibleRelics]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('shoonaya_last_seen_relic_count', String(unlockedCount));
  }, [unlockedCount]);

  async function setActiveRelic(relic: Relic) {
    if (saving || activeRelicId === relic.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_symbol_id: relic.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error ?? 'Could not set active symbol');
        return;
      }
      setActiveRelicId(relic.id);
      toast.success(`${relic.name} set as active symbol ✨`);
    } catch (error) {
      console.error('Failed to set active relic', error);
      toast.error('Could not set active symbol');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-white/90">
      <PageIntro
        pageKey="kosh"
        steps={[
          { emoji: '🔱', title: 'Your Sacred Kosh', body: 'Relics you unlock through daily practice. Each represents a spiritual milestone.' },
          { emoji: '✨', title: 'Equip a Relic', body: 'Tap any unlocked relic to equip it. Your active relic appears across the app.' },
          { emoji: '🎯', title: 'Keep earning', body: 'Build your streak and seva score to unlock rarer, more powerful relics.' },
        ]}
      />
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl text-white/95">Sacred Kosh</h1>
            <p className="mt-1 text-sm text-[#C5A059]/60">{unlockedCount} of {totalVisible} relics unlocked</p>
          </div>
        </div>

        {nextRelic && (
          <div className="mt-6 rounded-3xl border border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/[0.06] opacity-50 grayscale">
                <Image src={nextRelic.imageUrl} alt={nextRelic.name} fill sizes="64px" className="object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A059]/70">Next unlock</p>
                <h2 className="mt-1 font-serif text-lg text-white/95">{nextRelic.name}</h2>
                <p className="mt-1 text-xs text-white/50">{getRequirementCopy(nextRelic, streak, sevaScore)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        nextRelic.milestoneType === 'streak'
                          ? (streak / nextRelic.milestoneValue) * 100
                          : (sevaScore / nextRelic.milestoneValue) * 100,
                      ),
                    )}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                  className="h-full rounded-full bg-[#C5A059]"
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-white/45">
                <span>{nextRelic.milestoneType === 'streak' ? `${streak}/${nextRelic.milestoneValue} days` : `${sevaScore}/${nextRelic.milestoneValue} points`}</span>
                <span>{nextRelic.milestoneType === 'streak' ? 'Streak relic' : 'Seva relic'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] p-1 backdrop-blur-sm">
          {([
            ['all', 'All'],
            ['unlocked', 'Unlocked'],
            ['locked', 'Locked'],
          ] as const).map(([value, label]) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className="relative flex-1 rounded-full px-4 py-2 text-sm font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="kosh-filter-pill"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="absolute inset-0 rounded-full bg-[#C5A059] shadow-[0_0_0_1px_rgba(197,160,89,0.35)]"
                  />
                )}
                <span className={`relative ${active ? 'text-black' : 'text-white/65'}`}>{label}</span>
              </button>
            );
          })}
        </div>

        {filter === 'unlocked' && unlockedCount === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/[0.06] bg-white/[0.04] p-8 text-center backdrop-blur-sm">
            <p className="font-serif text-2xl text-white/90">Your Kosh awaits 🔱</p>
            <p className="mt-2 text-sm text-white/45">Complete daily sadhana to unlock sacred relics</p>
            {nextRelic && (
              <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A059]/70">Next unlock</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/[0.06] opacity-50 grayscale">
                    <Image src={nextRelic.imageUrl} alt={nextRelic.name} fill sizes="56px" className="object-contain" />
                  </div>
                  <div>
                    <p className="font-medium text-white/90">{nextRelic.name}</p>
                    <p className="text-xs text-white/45">{getRequirementCopy(nextRelic, streak, sevaScore)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {filteredRelics.map((relic) => {
              const unlocked = unlockedIds.has(relic.id);
              const active = activeRelicId === relic.id;
              const requirementCopy = getRequirementCopy(relic, streak, sevaScore);
              return (
                <div key={relic.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (unlocked) {
                        setSelectedRelic(relic);
                        setLockedHintId(null);
                        return;
                      }
                      setLockedHintId((current) => current === relic.id ? null : relic.id);
                    }}
                    className="relative flex h-[100px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm transition-transform hover:scale-[1.02]"
                    style={active ? { boxShadow: '0 0 0 2px rgba(197,160,89,0.8)' } : undefined}
                  >
                    <div className={`relative h-16 w-16 ${unlocked ? '' : 'grayscale opacity-40'}`}>
                      <Image src={relic.imageUrl} alt={relic.name} fill sizes="64px" className="object-contain" />
                    </div>
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                        <div className="rounded-full border border-white/10 bg-black/35 p-2">
                          <Lock size={14} className="text-white/70" />
                        </div>
                      </div>
                    )}
                    {active && (
                      <div className="absolute top-2 right-2 rounded-full bg-[#C5A059] p-1">
                        <Star size={10} className="fill-black text-black" />
                      </div>
                    )}
                  </button>
                  <p className={`mt-2 text-center text-xs font-medium ${unlocked ? 'text-white/85' : 'text-white/35'}`}>{relic.name}</p>
                  {lockedHintId === relic.id && !unlocked && (
                    <div className="absolute inset-x-0 -top-10 z-10 rounded-xl border border-white/[0.06] bg-[#161617] px-3 py-2 text-center text-[11px] text-white/70 shadow-2xl">
                      {requirementCopy}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedRelic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-end bg-black/60"
            onClick={() => setSelectedRelic(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="w-full rounded-t-[2rem] border border-white/[0.06] bg-[#121214] p-5 backdrop-blur-sm"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/10" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-2xl text-white/95">{selectedRelic.name}</p>
                  <p className="mt-2 text-sm text-white/50">
                    {selectedRelic.milestoneType === 'streak'
                      ? `${selectedRelic.milestoneValue}-day streak required`
                      : `${selectedRelic.milestoneValue} seva points required`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRelic(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04]"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-6 flex justify-center">
                <div className="relative h-[120px] w-[120px] overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.04]">
                  <Image src={selectedRelic.imageUrl} alt={selectedRelic.name} fill sizes="120px" className="object-contain" />
                </div>
              </div>
              <p className="mt-6 text-sm leading-6 text-white/75">{selectedRelic.description}</p>
              <div className="mt-6">
                {activeRelicId === selectedRelic.id ? (
                  <div className="w-full rounded-2xl border border-[#C5A059]/25 bg-[#C5A059]/10 px-4 py-3 text-center text-sm font-semibold text-[#C5A059]">
                    Currently Active ✓
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setActiveRelic(selectedRelic)}
                    className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-60"
                    style={{ background: '#C5A059' }}
                  >
                    {saving ? 'Saving…' : 'Set as Active Symbol'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
