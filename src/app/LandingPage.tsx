'use client';

// ─── Shoonaya — Landing Page (Live Version) ──────────────────────────────────
// Full animation style landing — dharma first, live product emphasis.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, AnimatePresence, useScroll, useTransform, type Variants } from 'framer-motion';
import {
  Users, BookOpen, Heart, ArrowRight,
  Flame, Sparkles, Download, Smartphone,
  CalendarDays, Activity, PlayCircle, Shield, MoveRight, HelpCircle, Star,
  CircleDot, Flower2, SunMedium, Landmark
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// ─── Rotating hero verses ─────────────────────────────────────────────────────
const HERO_VERSES = [
  { original: 'धर्मो रक्षति रक्षितः',     translit: 'Dharmo rakṣati rakṣitaḥ',   meaning: 'Dharma protected, protects.' },
  { original: 'सर्वे भवन्तु सुखिनः',       translit: 'Sarve bhavantu sukhinaḥ',    meaning: 'May all beings be happy.' },
  { original: 'वसुधैव कुटुम्बकम्',          translit: 'Vasudhaiva kuṭumbakam',       meaning: 'The world is one family.' },
  { original: 'तमसो मा ज्योतिर्गमय',       translit: 'Tamaso mā jyotirgamaya',     meaning: 'Lead me from darkness to light.' },
  { original: 'एकं सत् विप्रा बहुधा वदन्ति', translit: 'Ekaṃ sat viprā bahudhā vadanti', meaning: 'Truth is one; the wise call it by many names.' },
];

// ─── Traditions ───────────────────────────────────────────────────────────────
const TRADITIONS = [
  {
    name: 'Hindu (Sanatan)',
    icon: SunMedium,
    desc: 'Nitya Karma, Panchang, and daily Japa tracking tailored to your specific tradition and rashi.',
  },
  {
    name: 'Sikh',
    icon: Landmark,
    desc: 'Daily Nitnem support, Gurmukhi scriptures, and Sikh festival calendar tracking.',
  },
  {
    name: 'Buddhist',
    icon: CircleDot,
    desc: 'Dhamma paths, Pali scripture integration, and dedicated meditation tools.',
  },
  {
    name: 'Jain',
    icon: Flower2,
    desc: 'Tithi tracking, Vrat support, and resources aligned with Jain principles of Ahimsa.',
  },
];

const FEATURE_ACCENTS = {
  amber: {
    icon: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    link: 'text-amber-500',
  },
  orange: {
    icon: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    link: 'text-orange-500',
  },
  green: {
    icon: 'text-green-600 bg-green-600/10 border-green-600/20',
    link: 'text-green-600',
  },
  purple: {
    icon: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    link: 'text-purple-500',
  },
  sky: {
    icon: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    link: 'text-sky-500',
  },
  neutral: {
    icon: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
    link: 'text-neutral-400',
  },
} as const;

type FeatureAccent = keyof typeof FEATURE_ACCENTS;

// ─── Live Features ────────────────────────────────────────────────────────────
const LIVE_FEATURES = [
  {
    title: 'Daily Wisdom',
    status: 'Live Now',
    href: '/home',
    desc: 'Your personalised morning sadhana sequence.',
    icon: Flame,
    accent: 'amber',
  },
  {
    title: 'Japa Counter',
    status: 'Live Now',
    href: '/japa',
    desc: 'Digital mala with bead counting and streak tracking.',
    icon: Activity,
    accent: 'orange',
  },
  {
    title: 'Panchang',
    status: 'Live Now',
    href: '/panchang/today',
    desc: 'Daily panchang context, tithi, nakshatra, and sacred-time guidance.',
    icon: CalendarDays,
    accent: 'amber',
  },
  {
    title: 'Pathshala',
    status: 'Live Now',
    href: '/pathshala',
    desc: 'Guided scripture paths with guided recitation and learning tools.',
    icon: BookOpen,
    accent: 'green',
  },
  {
    title: 'Gyan Chaupar',
    status: 'Live Now',
    href: '/quiz/practice',
    desc: 'Test your dharmic knowledge and earn your ranks.',
    icon: Star,
    accent: 'purple',
  },
  {
    title: 'Mandali',
    status: 'Live Now',
    href: '/mandali',
    desc: 'Connect with your local dharmic community.',
    icon: Users,
    accent: 'purple',
  },
  {
    title: 'Kul',
    status: 'Live Now',
    href: '/kul',
    desc: 'Your family spiritual tree and heritage.',
    icon: Shield,
    accent: 'sky',
  },
  {
    title: 'Dharma AI',
    status: 'Beta',
    href: '/ai-chat',
    desc: 'AI companion rooted in shastra for dharma questions.',
    icon: Sparkles,
    accent: 'amber',
  },
] satisfies Array<{
  title: string;
  status: 'Live Now' | 'Beta' | 'Coming Next';
  href: string;
  desc: string;
  icon: typeof Flame;
  accent: FeatureAccent;
}>;

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'What is Shoonaya?',
    a: 'Shoonaya is a unified digital platform built to support the daily practices, scriptures, and community connections for followers of Hindu, Sikh, Buddhist, and Jain dharma.'
  },
  {
    q: 'Is the platform currently live?',
    a: 'Yes, many core web features are live. You can sign up and start your sadhana today.'
  },
  {
    q: 'Is it a website or an app?',
    a: 'Currently, Shoonaya is available as a Progressive Web App (PWA).'
  },
  {
    q: 'Which traditions are supported?',
    a: 'Hindu (Sanatan), Sikh, Buddhist, and Jain dharma.'
  },
  {
    q: 'Are native apps available?',
    a: 'Not yet. Please use the Web App while native apps continue toward release.'
  },
  {
    q: 'Is Kids Zone live?',
    a: 'No, it is currently in development.'
  },
  {
    q: 'How do I install it on my phone?',
    a: 'You can install it directly to your home screen from your mobile browser (Safari on iOS, Chrome on Android).'
  },
  {
    q: 'Is my data private?',
    a: 'Shoonaya is built with clear privacy and safety practices. We do not sell your data or design the app around distracting engagement loops.'
  }
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
          style={{
            color: 'var(--text-cream)',
            fontFamily: 'var(--font-devanagari), var(--font-serif), serif',
            textShadow: '0 2px 16px color-mix(in srgb, black 65%, transparent)'
          }}>
          {v.original}
        </p>
        <p className="text-sm mt-1 italic opacity-80"
          style={{
            color: 'var(--text-cream)',
            fontFamily: 'var(--font-serif), serif'
          }}>
          {v.translit}
        </p>
        <p className="text-xs mt-1 opacity-70"
          style={{
            color: 'var(--text-cream)',
            fontFamily: 'var(--font-inter), sans-serif'
          }}>
          {v.meaning}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── PWA install hook ─────────────────────────────────────────────────────────
