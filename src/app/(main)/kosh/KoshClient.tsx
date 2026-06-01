'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Lock, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SACRED_RELICS, getUnlockedRelics, type Relic } from '@/lib/relics';
import PageIntro from '@/components/ui/PageIntro';

// ── Relic emoji map (used when image assets are unavailable) ────────────────
const RELIC_EMOJI: Record<string, string> = {
  // Universal
  'diya-bronze':         '🪔',
  'clay-kalash':         '🏺',
  'incense-sandalwood':  '🪷',
  'camphor-flame':       '🕯️',
  'mindful-bell':        '🔔',
  'copper-lota':         '🫙',
  'asana-kusha':         '🌿',
  'sacred-mala':         '📿',
  'shankha-conch':       '🐚',
  'prarthana-pothi':     '📖',
  'the-sage-halo':       '✨',
  // Hindu
  'ganesha-modak':       '🍡',
  'vibhuti-ash':         '🌫️',
  'trishula-gold':       '🔱',
  'krishna-flute':       '🎶',
  'rama-bow':            '🏹',
  'peacock-feather':     '🦚',
  'durga-shield':        '🛡️',
  'ananta-shesha':       '🐍',
  'tulsi-leaf':          '🌱',
  'shiva-damaru':        '🥁',
  'nandi-devotion':      '🐂',
  'brahma-lotus':        '🪷',
  'hanuman-gada':        '🏏',
  'sudarshana-chakra':   '🌀',
  'ganga-kalash':        '🏺',
  'rishi-kamandalu':     '🫙',
  'chintamani-gem':      '💎',
  // Sikh
  'steel-kara':          '⭕',
  'sacred-kirpan':       '⚔️',
  'khanda-gold':         '☬',
  'sikh-chaur':          '🌾',
  'kartarpur-nishan':    '🚩',
  'wooden-kangha':       '🪥',
  'nishan-sahib':        '🏴',
  'deg-teg':             '⚔️',
  'gurbani-pothi':       '📜',
  // Buddhist
  'lotus-bloom':         '🌸',
  'alms-bowl':           '🍵',
  'dharma-wheel-gold':   '☸️',
  'treasure-vase':       '🫙',
  'golden-fish':         '🐟',
  'bodhi-leaf':          '🍃',
  'prayer-wheel':        '☸️',
  'vajra-scepter':       '⚡',
  'parasol-royalty':     '☂️',
  // Jain
  'jain-swastika':       '🔯',
  'peacock-brush':       '🦚',
  'siddhashila-moon':    '🌙',
  'ahimsa-hand':         '🤲',
  'three-jewels':        '💎',
  'siddhachakra-wheel':  '🔵',
  'jain-kalasha':        '🏺',
};

