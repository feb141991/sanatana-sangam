'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  tradition: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATIONS = [7, 14, 21, 30];
const PRACTICES = ['Japa', 'Nitya', 'Pathshala', 'All'];

export default function SetSankalpSheet({ tradition, onClose, onSuccess }: Props) {
  const [text, setText] = useState('');
  const [targetDays, setTargetDays] = useState(30);
  const [relatedPractice, setRelatedPractice] = useState('All');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (text.length < 10 || text.length > 200) {
      toast.error('Your Sankalpa must be between 10 and 200 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sankalpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          target_days: targetDays,
          related_practice: relatedPractice.toLowerCase(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save Sankalpa');
      }

      toast.success('Sankalpa set successfully! 🙏');
      onSuccess();
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[2000] flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-h-[90dvh] overflow-y-auto rounded-t-[2rem] pb-8 bg-[var(--surface-raised)]"
        onClick={e => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ boxShadow: '0 -20px 40px rgba(0,0,0,0.3)' }}
      >
        <div className="sticky top-0 bg-[var(--surface-raised)] z-10 px-6 pt-6 pb-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold font-serif theme-ink flex items-center gap-2">
              <span>🌅</span> Set Your Sankalpa
            </h2>
            <button onClick={onClose} className="p-2 rounded-full bg-black/5 dark:bg-white/10">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">A sacred resolve for the coming days.</p>
        </div>

        <div className="px-6 mt-6 space-y-8">
          <div>
            <textarea
              className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 text-xl font-serif leading-relaxed theme-ink placeholder:opacity-30 focus:outline-none focus:border-[var(--brand-primary)] transition-colors resize-none py-2"
              placeholder="I resolve to..."
              rows={3}
              maxLength={200}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-muted-foreground">{text.length}/200</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Duration</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map(days => (
                <button
                  key={days}
                  onClick={() => setTargetDays(days)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    targetDays === days 
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]' 
                      : 'bg-transparent border-black/10 dark:border-white/10 theme-ink'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Related Practice (Optional)</p>
            <div className="flex flex-wrap gap-2">
              {PRACTICES.map(prac => (
                <button
                  key={prac}
                  onClick={() => setRelatedPractice(prac)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    relatedPractice === prac 
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30' 
                      : 'bg-transparent border-black/10 dark:border-white/10 text-muted-foreground'
                  }`}
                >
                  {prac}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || text.length < 10}
            className="w-full mt-4 py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            style={{ background: 'var(--brand-primary)' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Take the Sankalpa 🙏'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