function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
  };

  return { canInstall: !!promptEvent && !installed, installed, install };
}

// ─── Section wrapper with scroll reveal ──────────────────────────────────────
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref  = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.section
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={seen ? 'visible' : 'hidden'}
      className={className}
      id={id}
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
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-950">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 px-4 pt-3">
        <div className="max-w-6xl mx-auto px-4 h-14 rounded-2xl flex items-center justify-between backdrop-blur-md border border-white/5 bg-black/40">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/logo.png"
              width={32}
              height={32}
              alt="Shoonaya"
              className="rounded-xl object-cover"
            />
            <span className="font-bold text-base text-[var(--text-cream)]">
              Shoo<span className="text-[color:var(--brand-primary)]">naya</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-[var(--text-cream)] opacity-70 hover:opacity-100 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/signup"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-black font-sans">
              Enter Shoonaya <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ opacity: heroOpacity }}
        className="relative min-h-[72vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-8 pb-16"
      >
        {/* Background */}
        <motion.div
          style={{ scale: heroScale }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          <Image
            src="/assets/images/heroes/all/default.webp"
            alt="Shoonaya Devotional Sanctuary Backdrop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center divine-hero-image"
            style={{
              objectPosition: 'center 25%',
              filter: 'saturate(0.72) contrast(0.84) brightness(0.70)'
            }}
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/75 via-black/20 to-neutral-950" />
          <div className="absolute inset-x-0 bottom-0 h-[45%] z-[2] bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          <StarField />
        </motion.div>

        {/* Content */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-[var(--brand-primary)]/30 text-[color:var(--brand-primary)] bg-[var(--brand-primary)]/10 font-sans">
              <Sparkles size={15} aria-hidden /> Shoonaya is Live Now
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp} custom={1}
            className="text-5xl md:text-7xl font-light leading-tight mb-6 text-white tracking-tight premium-serif"
          >
            Find your
            <br />
            <span className="bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-transparent bg-clip-text">
              infinite.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-[color:var(--text-muted-warm)] max-w-2xl mx-auto mb-6 leading-relaxed font-sans"
          >
            Shoonaya is the void that holds all traditions. Hindu, Sikh, Buddhist, and Jain
            dharma — sadhana, scripture, community, and seva — in one sacred home.
          </motion.p>

          <motion.p variants={fadeUp} custom={2.5} className="text-sm font-semibold text-amber-200/60 mb-8 font-sans">
            Available now as a web app.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-black font-sans">
              <Heart size={18} /> Enter Shoonaya
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base border transition-all hover:bg-white/5 border-[var(--brand-primary)]/30 text-[color:var(--brand-primary)] font-sans">
              Sign In
            </Link>
            {canInstall && (
              <button
                onClick={install}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base border transition-all hover:bg-white/5 border-[var(--brand-primary)]/30 text-[color:var(--brand-primary)] font-sans"
              >
                <Smartphone size={17} /> Add to Home Screen
              </button>
            )}
          </motion.div>

          <motion.div
            variants={fadeUp} custom={4}
            className="rounded-2xl border px-6 py-5 mx-auto max-w-md backdrop-blur-md"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <p className="text-[10px] uppercase tracking-widest text-[color:var(--brand-primary)] font-bold mb-3 font-sans">From the Shastra</p>
            <RotatingVerse />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── CHOOSE YOUR TRADITION ── */}
      <Section id="shoonaya-content" className="max-w-6xl mx-auto px-4 py-16">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Choose Your Path
          </h2>
          <p className="text-amber-100/50 max-w-xl mx-auto">
            Shoonaya adapts to your unique dharma. We never blend traditions, we honor them individually.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRADITIONS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp} custom={i}
              whileHover={{ scale: 1.02, y: -4 }}
              className="rounded-2xl border p-6 text-center transition-shadow hover:shadow-xl"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
              }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--brand-primary)]/15 bg-[var(--brand-primary)]/10 text-[color:var(--brand-primary)]">
                <t.icon size={28} strokeWidth={1.7} aria-hidden />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{t.name}</h3>
              <p className="text-sm text-amber-100/60 leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── LIVE FEATURES ── */}
      <Section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Everything for your{' '}
            <span className="bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-transparent bg-clip-text">
              digital tirtha
            </span>
          </h2>
          <p className="text-amber-100/50 max-w-xl mx-auto">
            A comprehensive suite of tools built specifically for seekers, not consumers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {LIVE_FEATURES.map((f, i) => {
            const Icon = f.icon;
            const accent = FEATURE_ACCENTS[f.accent];
            return (
              <motion.div
                key={f.title}
                variants={fadeUp} custom={i}
                className="rounded-2xl border p-5 flex flex-col relative overflow-hidden"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${accent.icon}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${f.status === 'Live Now' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-neutral-400'}`}>
                    {f.status}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-amber-100/50 leading-relaxed flex-grow mb-4">{f.desc}</p>
                {f.href ? (
                  <Link href={f.href} className={`text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all mt-auto ${accent.link}`}>
                    Explore <MoveRight size={12} />
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-amber-100/20 mt-auto">In development</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── PRODUCT PROOF (Route Previews) ── */}
      <Section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          variants={fadeUp} custom={0}
          className="rounded-3xl border overflow-hidden p-8 md:p-12"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Designed for daily sadhana</h2>
            <p className="text-amber-100/50 max-w-2xl mx-auto text-sm">
              Calmer product surfaces with functional interfaces designed to support daily practice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Route Preview 1: Japa Tracker */}
            <div className="rounded-2xl border p-5 backdrop-blur-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-orange-500 bg-orange-500/10">
                  <Activity size={16} />
                </div>
                <div>
                  <div className="text-xs text-amber-100/50 uppercase tracking-widest font-semibold">Route</div>
                  <div className="text-sm text-white font-medium">/japa</div>
                </div>
              </div>
              <div className="text-center py-6">
                <div className="text-lg font-medium text-white mb-2">Digital Japa Mala</div>
                <div className="text-xs text-amber-100/60 leading-relaxed">
                  Interactive bead tracking, mantra audio guides, and history logging. Complete a full round directly in the browser.
                </div>
              </div>
              <Link href="/japa" className="mt-4 flex w-full justify-center items-center py-2 rounded-xl border border-orange-500/30 text-orange-500 text-xs font-bold hover:bg-orange-500/10 transition-colors">
                View Feature
              </Link>
            </div>

            {/* Route Preview 2: Panchang */}
            <div className="rounded-2xl border p-5 backdrop-blur-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-amber-600 bg-amber-600/10">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <div className="text-xs text-amber-100/50 uppercase tracking-widest font-semibold">Route</div>
                  <div className="text-sm text-white font-medium">/panchang/today</div>
                </div>
              </div>
              <div className="text-center py-6">
                <div className="text-lg font-medium text-white mb-2">Live Panchang</div>
                <div className="text-xs text-amber-100/60 leading-relaxed">
                  Daily panchang context, tithi, nakshatra, and sacred-time guidance for your practice.
                </div>
              </div>
              <Link href="/panchang/today" className="mt-4 flex w-full justify-center items-center py-2 rounded-xl border border-amber-600/30 text-amber-600 text-xs font-bold hover:bg-amber-600/10 transition-colors">
                View Feature
              </Link>
            </div>

            {/* Route Preview 3: Pathshala */}
            <div className="rounded-2xl border p-5 backdrop-blur-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-green-600 bg-green-600/10">
                  <BookOpen size={16} />
                </div>
                <div>
                  <div className="text-xs text-amber-100/50 uppercase tracking-widest font-semibold">Route</div>
                  <div className="text-sm text-white font-medium">/pathshala</div>
                </div>
              </div>
              <div className="text-center py-6">
                <div className="text-lg font-medium text-white mb-2">Guided Learning</div>
                <div className="text-xs text-amber-100/60 leading-relaxed">
                  Interactive scripture study paths. Read, listen, and practice pronunciation with guided feedback.
                </div>
              </div>
              <Link href="/pathshala" className="mt-4 flex w-full justify-center items-center py-2 rounded-xl border border-green-600/30 text-green-600 text-xs font-bold hover:bg-green-600/10 transition-colors">
                View Feature
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ── GYAN CHAUPAR ── */}
      <Section className="max-w-6xl mx-auto px-4 py-8">
        <motion.div variants={fadeUp} custom={0} className="border-y py-12 md:py-16 text-center" style={{ borderColor: 'var(--card-border)' }}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 text-purple-500 bg-purple-500/10">
            <Star size={24} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Gyan Chaupar</h2>
          <p className="text-xs uppercase tracking-widest font-bold text-green-500 mb-4">Live Now</p>
          <p className="text-amber-100/60 max-w-2xl mx-auto text-sm leading-relaxed mb-8">
            Play sacred wisdom now. Test your dharmic knowledge, earn your ranks, and deepen your understanding of the shastras.
          </p>
          <Link href="/quiz/practice" className="inline-flex text-sm font-semibold hover:opacity-80 transition-opacity text-purple-400">
            Play Gyan Chaupar →
          </Link>
        </motion.div>
      </Section>

      {/* ── SACRED CALENDAR ── */}
      <Section className="max-w-6xl mx-auto px-4 py-8">
        <motion.div variants={fadeUp} custom={0} className="border-y py-12 md:py-16 text-center" style={{ borderColor: 'var(--card-border)' }}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 text-amber-500 bg-amber-500/10">
            <CalendarDays size={24} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">The Unified Dharmic Calendar</h2>
          <p className="text-amber-100/60 max-w-2xl mx-auto text-sm leading-relaxed mb-8">
            Shoonaya helps you keep Purnima, Amavasya, Ekadashi, and major festivals across traditions close to your daily rhythm.
          </p>
          <Link href="/panchang/today" className="inline-flex text-sm font-semibold hover:opacity-80 transition-opacity text-amber-500">
            Explore the Panchang →
          </Link>
        </motion.div>
      </Section>

      {/* ── COMMUNITY & ZEROISTS ── */}
      <Section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <motion.div variants={fadeUp} custom={0}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 text-purple-500 bg-purple-500/10">
            <Users size={24} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Join the Sangam</h2>
          <p className="text-amber-100/60 max-w-2xl mx-auto text-sm leading-relaxed mb-8">
            Connect with seekers across the dharmic diaspora. Zeroists are seekers returning to the source: one home, many paths. Shoonaya&apos;s Mandali and Kul spaces are built for calmer community and family continuity.
          </p>
          <Link href="/mandali" className="inline-flex text-sm font-semibold hover:opacity-80 transition-opacity text-purple-500">
            Discover Mandalis →
          </Link>
        </motion.div>
      </Section>

      {/* ── KIDS ZONE (COMING NEXT) ── */}
      <Section className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          variants={fadeUp} custom={0}
          className="rounded-3xl border p-8 md:p-12 text-center"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 text-neutral-400 bg-neutral-400/10 border border-neutral-400/30">
            <PlayCircle size={24} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Kids Zone</h2>
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-6">Coming Next</p>
          <p className="text-amber-100/60 max-w-2xl mx-auto text-sm leading-relaxed">
            We are actively building the Shoonaya Kids Zone. It will feature interactive stories, value-based games, and accessible teachings designed to introduce the next generation to our rich dharmic heritage in a calmer family space.
          </p>
        </motion.div>
      </Section>

      {/* ── APP INSTALL GUIDE ── */}
      <Section className="px-4 py-16">
        <motion.div
          variants={fadeUp} custom={0}
          className="max-w-4xl mx-auto rounded-3xl border overflow-hidden backdrop-blur-md"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 border border-amber-500/30 text-amber-500 bg-amber-500/10">
              <Smartphone size={12} /> Install the Web App
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Shoonaya on your Home Screen
            </h2>
            <p className="text-amber-100/55 text-sm leading-relaxed mb-10 max-w-2xl mx-auto">
              Shoonaya is available right now as a Progressive Web App. Install it directly from your browser to get the full screen, app-like experience without waiting for app store reviews.
            </p>

            <div className="grid md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
              <div className="border border-white/5 rounded-2xl p-6 bg-black/40">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Smartphone size={17} className="text-[color:var(--brand-primary)]" aria-hidden />
                  For iOS (Safari)
                </h3>
                <ol className="list-decimal list-inside text-sm text-amber-100/70 space-y-3">
                  <li>Open Shoonaya in Safari.</li>
                  <li>Tap the <strong>Share</strong> icon at the bottom.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top right.</li>
                </ol>
              </div>
              <div className="border border-white/5 rounded-2xl p-6 bg-black/40">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Smartphone size={17} className="text-[color:var(--brand-primary)]" aria-hidden />
                  For Android (Chrome)
                </h3>
                <ol className="list-decimal list-inside text-sm text-amber-100/70 space-y-3">
                  <li>Open Shoonaya in Chrome.</li>
                  <li>Tap the <strong>3 dots</strong> menu in the top right.</li>
                  <li>Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
                  <li>Follow the on-screen prompt.</li>
                </ol>
                {canInstall && (
                  <button
                    onClick={install}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:bg-white/5 border-amber-500/30 text-amber-500"
                  >
                    <Download size={14} /> Auto-Install Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="max-w-4xl mx-auto px-4 py-16">
        <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-6 text-white/50 bg-white/5">
            <HelpCircle size={24} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
        </motion.div>

        <div className="grid gap-4 max-w-2xl mx-auto">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="border p-6 rounded-2xl"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <h3 className="font-bold text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-amber-100/60 leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <motion.div variants={fadeUp} custom={0} className="mb-6 flex justify-center">
          <span
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              color: 'var(--brand-primary)',
            }}
            className="text-4xl font-bold tracking-wide"
          >
            शून्य
          </span>
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
          A growing global sangha — one dharma, many paths.
        </motion.p>
        <motion.div variants={fadeUp} custom={3}>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-strong)] text-black"
          >
            <Heart size={20} /> Enter Shoonaya
          </Link>
          <p className="mt-4 text-xs text-amber-100/30">Just dharma. No noise.</p>
        </motion.div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-amber-100/30">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/logo.png"
              width={24}
              height={24}
              alt="Shoonaya"
              className="rounded-lg object-cover"
            />
            <span>Shoonaya — शून्य</span>
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
          <div>Built for the global Sanatani community</div>
        </div>
      </footer>

    </div>
  );
}
