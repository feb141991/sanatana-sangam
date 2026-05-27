'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type PermissionType = 'microphone' | 'location' | 'notifications';

interface PermissionSheetProps {
  type: PermissionType;
  open: boolean;
  onAllow: () => void;   // caller triggers the real browser dialog here
  onDeny: () => void;    // user explicitly skips
}

// Config per permission type
const CONFIGS: Record<PermissionType, {
  emoji: string;
  title: string;
  why: string;          // 1 sentence: why the app needs it
  benefit: string;      // 1 sentence: what the user gets
  allowLabel: string;
  denyLabel: string;
}> = {
  microphone: {
    emoji: '🎙️',
    title: 'Microphone for Shruti',
    why: 'Shruti scores your Sanskrit recitation by listening to your voice.',
    benefit: 'You receive phonological feedback on pronunciation, sandhi, and metre.',
    allowLabel: 'Allow Microphone',
    denyLabel: 'Not now',
  },
  location: {
    emoji: '📍',
    title: 'Location for your Panchang',
    why: 'Sunrise, Rahu Kaal, and muhurta timings vary by your exact coordinates.',
    benefit: 'Your Panchang, Tirtha map, and nearby Mandali all become location-precise.',
    allowLabel: 'Share Location',
    denyLabel: 'Use default (Ujjain)',
  },
  notifications: {
    emoji: '🔔',
    title: 'Reminders for your sadhana',
    why: 'We send Brahma Muhurta alerts, Ekadashi reminders, and japa session nudges.',
    benefit: 'Never miss a sacred window — only 1-2 notifications per day, no spam.',
    allowLabel: 'Allow Notifications',
    denyLabel: 'Not now',
  },
};

export default function PermissionSheet({ type, open, onAllow, onDeny }: PermissionSheetProps) {
  const cfg = CONFIGS[type];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center p-4 pb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDeny} />
          <motion.div
            className="relative w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid rgba(197,160,89,0.22)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.28 }}
          >
            <button onClick={onDeny}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(197,160,89,0.10)' }}>
              <X size={13} style={{ color: 'var(--text-muted-warm)' }} />
            </button>

            <div className="text-4xl text-center">{cfg.emoji}</div>

            <div className="text-center space-y-1">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-cream)' }}>
                {cfg.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>{cfg.why}</p>
              <p className="text-sm leading-relaxed font-medium" style={{ color: 'rgba(197,160,89,0.90)' }}>{cfg.benefit}</p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={onAllow}
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style={{ background: 'rgba(197,160,89,0.90)', color: '#1a0e04' }}>
                {cfg.allowLabel}
              </button>
              <button
                onClick={onDeny}
                className="w-full py-2.5 rounded-2xl text-sm"
                style={{ color: 'var(--text-muted-warm)', background: 'transparent' }}>
                {cfg.denyLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
