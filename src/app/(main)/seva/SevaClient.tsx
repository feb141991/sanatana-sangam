'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ExternalLink, Heart, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { createClient } from '@/lib/supabase';
import { getTraditionMeta } from '@/lib/tradition-config';

type SevaLink = {
  title: string;
  description: string;
  url: string;
  emoji: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain';
};

type SevaType =
  | 'Annadaan'
  | 'Gau Seva'
  | 'Shram Daan'
  | 'Daan'
  | 'Rakt Daan'
  | 'Vriksha Ropan'
  | 'Other';

const SEVA_TYPES: SevaType[] = [
  'Annadaan',
  'Gau Seva',
  'Shram Daan',
  'Daan',
  'Rakt Daan',
  'Vriksha Ropan',
  'Other',
];

const SEVA_LINKS: SevaLink[] = [
  {
    tradition: 'hindu',
    title: 'Kamdhenu Gaushala',
    description: 'Support Gau Seva through direct care, fodder, and shelter contributions.',
    url: 'https://www.kamdhenufoods.com/gaushala',
    emoji: '🐄',
  },
  {
    tradition: 'hindu',
    title: 'Akshaya Patra Annadaan',
    description: 'Fund daily meals for children and families through a large-scale annadaan initiative.',
    url: 'https://www.akshayapatra.org',
    emoji: '🍲',
  },
  {
    tradition: 'hindu',
    title: 'Kashi Vishwanath Trust',
    description: 'Contribute toward seva and temple support at Kashi Vishwanath Dham.',
    url: 'https://shrikashivishwanath.org',
    emoji: '🛕',
  },
  {
    tradition: 'hindu',
    title: 'Tirumala Tirupati Devasthanams',
    description: 'Offer dana and support temple services through the official TTD portal.',
    url: 'https://tirupatibalaji.ap.gov.in',
    emoji: '🙏',
  },
  {
    tradition: 'hindu',
    title: 'Char Dham Seva',
    description: 'Support yatri facilities and dharmic upkeep across the Char Dham circuit.',
    url: 'https://badrinath-kedarnath.gov.in',
    emoji: '🏔️',
  },
  {
    tradition: 'sikh',
    title: 'SGPC Darbar Sahib Seva',
    description: 'Support langar, maintenance, and seva linked to Sri Harmandir Sahib.',
    url: 'https://sgpc.net/dasvandh/',
    emoji: '☬',
  },
  {
    tradition: 'sikh',
    title: 'Pingalwara Trust',
    description: 'Serve those in need through medical, shelter, and humanitarian seva.',
    url: 'https://pingalwara.org',
    emoji: '🫶',
  },
  {
    tradition: 'sikh',
    title: 'Khalsa Aid',
    description: 'Support disaster relief and humanitarian seva rooted in Sikh values.',
    url: 'https://www.khalsaaid.org',
    emoji: '🌍',
  },
  {
    tradition: 'sikh',
    title: 'Guru Nanak Nishkam Sewak Jatha',
    description: 'Contribute to education, langar, and community seva projects.',
    url: 'https://www.nishkamswat.org',
    emoji: '🍛',
  },
  {
    tradition: 'buddhist',
    title: 'Buddhist Society of India',
    description: 'Support Buddhist learning, practice, and community service initiatives.',
    url: 'https://www.buddhistsocietyofindia.org',
    emoji: '☸️',
  },
  {
    tradition: 'buddhist',
    title: 'Nalanda Trust',
    description: 'Help sustain Buddhist education and preservation work inspired by Nalanda.',
    url: 'https://www.nalanda.org.my',
    emoji: '📚',
  },
  {
    tradition: 'buddhist',
    title: 'Dr. Ambedkar Foundation',
    description: 'Support educational and social work aligned with Dhamma-based uplift.',
    url: 'https://ambedkarfoundation.nic.in',
    emoji: '🕊️',
  },
  {
    tradition: 'jain',
    title: 'Jain Vishwa Bharati',
    description: 'Support Jain learning, ahimsa work, and spiritual education initiatives.',
    url: 'https://www.jvbharati.org',
    emoji: '🤲',
  },
  {
    tradition: 'jain',
    title: 'Paryushana Seva Fund',
    description: 'Contribute to Jain seva and community support around Paryushana observance.',
    url: 'https://jainsocialgroup.org',
    emoji: '🌿',
  },
];

