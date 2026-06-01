'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getGreeting, getGreetingPool, isGreetingCompatibleWithTradition } from '@/lib/traditions';

interface GreetingEditSheetProps {
  tradition: string | null;
  sampradaya: string | null;
  currentGreeting: string | null;
  onSave: (greeting: string | null) => void;
  onClose: () => void;
}

function formatTraditionGreetingLabel(tradition: string | null, sampradaya: string | null) {
  const label = sampradaya && sampradaya !== 'other'
    ? sampradaya
    : tradition && tradition !== 'other'
      ? tradition
      : 'your path';

  return label
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function GreetingEditSheet({
  tradition,
  sampradaya,
  currentGreeting,
  onSave,
  onClose,
}: GreetingEditSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const pool = getGreetingPool(tradition, sampradaya);

  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(currentGreeting);
  const [custom, setCustom] = useState(() => (
    currentGreeting && !pool.includes(currentGreeting) ? currentGreeting : ''
  ));

  const pathLabel = formatTraditionGreetingLabel(tradition, sampradaya);
  const previewGreeting = selected ?? getGreeting(tradition, sampradaya, new Date().getDate());
  const previewTone = selected
    ? pool.includes(selected) ? 'Saved tradition greeting' : 'Saved custom greeting'
    : 'Auto greeting';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] overflow-y-auto"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <div className="min-h-full flex items-end justify-center p-3 sm:items-center sm:p-6">
        <motion.div
          role="dialog"
          aria-modal="true"
          className="glass-panel-strong w-full max-w-lg rounded-[1.85rem] overflow-hidden"
          onClick={(event) => event.stopPropagation()}
          initial={prefersReducedMotion ? undefined : { y: 24, opacity: 0.98, scale: 0.99 }}
          animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? undefined : { y: 18, opacity: 0.98, scale: 0.99 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
            {/* Dark-themed header */}
            <div className="sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between"
              style={{ background: 'rgba(30, 28, 22, 0.97)', borderColor: 'rgba(197, 160, 89, 0.14)', backdropFilter: 'blur(16px)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: '#f0ede6' }}>
                  Choose your greeting
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(240, 237, 230, 0.70)' }}>
                  Suggested for {pathLabel}. You can stay on auto or save a personal greeting.
                </p>
              </div>
              <button onClick={onClose}
                className="w-11 h-11 rounded-full flex items-center justify-center motion-press border-0 cursor-pointer"
                style={{ background: 'rgba(197, 160, 89, 0.10)' }}>
                <X size={15} style={{ color: '#f0ede6' }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Preview */}
              <div className="rounded-[1.4rem] p-4 border" style={{ background: 'rgba(197, 160, 89, 0.07)', borderColor: 'rgba(197, 160, 89, 0.16)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--brand-primary)' }}>
                  {previewTone}
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-cream)' }}>{previewGreeting}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>This is what will appear in your home greeting.</p>
              </div>

              <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                <button
                  onClick={() => { setSelected(null); setCustom(''); }}
                  className="w-full text-left px-4 py-3 rounded-2xl border text-sm motion-press cursor-pointer bg-transparent"
                  style={selected === null ? {
                    borderColor: 'var(--brand-primary)',
                    background: 'rgba(197, 160, 89, 0.10)',
                    color: 'var(--brand-primary)',
                  } : {
                    borderColor: 'rgba(197, 160, 89, 0.12)',
                    color: 'var(--text-muted-warm)',
                  }}
                >
                  <span className="block font-semibold">✨ Auto</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Rotate a suggested greeting from your tradition.</span>
                </button>

                <div className="pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-dim)' }}>
                    Suggested for {pathLabel}
                  </p>
                  <div className="space-y-2">
                    {pool.map((g) => (
                      <button
                        key={g}
                        onClick={() => { setSelected(g); setCustom(''); }}
                        className="w-full text-left px-4 py-3 rounded-2xl border text-sm motion-press cursor-pointer bg-transparent"
                        style={selected === g ? {
                          borderColor: 'var(--brand-primary)',
                          background: 'rgba(197, 160, 89, 0.10)',
                          color: 'var(--brand-primary)',
                        } : {
                          borderColor: 'rgba(197, 160, 89, 0.10)',
                          color: 'var(--text-muted-warm)',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>Or write your own greeting:</p>
                <input
                  type="text"
                  placeholder="e.g. Jai Mahakal! 🔱"
                  value={custom}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCustom(nextValue);
                    setSelected(nextValue.trim() || null);
                  }}
                  className="surface-input px-4 py-3 text-sm outline-none w-full box-border rounded-xl"
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              <button
                onClick={() => { onSave(selected); onClose(); }}
                className="glass-button-primary w-full py-3 font-semibold rounded-2xl text-sm border-0 cursor-pointer"
                style={{ color: '#1a1610', background: 'var(--brand-primary)' }}
              >
                Save Greeting 🙏
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
