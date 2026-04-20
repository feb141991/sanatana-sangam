'use client';

// ─── Sanatana Sangam — Landing Page ──────────────────────────────────────────
// Full animation style landing — dharma first, no politics, no "free forever"
// Framer-motion scroll reveals, ambient background, PWA install CTA.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence, useScroll, useTransform, type Variants } from 'framer-motion';
import {
  Users, MapPin, BookOpen, Heart, Star, ArrowRight,
  Flame, Mic, Sparkles, Download, Smartphone, ChevronDown,
} from 'lucide-react';
import BrandMark from '@/components/BrandMark';

// ─── Rotating hero verses ─────────────────────────────────────────────────────
const HERO_VERSES = [
  { original: 'धर्मो रक्षति रक्षितः',     translit: 'Dharmo rakṣati rakṣitaḥ',   meaning: 'Dharma protected, protects.' },
  { original: 'सर्वे भवन्तु सुखिनः',       translit: 'Sarve bhavantu sukhinaḥ',    meaning: 'May all beings be happy.' },
  { original: 'वसुधैव कुटुम्बकम्',          translit: 'Vasudhaiva kuṭumbakam',       meaning: 'The world is one family.' },
  { original: 'तमसो मा ज्योतिर्गमय',       translit: 'Tamaso mā jyotirgamaya',     meaning: 'Lead me from darkness to light.' },
  { original: 'एकं सत् विप्रा बहुधा वदन्ति', translit: 'Ekaṃ sat viprā bahudhā vadanti', meaning: 'Truth is one; the wise call it by many names.' },
];

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    emoji: '🕉️',
    title: 'Nitya Karma',
    desc:  'Your personalised morning sadhana sequence — Brahma Muhurta to aarti — guided by the panchang.',
    accent: '#d4a645',
  },
  {
    emoji: '📿',
    title: 'Japa & Dhyana',
    desc:  'Digital mala with mantra audio, bead counting, and streak tracking for your daily practice.',
    accent: '#c87941',
  },
  {
    emoji: '🎓',
    title: 'Pathshala',
    desc:  'Guided scripture paths — Bhagavad Gita, Upanishads, Yoga Sutras — with AI voice scoring.',
    accent: '#8b6914',
  },
  {
    emoji: '👨‍👩‍👧‍👦',
    title: 'Kul & Mandali',
    desc:  'Your family spiritual tree and local satsang community — connected across generations.',
    accent: '#5c7a3e',
  },
  {
    emoji: '🗺️',
    title: 'Tirtha Map',
    desc:  'Discover mandirs, pandits, and events near you — anywhere in the world.',
    accent: '#7a5c9e',
  },
  {
    emoji: '✨',
    title: 'Dharma Mitra',
    desc:  'AI companion rooted in shastra — ask anything about dharma, life, and practice.',
    accent: '#4a8fa8',
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Sanatani Worldwide',   value: '1.2B+' },
  { label: 'Diaspora Communities', value: '100+'  },
  { label: 'Traditions Welcomed',  value: 'All'   },
  { label: 'Supported Languages',  value: '12+'   },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote:  'Finally — a place where I can find a local satsang group AND debate Advaita Vedanta.',
    name:   'Priya M.',
    city:   'Leicester, UK',
    emoji:  '🪷',
  },
  {
    quote:  "As a second-generation Hindu in Toronto, I'd lost my connection. Sanatana Sangam brought it back.",
    name:   'Arjun S.',
    city:   'Toronto, Canada',
    emoji:  '🦚',
  },
  {
    quote:  'The Tirtha Map found a mandir five minutes from my house I never knew existed.',
    name:   'Meera K.',
    city:   'Sydney, Australia',
    emoji:  '⚔️',
  },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Ambient star field ───────────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 48 }, (_, i) => {
    let x = i * 2083;
    x = ((x * 1664525 + 1013904223) & 0x7fffffff) % 10000 / 100;
    let y = ((i * 6364136223846793005 + 1442695040888963407) & 0x7fffffff) % 10000 / 100;
    const size = (i % 3) + 1;
    const delay = (i * 0.37) % 4;
    return { x, y, size, delay };
  });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top:  `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: 0.3 + (i % 5) * 0.07,
            animation: `twinkle ${2.5 + s.delay}s ease-in-out infinite alternate`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle { from { opacity: 0.08 } to { opacity: 0.7 } }
        @keyframes floatY  { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-18px) } }
        @keyframes spin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── Rotating verse display ───────────────────────────────────────────────────
function RotatingVerse() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HERO_VERSES.length), 4000);
    return () => clearInterval(t);
  }, []);
  const v = HERO_VERSES[idx];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="text-2xl md:text-3xl font-bold"
          style={{ color: '#f0c040', fontFamily: 'var(--font-deva, serif)' }}>
          {v.original}
        </p>
        <p className="text-sm text-amber-200/70 mt-1 italic">{v.translit}</p>
        <p className="text-xs text-white/50 mt-1">{v.meaning}</p>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── PWA install hook ─────────────────────────────────────────────────────────
function usePwaInstall() {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  };

  return { canInstall: !!prompt && !installed, installed, install };
}

// ─── Section wrapper with scroll reveal ──────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref  = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.section
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={seen ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const { canInstall, install } = usePwaInstall();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale   = useTransform(scrollY, [0, 500], [1, 1.04]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0e0b07]">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 px-4 pt-3">
        <div className="max-w-6xl mx-auto px-4 h-14 rounded-2xl flex items-center justify-between"
          style={{ background: 'rgba(20,14,6,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,166,70,0.18)' }}>
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="font-bold text-base text-amber-100">
              Sanatana <span style={{ color: '#d4a645' }}>Sangam</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-amber-200/70 hover:text-amber-100 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/signup"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #d4a645, #a07830)', color: '#1c1008' }}>
              Join Free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ opacity: heroOpacity }}
        className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-8 pb-24"
      >
        {/* Background */}
        <motion.div
          style={{ scale: heroScale }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(140,90,10,0.22) 0%, transparent 70%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 30% 70%, rgba(90,50,120,0.12) 0%, transparent 60%)' }} />
          <StarField />
        </motion.div>

        {/* Floating Om symbol */}
        <div
          className="absolute text-[14rem] font-bold select-none pointer-events-none"
          style={{
            color: 'rgba(212,166,70,0.04)',
            top: '10%', right: '5%',
            animation: 'floatY 8s ease-in-out infinite, spin 60s linear infinite',
            fontFamily: 'serif',
          }}
          aria-hidden
        >
          ॐ
        </div>

        {/* Content */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          {/* Chip */}
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 border"
              style={{ background: 'rgba(212,166,70,0.10)', borderColor: 'rgba(212,166,70,0.25)', color: '#d4a645' }}>
              <Sparkles size={13} />
              The Global Home for Sanatani Worldwide
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp} custom={1}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white"
          >
            Your dharma deserves
            <br />
            <span style={{ background: 'linear-gradient(135deg, #f0c040, #d4a645, #a07830)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              a real home.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-amber-100/60 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            A living digital sabha — where sadhana, scripture, community, and seva
            come together for Sanatani families around the world.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #d4a645, #a07830)', color: '#1c1008' }}>
              <Heart size={18} /> Begin Your Journey
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(212,166,70,0.3)', color: '#d4a645' }}>
              Sign In
            </Link>
          </motion.div>

          {/* Rotating verse */}
          <motion.div
            variants={fadeUp} custom={4}
            className="rounded-2xl border px-6 py-5 mx-auto max-w-md"
            style={{ background: 'rgba(212,166,70,0.06)', borderColor: 'rgba(212,166,70,0.15)' }}
          >
            <p className="text-[10px] uppercase tracking-widest text-amber-400/50 font-semibold mb-3">From the Shastra</p>
            <RotatingVerse />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-amber-400/30"
        >
          <span className="text-[10px] uppercase tracking-widest">Discover</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── STATS ── */}
      <Section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp} custom={i}
              className="rounded-2xl p-5 text-center border"
              style={{ background: 'rgba(212,166,70,0.06)', borderColor: 'rgba(212,166,70,0.12)' }}
            >
              <div className="text-3xl font-bold mb-1"
                style={{ background: 'linear-gradient(135deg, #f0c040, #a07830)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </div>
              <div className="text-xs text-amber-100/50">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Six pillars of your{' '}
            <span style={{ background: 'linear-gradient(135deg, #f0c040, #d4a645)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              digital tirtha
            </span>
          </h2>
          <p className="text-amber-100/50 max-w-xl mx-auto">
            Everything a Sanatani needs — sadhana, scripture, community, and connection.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp} custom={i}
              whileHover={{ scale: 1.02, y: -4 }}
              className="rounded-2xl border p-5 cursor-default transition-shadow hover:shadow-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: `${f.accent}22`,
              }}
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-amber-100/50 leading-relaxed">{f.desc}</p>
              <div className="mt-3 h-0.5 w-8 rounded-full" style={{ background: f.accent, opacity: 0.5 }} />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── APP DOWNLOAD ── */}
      <Section className="px-4 py-16">
        <motion.div
          variants={fadeUp} custom={0}
          className="max-w-4xl mx-auto rounded-3xl border overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(212,166,70,0.12) 0%, rgba(90,50,10,0.08) 100%)',
            borderColor: 'rgba(212,166,70,0.20)',
          }}
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left */}
            <div className="p-8 md:p-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 border"
                style={{ background: 'rgba(212,166,70,0.12)', borderColor: 'rgba(212,166,70,0.25)', color: '#d4a645' }}>
                <Smartphone size={12} /> Install the App
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Take Sangam with you, everywhere.
              </h2>
              <p className="text-amber-100/55 text-sm leading-relaxed mb-8">
                Add Sanatana Sangam to your home screen for the full app experience —
                offline access, push notifications for Brahma Muhurta, festival reminders, and more.
              </p>

              <div className="space-y-3">
                {/* Android / Chrome install */}
                {canInstall && (
                  <button
                    onClick={install}
                    className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #d4a645, #a07830)', color: '#1c1008' }}
                  >
                    <Download size={17} />
                    Add to Home Screen
                  </button>
                )}
                <Link href="/signup"
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(212,166,70,0.3)', color: '#d4a645' }}
                >
                  <ArrowRight size={17} />
                  Open Web App
                </Link>
              </div>

              <p className="mt-5 text-[11px] text-amber-100/30 leading-relaxed">
                <span className="font-semibold text-amber-100/50">iOS Safari:</span> tap the Share button → "Add to Home Screen"
                <br />
                <span className="font-semibold text-amber-100/50">Android Chrome:</span> tap menu → "Add to Home Screen"
                <br />
                No App Store needed. Updates automatically.
              </p>
            </div>

            {/* Right — decorative */}
            <div className="hidden md:flex flex-col items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at center, rgba(212,166,70,0.15) 0%, transparent 70%)' }} />
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="relative z-10 text-center"
              >
                <div className="text-8xl mb-4" style={{ filter: 'drop-shadow(0 0 30px rgba(212,166,70,0.4))' }}>
                  🕉️
                </div>
                <p className="text-amber-400/60 text-sm font-semibold">Dharma, always with you</p>
                <div className="mt-3 flex items-center gap-2 justify-center">
                  {['🌅', '📿', '📖', '🙏', '✨'].map((e, i) => (
                    <motion.span
                      key={i}
                      className="text-xl"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                    >
                      {e}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">From the community</h2>
          <p className="text-amber-100/50 text-sm">Real voices from Sanatani worldwide</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp} custom={i}
              className="rounded-2xl border p-6"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,166,70,0.10)' }}
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={13} style={{ fill: '#d4a645', color: '#d4a645' }} />
                ))}
              </div>
              <p className="text-amber-100/70 italic text-sm mb-5 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg border"
                  style={{ background: 'rgba(212,166,70,0.10)', borderColor: 'rgba(212,166,70,0.15)' }}>
                  {t.emoji}
                </div>
                <div>
                  <div className="font-semibold text-sm text-amber-100">{t.name}</div>
                  <div className="text-[11px] text-amber-100/40">{t.city}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <motion.div variants={fadeUp} custom={0} className="mb-6 flex justify-center">
          <BrandMark size="lg" />
        </motion.div>
        <motion.h2
          variants={fadeUp} custom={1}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          Your Mandali is waiting.
        </motion.h2>
        <motion.p
          variants={fadeUp} custom={2}
          className="text-amber-100/50 mb-10 text-lg"
        >
          Join thousands of Sanatani who have already found their community — from Leicester to Los Angeles, Mauritius to Melbourne.
        </motion.p>
        <motion.div variants={fadeUp} custom={3}>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
            style={{ background: 'linear-gradient(135deg, #d4a645, #a07830)', color: '#1c1008' }}
          >
            <Heart size={20} /> Begin Your Journey
          </Link>
          <p className="mt-4 text-xs text-amber-100/30">Just dharma. No noise.</p>
        </motion.div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4 border-t" style={{ borderColor: 'rgba(212,166,70,0.08)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-amber-100/30">
          <div className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span>Sanatana Sangam — सनातन संगम</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {[
              { href: '/about',      label: 'About'      },
              { href: '/privacy',    label: 'Privacy'    },
              { href: '/terms',      label: 'Terms'      },
              { href: '/guidelines', label: 'Guidelines' },
              { href: '/contact',    label: 'Contact'    },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="hover:text-amber-200/70 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <div>Built with 🙏 for the global Sanatani community</div>
        </div>
      </footer>

    </div>
  );
}
