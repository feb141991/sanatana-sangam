'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { activatePro } from '@/lib/premium';

// ─── Benefit groups ────────────────────────────────────────────────────────────
const BENEFIT_GROUPS = [
  {
    label: 'Daily Ritual',
    color: 'rgba(200, 146, 74, 0.14)',
    borderColor: 'rgba(200, 146, 74, 0.22)',
    accentColor: '#C8924A',
    items: [
      { emoji: '🌅', title: 'Brahma Muhurta Alert',   desc: 'A sacred notification precisely when your spiritual window opens each morning.' },
      { emoji: '⚙️', title: 'Customise Your Nitya',   desc: 'Rename steps, set personal alert times, and build a routine that is truly yours.' },
      { emoji: '🕉️', title: 'Custom Nitya Karma',     desc: 'Add your own practices beyond the default sequence.' },
    ],
  },
  {
    label: 'Practice Depth',
    color: 'rgba(160, 100, 220, 0.10)',
    borderColor: 'rgba(160, 100, 220, 0.20)',
    accentColor: '#b07ad4',
    items: [
      { emoji: '📿', title: 'Full Japa History',       desc: 'Every session, every mantra, in a beautiful timeline with insights.' },
      { emoji: '🔥', title: 'Streak & Milestones',     desc: 'Track your shloka streak, longest run, and celebrate sacred milestones.' },
      { emoji: '📖', title: 'Advanced Pathshala',      desc: 'Unlock all study paths and deepen your scriptural understanding.' },
    ],
  },
  {
    label: 'Family & Kul',
    color: 'rgba(80, 160, 100, 0.10)',
    borderColor: 'rgba(80, 160, 100, 0.20)',
    accentColor: '#6ab87a',
    items: [
      { emoji: '🏡', title: 'Kul Reminders',           desc: 'Smart nudges for family observances, anniversaries, and kul milestones.' },
      { emoji: '🌿', title: 'Sanskar Lifecycle',       desc: 'Track all 16 Sanskaras for every family member with milestone notifications.' },
    ],
  },
  {
    label: 'Coming Soon',
    color: 'rgba(200, 146, 74, 0.06)',
    borderColor: 'rgba(200, 146, 74, 0.12)',
    accentColor: 'rgba(200,146,74,0.55)',
    items: [
      { emoji: '✨', title: 'AI Spiritual Guidance',    desc: 'Personalised practice plans, scripture recommendations, and dharmic insights.' },
    ],
  },
];

// ─── Animated sacred mark ─────────────────────────────────────────────────────
function SacredHero({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 120 }}>
      {/* Outer breathing ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 110, height: 110, border: '1px solid rgba(200,146,74,0.16)' }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Mid ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 78, height: 78, border: '1px solid rgba(200,146,74,0.24)' }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.12, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      {/* Core glow */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 50, height: 50, background: 'radial-gradient(circle, rgba(200,146,74,0.28) 0%, transparent 72%)' }}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      {/* Symbol */}
      <motion.div
        className="relative text-3xl"
        animate={prefersReducedMotion ? {} : { rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 0 12px rgba(200,146,74,0.45))' }}
      >
        🕉️
      </motion.div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  onActivated?: () => void;
}

