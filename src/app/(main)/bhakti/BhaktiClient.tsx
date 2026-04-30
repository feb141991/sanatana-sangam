'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, BarChart2 } from 'lucide-react';
import ChantAudioPlayer from '@/components/bhakti/ChantAudioPlayer';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import type { Shloka } from '@/lib/shlokas';

/* ─── Incense smoke rising from the diya ─────────────────────────── */
function IncenseParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={`smoke-${i}`}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `calc(50% + ${-12 + i * 3}px)`,
            bottom: '38%',
            background: `rgba(245,200,120,${0.12 + (i % 4) * 0.06})`,
          }}
          animate={{
            y: [0, -(50 + i * 18), -(110 + i * 25)],
            x: [0, i % 2 === 0 ? 10 : -10, i % 2 === 0 ? -5 : 6],
            opacity: [0, 0.55, 0],
            scale: [0.4, 1.8, 0.3],
          }}
          transition={{
            duration: 4.5 + i * 0.6,
            repeat: Infinity,
            delay: i * 0.85,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated diya flame ─────────────────────────────────────────── */
function DiyaFlame() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Far outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 96,
          height: 96,
          background:
            'radial-gradient(circle, rgba(220,120,20,0.22) 0%, transparent 68%)',
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Mid glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 60,
          height: 60,
          background:
            'radial-gradient(circle, rgba(255,165,40,0.38) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.22, 0.94, 1], opacity: [0.65, 1, 0.75, 0.65] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Flame core */}
      <motion.div
        style={{
          width: 16,
          height: 28,
          background:
            'linear-gradient(180deg, #fff8e0 0%, #ffb820 45%, #ff6515 100%)',
          borderRadius: '50% 50% 50% 50% / 38% 38% 62% 62%',
          boxShadow: '0 0 18px rgba(255,148,22,0.9), 0 0 6px rgba(255,255,200,0.6)',
          position: 'relative',
          top: -8,
        }}
        animate={{
          scaleX: [1, 1.1, 0.93, 1.07, 1],
          scaleY: [1, 0.93, 1.06, 0.97, 1],
          rotate: [-3, 4, -2, 3, -3],
        }}
        transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Diya base (clay bowl) */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          width: 38,
          height: 11,
          background:
            'linear-gradient(90deg, #7a3f1c 0%, #c97c3a 48%, #7a3f1c 100%)',
          borderRadius: '2px 2px 50% 50% / 2px 2px 80% 80%',
        }}
      />
    </div>
  );
}

