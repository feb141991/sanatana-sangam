'use client';

/**
 * ForYouSection — rule-based personalisation section on home.
 *
 * Uses tradition, sampradaya, seeking[], and life_stage to surface
 * the most relevant practice pathways for each user.
 *
 * Rules:
 *  - Hindu + seeking ritual → Nitya Karma, Panchang
 *  - Hindu + seeking wisdom → Pathshala, Gita study
 *  - Hindu shaiva/shakta → specific deities + stotras
 *  - Hindu + householder → Kul features
 *  - Hindu + seeking community → Mandali
 *  - Sikh → Nitnem, Gurbani, Ardas
 *  - Buddhist → Dhammapada, meditation
 *  - Jain → Agamas, Paryushana
 *  - All + seeker/student → quiz + dharm veer
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface ForYouItem {
  id:    string;
  emoji: string;
  title: string;
  desc:  string;
  href:  string;
}

interface Props {
  tradition?:  string | null;
  sampradaya?: string | null;
  seeking?:    string[];
  lifeStage?:  string | null;
  isDark?:     boolean;
}

function getForYouItems(
  tradition: string | null,
  sampradaya: string | null,
  seeking: string[],
  lifeStage: string | null,
): ForYouItem[] {
  const items: ForYouItem[] = [];
  const trad = tradition ?? 'hindu';

  // ── Tradition-specific base items ──────────────────────────────────────────
  if (trad === 'sikh') {
    items.push(
      { id: 'nitnem',   emoji: '📖', title: 'Nitnem Bani',      desc: 'Daily Gurbani prayers',              href: '/bhakti/stotram?tradition=sikh' },
      { id: 'ardas',    emoji: '🙏', title: 'Ardas',            desc: 'Daily supplication',                 href: '/bhakti' },
      { id: 'pathshala',emoji: '☬',  title: 'Gurbani Pathshala',desc: 'Sikh scripture study',               href: '/pathshala' },
      { id: 'mandali',  emoji: '👥', title: 'Sangat',           desc: 'Connect with your community',        href: '/mandali' },
    );
  } else if (trad === 'buddhist') {
    items.push(
      { id: 'dhamma',   emoji: '☸️', title: 'Dhammapada',       desc: "Buddha's path of wisdom",           href: '/pathshala?tradition=buddhist' },
      { id: 'meditation',emoji: '🧘',title: 'Meditation timer',  desc: 'Mindful sitting practice',          href: '/bhakti/mala' },
      { id: 'mandali',  emoji: '👥', title: 'Sangha',           desc: 'Buddhist community circle',          href: '/mandali' },
      { id: 'calendar', emoji: '📅', title: 'Lunar Calendar',   desc: 'Uposatha days & observances',        href: '/panchang' },
    );
  } else if (trad === 'jain') {
    items.push(
      { id: 'agama',    emoji: '📚', title: 'Agama Study',      desc: 'Jain canonical texts',               href: '/pathshala?tradition=jain' },
      { id: 'navkar',   emoji: '🤲', title: 'Navkar Mantra',    desc: 'Supreme prayer recitation',          href: '/bhakti/mala' },
      { id: 'paryushana',emoji: '🙏',title: 'Paryushana',       desc: 'Annual sacred days',                 href: '/vrat/paryushana' },
      { id: 'mandali',  emoji: '👥', title: 'Sangha',           desc: 'Jain community gathering',           href: '/mandali' },
    );
  } else {
    // Hindu — default + sampradaya + seeking overlays

    // Always show Japa + Panchang as base
    items.push(
      { id: 'japa',     emoji: '📿', title: 'Daily Japa',       desc: 'Mala bead mantra recitation',        href: '/bhakti/mala' },
      { id: 'panchang', emoji: '📅', title: 'Today\'s Panchang',desc: 'Tithi, Nakshatra & auspicious times',href: '/panchang' },
    );

    // Sampradaya specifics
    if (sampradaya === 'shaiva') {
      items.push({ id: 'shiva-stotra', emoji: '🔱', title: 'Shiva Stotra', desc: 'Daily Panchakshara practice', href: '/bhakti/stotram?deity=shiva' });
    } else if (sampradaya === 'vaishnava') {
      items.push({ id: 'vishnu-stotra', emoji: '🪷', title: 'Vishnu Sahasranama', desc: 'Thousand names of Vishnu', href: '/bhakti/stotram?deity=vishnu' });
    } else if (sampradaya === 'shakta') {
      items.push({ id: 'devi-stotra', emoji: '🌺', title: 'Devi Stotra', desc: 'Daily Devi worship & mantras', href: '/bhakti/stotram?deity=devi' });
    } else if (sampradaya === 'smarta') {
      items.push({ id: 'gita-study', emoji: '📖', title: 'Bhagavad Gita', desc: 'Daily verse with commentary', href: '/pathshala' });
    }
  }

  // ── Seeking overlays (cross-tradition) ────────────────────────────────────
  const seekingSet = new Set(seeking ?? []);

  if (seekingSet.has('wisdom') || seekingSet.has('study')) {
    if (!items.find(i => i.id === 'pathshala')) {
      items.push({ id: 'pathshala', emoji: '📚', title: 'Pathshala', desc: 'Sacred scripture study', href: '/pathshala' });
    }
    if (!items.find(i => i.id === 'quiz')) {
      items.push({ id: 'quiz', emoji: '🧠', title: 'Dharma Quiz', desc: 'Test your sacred knowledge', href: '/quiz' });
    }
  }

  if (seekingSet.has('community') || seekingSet.has('connection')) {
    if (!items.find(i => i.id === 'mandali')) {
      items.push({ id: 'mandali', emoji: '👥', title: 'Mandali', desc: 'Spiritual community', href: '/mandali' });
    }
  }

  if (seekingSet.has('family') || lifeStage === 'householder') {
    if (!items.find(i => i.id === 'kul')) {
      items.push({ id: 'kul', emoji: '🏡', title: 'Kul', desc: 'Family sadhana together', href: '/kul' });
    }
  }

  if (seekingSet.has('service') || seekingSet.has('karma_yoga')) {
    items.push({ id: 'seva', emoji: '🤝', title: 'Seva Hub', desc: 'Temple & cow seva', href: '/seva' });
  }

  if (seekingSet.has('pilgrimage') || seekingSet.has('tirtha')) {
    items.push({ id: 'tirtha', emoji: '🛕', title: 'Tirtha Nearby', desc: 'Sacred places near you', href: '/tirtha-map' });
  }

  // ── Life stage ─────────────────────────────────────────────────────────────
  if (lifeStage === 'student' || lifeStage === 'brahmacharya') {
    if (!items.find(i => i.id === 'quiz')) {
      items.unshift({ id: 'quiz', emoji: '🧠', title: 'Dharma Quiz', desc: 'Learn through play', href: '/quiz' });
    }
  }

  if (lifeStage === 'vanaprastha' || lifeStage === 'sannyasi') {
    if (!items.find(i => i.id === 'pathshala')) {
      items.unshift({ id: 'pathshala', emoji: '📚', title: 'Deep Study', desc: 'Advanced scripture study', href: '/pathshala' });
    }
  }

  // Return up to 4 items
  return items.slice(0, 4);
}

export default function ForYouSection({
  tradition,
  sampradaya,
  seeking = [],
  lifeStage,
  isDark = true,
}: Props) {
  const items = getForYouItems(tradition ?? null, sampradaya ?? null, seeking, lifeStage ?? null);
  if (items.length === 0) return null;

  const sectionBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.72)';
  const sectionBorder = isDark ? 'rgba(197,160,89,0.10)' : 'rgba(197,160,89,0.16)';
  const cardBg      = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,253,246,0.90)';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(197,160,89,0.14)';
  const titleColor  = isDark ? '#F0EDE6' : '#1A100A';
  const descColor   = isDark ? 'rgba(240,237,230,0.50)' : 'rgba(60,40,15,0.55)';

  return (
    <div className="px-5 mb-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: '#C5A059' }}>
          For You
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
          style={{
            color:      isDark ? '#F6E2AE' : '#A0622A',
            background: isDark ? 'rgba(247,212,132,0.12)' : 'rgba(247,212,132,0.24)',
          }}
        >
          personalised
        </span>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={item.href}
              className="flex flex-col rounded-[1.4rem] p-4 border relative overflow-hidden transition-transform active:scale-[0.97]"
              style={{ background: cardBg, borderColor: cardBorder, textDecoration: 'none' }}
            >
              {/* Ambient glow top-right */}
              <span
                className="pointer-events-none absolute top-0 right-0 w-16 h-16 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(197,160,89,0.5), transparent 70%)', transform: 'translate(30%,-30%)' }}
                aria-hidden="true"
              />

              {/* Large emoji */}
              <span
                className="drop-shadow-md mb-2.5 select-none"
                style={{ fontSize: '2.4rem', lineHeight: 1, display: 'block' }}
                aria-hidden="true"
              >
                {item.emoji}
              </span>

              <span
                className="text-sm font-bold leading-tight mb-0.5"
                style={{ color: titleColor, fontFamily: 'var(--font-serif)' }}
              >
                {item.title}
              </span>
              <span
                className="text-[10.5px] leading-snug"
                style={{ color: descColor }}
              >
                {item.desc}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