export default function PremiumActivateModal({ open, onClose, onActivated }: Props) {
  const [accepted,   setAccepted]   = useState(false);
  const [activating, setActivating] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  function handleActivate() {
    if (!accepted) return;
    setActivating(true);
    setTimeout(() => {
      activatePro();
      setActivating(false);
      onActivated?.();
      onClose();
    }, 700);
  }

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 backdrop-blur-[3px]"
            style={{ zIndex: 9998, background: 'rgba(8, 5, 2, 0.78)' }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26 }}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 rounded-t-[2.2rem] overflow-hidden flex flex-col"
            style={{
              zIndex: 9999,
              background: 'linear-gradient(175deg, #180c18 0%, #0e0808 45%, #120c06 100%)',
              border: '1px solid rgba(200, 146, 74, 0.16)',
              borderBottom: 'none',
              maxHeight: '94dvh',
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 310, damping: 34, mass: 0.85 }}
          >
            {/* Ambient top glow */}
            <div className="absolute top-0 inset-x-0 h-40 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(200,146,74,0.10) 0%, transparent 70%)',
            }} />

            {/* Drag handle */}
            <div className="flex justify-center pt-3.5 pb-0 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(200,146,74,0.25)' }} />
            </div>

            {/* Close */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X size={14} style={{ color: 'rgba(200,170,120,0.65)' }} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* ── Hero section ── */}
              <div className="relative px-6 pt-5 pb-6 text-center">
                <SacredHero prefersReducedMotion={prefersReducedMotion} />

                {/* Eyebrow */}
                <motion.p
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 4 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="text-[10px] font-bold uppercase tracking-[0.22em] mt-2"
                  style={{ color: '#C8924A' }}
                >
                  Sangam Pro
                </motion.p>

                {/* Headline — the invitation */}
                <motion.h2
                  initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.26, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.85rem',
                    fontWeight: 600,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    color: '#f0e2c0',
                    marginTop: '0.5rem',
                  }}
                >
                  A deeper<br />practice awaits
                </motion.h2>

                {/* Sub-copy */}
                <motion.p
                  initial={prefersReducedMotion ? undefined : { opacity: 0 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm leading-relaxed mt-3 max-w-[280px] mx-auto"
                  style={{ color: 'rgba(220,190,130,0.48)' }}
                >
                  Sangam Pro is your invitation into a more intentional, supported, and meaningful spiritual life.
                </motion.p>

                {/* Free badge */}
                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 24 }}
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(200, 146, 74, 0.12)',
                    border: '1px solid rgba(200, 146, 74, 0.22)',
                    color: '#d4a85a',
                  }}
                >
                  ✦ Free to activate now · Pricing added later
                </motion.div>
              </div>

              {/* ── Divider ── */}
              <div className="mx-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,146,74,0.16), transparent)' }} />

              {/* ── Benefit groups ── */}
              <div className="px-5 py-5 space-y-4">
                {BENEFIT_GROUPS.map((group, gi) => (
                  <motion.div
                    key={group.label}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + gi * 0.08, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[1.4rem] overflow-hidden border"
                    style={{ background: group.color, borderColor: group.borderColor }}
                  >
                    {/* Group label */}
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: group.accentColor }}>
                        {group.label}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="px-3 pb-3 space-y-1">
                      {group.items.map((item) => (
                        <div
                          key={item.title}
                          className="flex items-start gap-3 rounded-[1rem] px-3 py-3"
                          style={{ background: 'rgba(0,0,0,0.18)' }}
                        >
                          {/* Icon well */}
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-[0.7rem] flex items-center justify-center text-xl"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                          >
                            {item.emoji}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold leading-tight" style={{ color: '#ede0c4' }}>
                              {item.title}
                            </p>
                            <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'rgba(210,185,135,0.50)' }}>
                              {item.desc}
                            </p>
                          </div>

                          {/* Check */}
                          <div
                            className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: `${group.accentColor}22`, border: `1px solid ${group.accentColor}55` }}
                          >
                            <Check size={9} style={{ color: group.accentColor }} strokeWidth={2.5} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom padding so last item clears the sticky footer */}
              <div className="h-4" />
            </div>

            {/* ── Sticky footer — accept + activate ── */}
            <div
              className="flex-shrink-0 px-5 pt-4 pb-3 space-y-3"
              style={{ borderTop: '1px solid rgba(200, 146, 74, 0.10)', background: 'rgba(14, 10, 8, 0.92)', backdropFilter: 'blur(12px)' }}
            >
              {/* Agreement */}
              <button
                onClick={() => setAccepted(a => !a)}
                className="flex items-start gap-3 w-full text-left"
              >
                <motion.div
                  animate={{ background: accepted ? '#C8924A' : 'transparent', borderColor: accepted ? '#C8924A' : 'rgba(200,146,74,0.30)' }}
                  transition={{ duration: 0.18 }}
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border-[1.5px]"
                >
                  <AnimatePresence>
                    {accepted && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      >
                        <Check size={11} color="#1a0e04" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(200,170,120,0.55)' }}>
                  I understand this is an early-access preview. Sangam Pro is free for now — pricing will be introduced later and I&apos;ll be notified before any charges apply.
                </p>
              </button>

              {/* Activate CTA */}
              <motion.button
                onClick={handleActivate}
                disabled={!accepted || activating}
                className="w-full py-4 rounded-[1.1rem] font-semibold text-sm relative overflow-hidden disabled:opacity-30"
                style={{
                  background: accepted
                    ? 'linear-gradient(135deg, rgba(200,110,20,0.95), rgba(200,146,74,0.88))'
                    : 'rgba(200,146,74,0.10)',
                  color: accepted ? '#1a0c04' : 'rgba(200,160,80,0.45)',
                  boxShadow: accepted
                    ? '0 8px 28px rgba(200,110,20,0.28), inset 0 1px 0 rgba(255,225,160,0.18)'
                    : 'none',
                  transition: 'all 260ms cubic-bezier(0.34, 1.26, 0.64, 1)',
                }}
                whileTap={accepted && !prefersReducedMotion ? { scale: 0.97 } : {}}
              >
                {/* Shimmer effect when active */}
                {accepted && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,235,180,0.12) 50%, transparent 100%)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                  />
                )}
                <span className="relative">
                  {activating ? 'Entering the sanctuary…' : '✦ Begin Sangam Pro'}
                </span>
              </motion.button>

              {/* Trust line */}
              <p className="text-center text-[10px]" style={{ color: 'rgba(180,150,90,0.35)' }}>
                No credit card · No hidden charges · Your practice, uninterrupted
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
