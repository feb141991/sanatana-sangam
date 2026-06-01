'use client';

import { motion } from 'framer-motion';
import { MOODS_CONFIG, type MoodConfig } from '@/lib/mood/registry';
import MoodGlyph from '@/components/ui/MoodGlyph';

export interface MoodReturnProps {
  checkinId: string;
  onComplete: (afterMoodKey: string) => void;
  onSkip: () => void;
}

export default function MoodReturn({ checkinId, onComplete, onSkip }: MoodReturnProps) {
  const MOODS = MOODS_CONFIG.dark;

  const handlePillTap = async (mood: MoodConfig) => {
    try {
      await fetch('/api/mood/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: checkinId,
          after_mood: mood.key,
          session_status: 'completed',
        }),
      });
    } catch (err) {
      console.error('Failed to log mood completion', err);
    }
    onComplete(mood.key);
  };

  return (
    <div className="pt-6 pb-2 border-t border-[var(--card-border)] bg-[var(--divine-bg)] mt-4">
      <div className="flex items-center justify-between px-2 mb-3">
        <span className="text-[11px] text-[var(--text-dim)]">How do you feel now?</span>
        <button
          onClick={onSkip}
          className="text-[11px] text-[var(--text-dim)] hover:text-[var(--text-cream)] transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="-mx-5 px-5 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-2 w-max pb-2">
          {MOODS.map(mood => (
            <motion.button
              key={mood.key}
              whileTap={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={() => handlePillTap(mood)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-cream)] transition-colors"
            >
              <MoodGlyph mood={mood.key} size={12} color={mood.colour} />
              <span className="text-[11px] font-medium">{mood.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