function relicEmoji(id: string) {
  return RELIC_EMOJI[id] ?? '🔱';
}

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
  const [celebratingRelic, setCelebratingRelic] = useState<Relic | null>(null);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Search for the first unlocked relic that hasn\'t been celebrated yet
    const toCelebrate = visibleRelics.find((relic) => {
      const isUnlocked = unlockedIds.has(relic.id);
      if (!isUnlocked) return false;
      const key = `shoonaya-relic-celebrated-${relic.id}`;
      return !localStorage.getItem(key);
    });

    if (toCelebrate) {
      const key = `shoonaya-relic-celebrated-${toCelebrate.id}`;
      localStorage.setItem(key, 'true');
      setCelebratingRelic(toCelebrate);
      toast.success(`🔱 ${toCelebrate.name} unlocked!`);
    }
  }, [unlockedIds, visibleRelics]);

  useEffect(() => {
    if (!celebratingRelic) return;
    const timer = setTimeout(() => {
      setCelebratingRelic(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [celebratingRelic]);

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

  // ── Themed CSS var shorthands ────────────────────────────────────────────────
  const cardBg     = 'var(--card-bg, rgba(255,255,255,0.04))';
  const cardBorder = 'var(--card-border, rgba(255,255,255,0.08))';
  const inkColor   = 'var(--brand-ink, rgba(255,255,255,0.95))';
  const mutedColor = 'var(--text-muted-warm, rgba(255,255,255,0.5))';
  const dimColor   = 'var(--text-dim, rgba(255,255,255,0.35))';
  const goldColor  = 'var(--brand-primary, #C5A059)';

  return (
    <div className="min-h-screen" style={{ background: 'var(--divine-bg)', color: inkColor }}>
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
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm"
            style={{ border: `1px solid ${cardBorder}`, background: cardBg, color: inkColor }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl" style={{ color: inkColor }}>Sacred Kosh</h1>
            <p className="mt-1 text-sm" style={{ color: goldColor, opacity: 0.65 }}>
              {unlockedCount} of {totalVisible} relics unlocked
            </p>
          </div>
        </div>

        {nextRelic && (
          <div className="mt-6 rounded-3xl p-4 backdrop-blur-sm" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 flex items-center justify-center rounded-2xl opacity-50 grayscale" style={{ border: `1px solid ${cardBorder}`, background: cardBg, fontSize: '2.2rem' }}>
                {relicEmoji(nextRelic.id)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: goldColor, opacity: 0.7 }}>Next unlock</p>
                <h2 className="mt-1 font-serif text-lg" style={{ color: inkColor }}>{nextRelic.name}</h2>
                <p className="mt-1 text-xs" style={{ color: mutedColor }}>{getRequirementCopy(nextRelic, streak, sevaScore)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(197,160,89,0.10)' }}>
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
                  className="h-full rounded-full"
                  style={{ background: goldColor }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px]" style={{ color: dimColor }}>
                <span>{nextRelic.milestoneType === 'streak' ? `${streak}/${nextRelic.milestoneValue} days` : `${sevaScore}/${nextRelic.milestoneValue} points`}</span>
                <span>{nextRelic.milestoneType === 'streak' ? 'Streak relic' : 'Seva relic'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2 rounded-full p-1 backdrop-blur-sm" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>
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
                    className="absolute inset-0 rounded-full shadow-[0_0_0_1px_rgba(197,160,89,0.35)]"
                    style={{ background: goldColor }}
                  />
                )}
                <span className="relative" style={{ color: active ? '#1c1208' : mutedColor }}>{label}</span>
              </button>
            );
          })}
        </div>

        {filter === 'unlocked' && unlockedCount === 0 ? (
          <div className="mt-8 rounded-3xl p-8 text-center backdrop-blur-sm" style={{ border: `1px solid ${cardBorder}`, background: cardBg }}>
            <p className="font-serif text-2xl" style={{ color: inkColor }}>Your Kosh awaits 🔱</p>
            <p className="mt-2 text-sm" style={{ color: dimColor }}>Complete daily sadhana to unlock sacred relics</p>
            {nextRelic && (
              <div className="mt-6 rounded-2xl p-4 text-left" style={{ border: `1px solid ${cardBorder}`, background: 'var(--card-bg-soft, rgba(197,160,89,0.06))' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: goldColor, opacity: 0.7 }}>Next unlock</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-14 w-14 flex items-center justify-center rounded-2xl opacity-50 grayscale" style={{ border: `1px solid ${cardBorder}`, background: cardBg, fontSize: '2rem' }}>
                    {relicEmoji(nextRelic.id)}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: inkColor }}>{nextRelic.name}</p>
                    <p className="text-xs" style={{ color: dimColor }}>{getRequirementCopy(nextRelic, streak, sevaScore)}</p>
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
                    className="relative flex h-[100px] w-full items-center justify-center overflow-hidden rounded-2xl backdrop-blur-sm transition-transform hover:scale-[1.02]"
                    style={{
                      border: `1px solid ${cardBorder}`,
                      background: cardBg,
                      boxShadow: active ? `0 0 0 2px ${goldColor}` : undefined,
                    }}
                  >
                    <div
                      className={`h-16 w-16 flex items-center justify-center rounded-2xl ${unlocked ? '' : 'grayscale opacity-40'}`}
                      style={{ fontSize: '2rem' }}
                    >
                      {relicEmoji(relic.id)}
                    </div>
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.15)' }}>
                        <div className="rounded-full p-2" style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.35)' }}>
                          <Lock size={14} style={{ color: mutedColor }} />
                        </div>
                      </div>
                    )}
                    {active && (
                      <div className="absolute top-2 right-2 rounded-full p-1" style={{ background: goldColor }}>
                        <Star size={10} className="fill-black text-black" />
                      </div>
                    )}
                  </button>
                  <p className="mt-2 text-center text-xs font-medium" style={{ color: unlocked ? inkColor : dimColor }}>
                    {relic.name}
                  </p>
                  {lockedHintId === relic.id && !unlocked && (
                    <div
                      className="absolute inset-x-0 -top-10 z-10 rounded-xl px-3 py-2 text-center text-[11px] shadow-2xl"
                      style={{ border: `1px solid ${cardBorder}`, background: 'var(--card-bg, #161617)', color: mutedColor }}
                    >
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
              className="w-full rounded-t-[2rem] p-5 backdrop-blur-sm"
              style={{ border: `1px solid ${cardBorder}`, background: 'var(--divine-bg)' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full" style={{ background: cardBorder }} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-2xl" style={{ color: inkColor }}>{selectedRelic.name}</p>
                  <p className="mt-2 text-sm" style={{ color: mutedColor }}>
                    {selectedRelic.milestoneType === 'streak'
                      ? `${selectedRelic.milestoneValue}-day streak required`
                      : `${selectedRelic.milestoneValue} seva points required`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRelic(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ border: `1px solid ${cardBorder}`, background: cardBg, color: inkColor }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-6 flex justify-center">
                <div
                  className="h-[120px] w-[120px] flex items-center justify-center rounded-[2rem]"
                  style={{ border: `1px solid ${cardBorder}`, background: cardBg, fontSize: '4rem' }}
                >
                  {relicEmoji(selectedRelic.id)}
                </div>
              </div>
              <p className="mt-4 mb-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{selectedRelic.lore}</p>
              <div className="mt-6">
                {activeRelicId === selectedRelic.id ? (
                  <div
                    className="w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                    style={{ border: `1px solid rgba(197,160,89,0.25)`, background: 'rgba(197,160,89,0.10)', color: goldColor }}
                  >
                    Currently Active ✓
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setActiveRelic(selectedRelic)}
                    className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-60"
                    style={{ background: goldColor }}
                  >
                    {saving ? 'Saving…' : 'Set as Active Symbol'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {celebratingRelic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/75 px-6 text-center cursor-pointer"
            onClick={() => setCelebratingRelic(null)}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col items-center justify-center"
            >
              <div style={{ fontSize: '5rem', marginBottom: '1.5rem', lineHeight: 1 }}>
                {relicEmoji(celebratingRelic.id)}
              </div>
              <h2 className="font-serif text-2xl font-bold" style={{ color: goldColor }}>
                {celebratingRelic.name}
              </h2>
              <p className="mt-2 text-xs uppercase tracking-widest font-semibold" style={{ color: dimColor }}>
                Unlocked
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