/* ─── Floating light specks (stars / embers) ─────────────────────── */
function AmbientSpecks() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.div
          key={`speck-${i}`}
          className="absolute rounded-full"
          style={{
            width: 1 + (i % 2),
            height: 1 + (i % 2),
            left: `${(i * 4.8) % 100}%`,
            top: `${(i * 7.3) % 75}%`,
            background: 'rgba(245,220,150,0.7)',
          }}
          animate={{ opacity: [0.15, 0.55, 0.15], scale: [0.8, 1.4, 0.8] }}
          transition={{
            duration: 2.5 + (i % 5) * 0.7,
            repeat: Infinity,
            delay: i * 0.28,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Practice portal cards ──────────────────────────────────────── */
const PORTALS = [
  {
    href: '/bhakti/mala',
    emoji: '📿',
    title: 'Japa',
    sub: 'Mala & Mantra',
    desc: 'Count your mantra with a sacred rhythm — 27, 54, or 108 rounds.',
    glow: 'rgba(180,55,25,0.35)',
    accent: '#d4643a',
    border: 'rgba(212,100,50,0.22)',
  },
  {
    href: '/bhakti/zen',
    emoji: '🕉️',
    title: 'Sattvic Mode',
    sub: 'Sattva Practice',
    desc: 'Enter a full-screen sattvic space: prānāyāma, kīrtana, or silent svādhyāya.',
    glow: 'rgba(80,58,180,0.32)',
    accent: '#8b7de0',
    border: 'rgba(130,100,220,0.2)',
  },
] as const;

export default function BhaktiClient({ shloka }: { shloka: Shloka }) {
  const router = useRouter();
  const { resolvedTheme } = useThemePreference();
  const isDark = resolvedTheme === 'dark';
  const [showPlayer, setShowPlayer] = useState(false);

  const pageBg = isDark
    ? 'linear-gradient(180deg, #1a0d0d 0%, #20130e 40%, #1a1208 100%)'
    : 'linear-gradient(180deg, #fdf6ee 0%, #f7ede0 40%, #f2e8d5 100%)';
  const heroBg = isDark
    ? 'linear-gradient(180deg, rgba(60,22,10,0.92) 0%, rgba(28,14,8,0.96) 100%)'
    : 'linear-gradient(180deg, rgba(255,240,220,0.96) 0%, rgba(255,230,200,0.98) 100%)';
  const heroBorder = isDark ? 'rgba(200,146,74,0.18)' : 'rgba(160,90,30,0.18)';
  const heroShadow = isDark ? '0 0 50px rgba(200,100,20,0.12)' : '0 0 50px rgba(200,100,20,0.06)';
  const headingColor = isDark ? 'var(--text-cream)' : '#1A0A02';
  const subColor = isDark ? 'rgba(245,210,130,0.5)' : 'rgba(120,65,10,0.55)';
  const descColor = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const cardBg = isDark
    ? 'linear-gradient(140deg, rgba(28,20,12,0.92), rgba(18,12,8,0.96))'
    : 'linear-gradient(140deg, rgba(255,244,228,0.96), rgba(250,235,210,0.98))';
  const cardTitleColor = isDark ? '#f5dfa0' : '#3a1a02';
  const cardSubColor = isDark ? 'rgba(245,220,150,0.45)' : 'rgba(100,55,10,0.45)';
  const cardDescColor = isDark ? 'rgba(245,210,130,0.55)' : 'rgba(80,40,8,0.60)';
  const sectionBg = isDark ? 'rgba(18,12,8,0.9)' : 'rgba(255,245,230,0.95)';
  const sectionBorder = isDark ? 'rgba(200,146,74,0.1)' : 'rgba(180,110,30,0.15)';
  const sectionTitleColor = isDark ? '#f5dfa0' : '#2a1002';
  const sectionSubColor = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.50)';
  const shlokaChipColor = isDark ? 'rgba(200,146,74,0.07)' : 'rgba(200,146,74,0.08)';
  const shlokaChipText = isDark ? 'rgba(245,210,130,0.45)' : 'rgba(100,55,10,0.55)';
  const shlokaBg = isDark ? 'rgba(12,8,4,0.8)' : 'rgba(255,245,228,0.95)';
  const shlokaBorder = isDark ? 'rgba(200,146,74,0.07)' : 'rgba(180,110,30,0.12)';
  const shlokaLabelColor = isDark ? 'rgba(200,146,74,0.45)' : 'rgba(160,90,20,0.50)';
  const shlokaOrigColor = isDark ? 'rgba(245,220,150,0.75)' : 'rgba(60,30,5,0.80)';
  const shlokaTransColor = isDark ? 'rgba(245,210,130,0.42)' : 'rgba(80,40,8,0.55)';
  const shlokaSourceColor = isDark ? 'rgba(200,146,74,0.3)' : 'rgba(160,90,20,0.40)';

  return (
    <div
      className="relative min-h-screen"
      style={{ background: pageBg }}
    >
      <AmbientSpecks />

      {/* Safe-area notch spacer */}
      <div style={{ height: 'max(env(safe-area-inset-top, 0px), 16px)' }} />

      {/* Back button */}
      <div className="flex items-center px-4 pb-2">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: 'rgba(200,146,74,0.10)',
            border: '1px solid rgba(200,146,74,0.20)',
          }}
        >
          <ChevronLeft size={18} style={{ color: 'rgba(200,146,74,0.80)' }} />
        </button>
      </div>

      <div className="relative space-y-5 px-4 pb-28">
        {/* ── Hero ──────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[3rem] px-5 pb-8 pt-12 text-center"
          style={{
            background: heroBg,
            border: `1px solid ${heroBorder}`,
            boxShadow: heroShadow,
          }}
        >
          <IncenseParticles />

          <div className="relative space-y-5">
            {/* Diya */}
            <div className="flex justify-center">
              <DiyaFlame />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2rem, 7vw, 2.4rem)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: headingColor,
                  lineHeight: 1.1,
                }}
              >
                Bhakti
              </h1>
              <p
                className="mt-1 text-sm tracking-widest"
                style={{ color: subColor }}
              >
                भक्ति — the path of devotion
              </p>
              <p
                className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed"
                style={{ color: descColor }}
              >
                A quiet space for mantra, breath, and remembrance.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Practice portals ───────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {PORTALS.map((portal, i) => (
            <motion.div
              key={portal.href}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.15, duration: 0.6 }}
            >
              <Link
                href={portal.href}
                className="group block rounded-[1.8rem] p-5 motion-lift relative overflow-hidden"
                style={{
                  background: cardBg,
                  border: `1px solid ${portal.border}`,
                  boxShadow: `0 4px 32px ${portal.glow}`,
                }}
              >
                {/* Ambient corner glow */}
                <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none" style={{
                  background: `radial-gradient(circle at top right, ${portal.glow}, transparent 70%)`,
                }} />
                <div className="flex items-start gap-4">
                  <motion.div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-2xl"
                    style={{
                      background: 'rgba(200,146,74,0.1)',
                      border: '1px solid rgba(200,146,74,0.18)',
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 0px ${portal.glow}`,
                        `0 0 16px ${portal.glow}`,
                        `0 0 0px ${portal.glow}`,
                      ],
                    }}
                    transition={{
                      duration: 3.2,
                      repeat: Infinity,
                      delay: i * 1.6,
                    }}
                  >
                    {portal.emoji}
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p
                        className="text-base font-semibold"
                        style={{ color: cardTitleColor }}
                      >
                        {portal.title}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: cardSubColor }}
                      >
                        {portal.sub}
                      </p>
                    </div>
                    <p
                      className="mt-1.5 text-sm leading-relaxed"
                      style={{ color: cardDescColor }}
                    >
                      {portal.desc}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 flex items-center justify-end gap-1 text-xs font-medium"
                  style={{ color: portal.accent }}
                >
                  Enter →
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Insights link ──────────────────────────── */}
        <div className="flex justify-end">
          <Link
            href="/bhakti/insights"
            className="flex items-center gap-1.5 text-[12px] font-medium"
            style={{ color: 'rgba(200,146,74,0.85)' }}
          >
            <BarChart2 size={13} />
            View Practice Insights →
          </Link>
        </div>

        {/* ── Sacred sounds ──────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="rounded-[1.8rem] p-5"
          style={{
            background: sectionBg,
            border: `1px solid ${sectionBorder}`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium" style={{ color: sectionTitleColor }}>
                Sacred Sounds
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: sectionSubColor }}
              >
                Let the chant carry you inward
              </p>
            </div>
            <button
              onClick={() => setShowPlayer(!showPlayer)}
              className="rounded-full px-4 py-2 text-xs font-medium transition-all"
              style={{
                background: showPlayer
                  ? 'rgba(200,146,74,0.18)'
                  : 'rgba(200,146,74,0.08)',
                border: '1px solid rgba(200,146,74,0.22)',
                color: '#C8924A',
              }}
            >
              {showPlayer ? 'Hide' : 'Play now'}
            </button>
          </div>

          <AnimatePresence>
            {showPlayer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.38 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  <ChantAudioPlayer title="Bhakti shelf" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex flex-wrap gap-2"
            >
              {['Gayatri Mantra', 'Guru Stotram', 'Kirtana'].map((name) => (
                <span
                  key={name}
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: shlokaChipColor,
                    color: shlokaChipText,
                    border: '1px solid rgba(200,146,74,0.1)',
                  }}
                >
                  {name}
                </span>
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Daily shloka ──────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="rounded-[1.8rem] px-5 py-6 text-center"
          style={{
            background: shlokaBg,
            border: `1px solid ${shlokaBorder}`,
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: shlokaLabelColor }}
          >
            Verse of the day
          </p>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-4 text-base leading-relaxed"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.05rem',
              fontWeight: 500,
              color: shlokaOrigColor,
              fontStyle: 'italic',
            }}
          >
            &ldquo;{shloka.sanskrit}&rdquo;
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed"
            style={{ color: shlokaTransColor }}
          >
            &ldquo;{shloka.meaning}&rdquo;
          </motion.p>

          <p
            className="mt-3 text-xs"
            style={{ color: shlokaSourceColor }}
          >
            {shloka.source}
          </p>
        </motion.section>
      </div>
    </div>
  );
}
