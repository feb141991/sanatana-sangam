'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { activatePro } from '@/lib/premium';

const PRO_FEATURES = [
  { emoji: '🔥', title: 'Shloka Streak Tracking', desc: 'See your daily streak, longest run, and milestones.' },
  { emoji: '🌅', title: 'Brahma Muhurta Alert', desc: 'Get a push notification exactly when your sacred window opens.' },
  { emoji: '⚙️', title: 'Customise Your Nitya', desc: 'Rename steps, set your own alert time, and build your personal routine.' },
  { emoji: '🕉️', title: 'Custom Nitya Karma', desc: 'Add your own practices beyond the default 7-step sequence.' },
  { emoji: '📿', title: 'Japa History', desc: 'Full session history with mantra breakdown and time charts.' },
  { emoji: '🏡', title: 'Kul Reminders', desc: 'Smart nudges for family observances and kul milestones.' },
  { emoji: '✨', title: 'More coming', desc: 'AI practice plans, advanced panchang, and early access to new features.' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after the user successfully activates pro */
  onActivated?: () => void;
}

export default function PremiumActivateModal({ open, onClose, onActivated }: Props) {
  const [accepted,   setAccepted]   = useState(false);
  const [activating, setActivating] = useState(false);

  function handleActivate() {
    if (!accepted) return;
    setActivating(true);
    // Small artificial delay so the button animation feels intentional
    setTimeout(() => {
      activatePro();
      setActivating(false);
      onActivated?.();
      onClose();
    }, 600);
  }

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 rounded-t-[2rem] overflow-hidden flex flex-col"
            style={{
              zIndex: 9999,
              background: 'linear-gradient(175deg, #1a0d1a 0%, #110808 60%, #130c06 100%)',
              border: '1px solid rgba(212,166,70,0.18)',
              borderBottom: 'none',
              maxHeight: '92dvh',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36, mass: 0.9 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full opacity-30" style={{ background: 'var(--brand-primary)' }} />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-3 pb-4 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-primary-strong)' }}>
                    Sangam Pro
                  </span>
                </div>
                <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--brand-ink)' }}>
                  Unlock your full practice
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--brand-muted)' }}>
                  Free to activate now — payment will be added later.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-3 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <X size={15} style={{ color: 'var(--brand-muted)' }} />
              </button>
            </div>

            {/* Feature list — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
              <div className="space-y-2.5">
                {PRO_FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3.5 rounded-2xl px-4 py-3.5"
                    style={{ background: 'rgba(212,166,70,0.06)', border: '1px solid rgba(212,166,70,0.1)' }}
                  >
                    <span className="text-2xl flex-shrink-0 mt-0.5">{f.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--brand-ink)' }}>{f.title}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--brand-muted)' }}>{f.desc}</p>
                    </div>
                    <Check size={14} className="ml-auto flex-shrink-0 mt-1" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Accept + activate */}
            <div className="flex-shrink-0 px-5 pt-4 pb-2 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Checkbox */}
              <button
                onClick={() => setAccepted(a => !a)}
                className="flex items-start gap-3 w-full text-left"
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                  style={{
                    background: accepted ? 'var(--brand-primary)' : 'transparent',
                    border: `1.5px solid ${accepted ? 'var(--brand-primary)' : 'rgba(212,166,70,0.3)'}`,
                  }}
                >
                  {accepted && <Check size={11} color="#1c1c1a" strokeWidth={3} />}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
                  I understand this is an early-access preview. Sangam Pro is free for now — pricing will be introduced later and I&apos;ll be notified before any charges apply.
                </p>
              </button>

              {/* Activate button */}
              <motion.button
                onClick={handleActivate}
                disabled={!accepted || activating}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-40"
                style={{
                  background: accepted
                    ? 'linear-gradient(135deg, #c8920a 0%, #d4a818 50%, #b07a08 100%)'
                    : 'rgba(212,166,70,0.15)',
                  color: accepted ? '#1c1c1a' : 'var(--brand-muted)',
                  boxShadow: accepted ? '0 4px 24px rgba(212,166,70,0.3)' : 'none',
                }}
                whileTap={accepted ? { scale: 0.97 } : {}}
              >
                {activating ? 'Activating…' : '✨ Activate Sangam Pro'}
              </motion.button>

              <p className="text-center text-[10px]" style={{ color: 'rgba(180,160,100,0.45)' }}>
                No credit card required · Cancel anytime later
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