function isKnownTradition(value: string): value is 'hindu' | 'sikh' | 'buddhist' | 'jain' {
  return value === 'hindu' || value === 'sikh' || value === 'buddhist' || value === 'jain';
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function traditionTag(tradition: SevaLink['tradition']) {
  switch (tradition) {
    case 'hindu':
      return 'Hindu';
    case 'sikh':
      return 'Sikh';
    case 'buddhist':
      return 'Buddhist';
    case 'jain':
      return 'Jain';
  }
}

export default function SevaClient({
  userId,
  userName,
  tradition,
}: {
  userId: string;
  userName: string;
  tradition: string;
}) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const meta = getTraditionMeta(tradition);

  const [sevaType, setSevaType] = useState<SevaType>('Annadaan');
  const [note, setNote] = useState('');
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sevaLinks = useMemo(() => {
    if (!isKnownTradition(tradition)) {
      return SEVA_LINKS;
    }
    return SEVA_LINKS.filter((link) => link.tradition === tradition);
  }, [tradition]);

  useEffect(() => {
    let cancelled = false;

    async function loadMonthlyCount() {
      setLoadingCount(true);
      try {
        const { startIso, endIso } = monthRange();
        const { count, error } = await supabase
          .from('seva_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('logged_at', startIso)
          .lt('logged_at', endIso);

        if (error) throw error;
        if (!cancelled) setMonthlyCount(count ?? 0);
      } catch (error) {
        console.error('[seva] failed to load monthly count', error);
        if (!cancelled) setMonthlyCount(0);
      } finally {
        if (!cancelled) setLoadingCount(false);
      }
    }

    void loadMonthlyCount();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  async function handleLogSeva(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const trimmedNote = note.trim().slice(0, 100);

    try {
      const { error } = await supabase.from('seva_log').insert({
        user_id: userId,
        seva_type: sevaType,
        note: trimmedNote || null,
        logged_at: new Date().toISOString(),
      });

      if (error) throw error;
      setMonthlyCount((current) => current + 1);
      setNote('');
      setSevaType('Annadaan');
      toast.success('Seva logged for today.');
    } catch (error) {
      console.error('[seva] failed to persist seva log', error);
      toast.error('Could not log seva right now. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="divine-home-shell pb-28 relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${meta.accentColour}05 0%, transparent 100%)` }}
    >
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${meta.accentColour}08, transparent 60%)`, filter: 'blur(40px)' }}
      />

      <section className="relative z-10 px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm motion-press mb-6"
          style={{ background: `${meta.accentColour}12`, border: `1px solid ${meta.accentColour}25` }}
        >
          <ChevronLeft size={20} style={{ color: meta.accentColour }} />
        </button>

        <motion.div
          className="divine-darshan-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="divine-card-motif divine-card-motif-large"
            aria-hidden="true"
            style={{ background: `radial-gradient(circle at center, ${meta.accentColour}15, transparent 70%)` }}
          />

          <div className="relative z-10 space-y-6 py-6">
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl"
                style={{ background: `${meta.accentColour}15`, border: `1px solid ${meta.accentColour}30` }}
              >
                {meta.symbol}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: meta.accentColour }}>
                  Seva Hub
                </p>
                <h1 className="divine-darshan-title text-3xl">{meta.label} Seva Hub</h1>
                <p className="divine-card-copy max-w-md mx-auto text-sm leading-relaxed">
                  Direct seva paths, a personal seva log, and a monthly view of your dharmic acts.
                  {userName ? ` ${userName}, keep this practical.` : ''}
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Heart size={16} style={{ color: meta.accentColour }} />
                <h2 className="text-sm font-semibold theme-ink">Direct Seva</h2>
              </div>

              <div className="space-y-3">
                {sevaLinks.map((link) => (
                  <a
                    key={`${link.tradition}-${link.title}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-panel rounded-[1.4rem] border border-white/10 p-4 flex items-start gap-3 transition hover:bg-white/[0.05]"
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${meta.accentColour}12`, border: `1px solid ${meta.accentColour}24` }}
                    >
                      {link.emoji}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold theme-ink">{link.title}</p>
                        {!isKnownTradition(tradition) && (
                          <span
                            className="divine-chip text-[9px]"
                            style={{ background: `${meta.accentColour}16`, color: meta.accentColour }}
                          >
                            {traditionTag(link.tradition)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed theme-dim">{link.description}</p>
                    </div>
                    <ExternalLink size={16} className="shrink-0 mt-1" style={{ color: meta.accentColour }} />
                  </a>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkles size={16} style={{ color: meta.accentColour }} />
                <h2 className="text-sm font-semibold theme-ink">Log a Seva today</h2>
              </div>

              <form onSubmit={handleLogSeva} className="glass-panel rounded-[1.6rem] border border-white/10 p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.accentColour }}>
                    Seva Type
                  </label>
                  <select
                    value={sevaType}
                    onChange={(event) => setSevaType(event.target.value as SevaType)}
                    className="w-full rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/10 text-sm theme-ink outline-none"
                  >
                    {SEVA_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: meta.accentColour }}>
                    Note
                  </label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, 100))}
                    maxLength={100}
                    rows={3}
                    placeholder="Optional note about today&apos;s seva."
                    className="w-full rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/10 text-sm theme-ink outline-none resize-none"
                  />
                  <p className="text-[11px] theme-dim text-right">{note.length}/100</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full py-3 text-sm font-bold transition disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${meta.accentColour}, ${meta.accentColour}dd)`, color: '#111' }}
                >
                  {submitting ? 'Logging…' : 'Log Seva'}
                </button>

                <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: `${meta.accentColour}0d`, border: `1px solid ${meta.accentColour}20` }}>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: meta.accentColour }}>
                      This Month
                    </p>
                    <p className="text-sm theme-ink">
                      {loadingCount ? 'Loading…' : `${monthlyCount} seva ${monthlyCount === 1 ? 'log' : 'logs'}`}
                    </p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: `${meta.accentColour}14`, color: meta.accentColour }}
                  >
                    ✦
                  </div>
                </div>
              </form>
            </section>

            <section
              className="glass-panel rounded-[1.6rem] border border-white/10 p-4 flex items-center justify-between gap-4"
              style={{ background: `linear-gradient(135deg, ${meta.accentColour}10, transparent)` }}
            >
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: meta.accentColour }}>
                  Dharmic Impact
                </p>
                <p className="text-sm font-semibold theme-ink">
                  Your seva this month: {loadingCount ? '…' : monthlyCount} acts of dharma
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${meta.accentColour}14`, border: `1px solid ${meta.accentColour}24` }}
              >
                🙏
              </div>
            </section>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
