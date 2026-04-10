'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MvpThemeKey } from '@/lib/mvp-themes';
import { MVP_THEMES } from '@/lib/mvp-themes';

export default function MvpHero({
  theme,
  title,
  description,
  chips = [],
  actions,
}: {
  theme: MvpThemeKey;
  title: string;
  description: string;
  chips?: string[];
  actions?: ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();
  const config = MVP_THEMES[theme];

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border px-4 py-5 sm:px-5 sm:py-6"
      style={{
        background: `linear-gradient(160deg, rgba(255,255,255,0.99) 0%, rgba(252,250,247,0.97) 52%, rgba(255,255,255,0.99) 100%), ${config.surface}`,
        borderColor: config.border,
        boxShadow: '0 28px 60px rgba(28, 26, 23, 0.08)',
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28"
        initial={prefersReducedMotion ? undefined : { opacity: 0.6, scale: 1.04 }}
        animate={prefersReducedMotion ? undefined : { opacity: [0.52, 0.8, 0.52], scale: [1.03, 1.1, 1.03], x: [0, 10, 0] }}
        transition={prefersReducedMotion ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: config.aura }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-4 h-36 w-36 rounded-full blur-3xl"
        initial={prefersReducedMotion ? undefined : { opacity: 0.22, y: 0 }}
        animate={prefersReducedMotion ? undefined : { opacity: [0.14, 0.28, 0.14], y: [0, 16, 0], x: [0, -10, 0] }}
        transition={prefersReducedMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: config.iconWell }}
      />

      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: config.accent }}>
          {config.eyebrow}
        </p>
        <h1 className="mt-1 font-display text-[1.62rem] sm:text-[1.9rem] font-bold text-gray-900 leading-[1.04]">
          {title}
        </h1>
        <p className="mt-2 max-w-[42rem] text-sm text-gray-600 leading-relaxed">
          {description}
        </p>

        {(chips.length > 0 || actions) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium bg-white/92 text-gray-600 border border-black/5"
              >
                {chip}
              </span>
            ))}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
