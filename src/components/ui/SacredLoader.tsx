'use client';

/**
 * SacredLoader — Tradition-aware loading component
 *
 * Variants:
 *   splash  — fixed full-screen overlay for app boot / route transitions
 *   page    — centred, medium, for page-level async states
 *   ai      — special AI-thinking state (slightly larger symbol + italic copy)
 *   inline  — tiny, drop-in Spinner replacement inside buttons / rows
 *
 * Usage:
 *   <SacredLoader tradition={tradition} variant="page" />
 *   <SacredLoader tradition="sikh" variant="ai" message="Finding a shabad…" />
 *   <SacredLoader variant="inline" />   ← uses 'other' (universal) silently
 */

import { useEffect, useState } from 'react';
import { getLoaderConfig, pickLoaderMessage } from '@/lib/loader-config';

export type LoaderVariant = 'splash' | 'page' | 'ai' | 'inline';

interface SacredLoaderProps {
  /** User's tradition key. Falls back to 'other' / universal if omitted. */
  tradition?: string | null;
  variant?: LoaderVariant;
  /** Override the automatic message pick */
  message?: string;
  className?: string;
}

export function SacredLoader({
  tradition,
  variant = 'inline',
  message,
  className = '',
}: SacredLoaderProps) {
  const cfg = getLoaderConfig(tradition);

  // Message pool for this variant
  const msgPool =
    variant === 'ai'     ? cfg.messages.ai :
    variant === 'splash' ? cfg.messages.splash :
                           cfg.messages.page;

  // Start with first message (SSR-safe), randomise on client
  const [resolvedMsg, setResolvedMsg] = useState(msgPool[0]);
  useEffect(() => {
    setResolvedMsg(message ?? pickLoaderMessage(msgPool));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradition, variant, message]);

  const motionClass =
    cfg.motionPreset === 'breathe' ? 'animate-sacred-breathe' : 'animate-sacred-halo';

  // ── inline ─────────────────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <span
        className={`inline-block animate-sacred-pulse select-none leading-none ${className}`}
        style={{ color: cfg.accentColor }}
        aria-hidden="true"
        role="status"
      >
        {cfg.symbol}
      </span>
    );
  }

  // ── splash ─────────────────────────────────────────────────────────────────
  if (variant === 'splash') {
    return (
      <div
        className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-6 ${className}`}
        style={{ background: 'var(--divine-bg, #FAF6EF)' }}
        role="status"
        aria-label="Loading"
      >
        {/* Symbol */}
        <div
          className={`${motionClass} select-none`}
          style={{ fontSize: 56, color: cfg.accentColor, lineHeight: 1 }}
        >
          {cfg.symbol}
        </div>

        {/* Soft radial glow behind symbol */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 160,
            height: 160,
            background: `radial-gradient(circle, ${cfg.accentColor}18 0%, transparent 70%)`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -68%)',
          }}
        />

        {/* Message */}
        <p
          className="text-[13px] font-medium tracking-wide text-center px-8"
          style={{
            color: 'rgba(120, 90, 30, 0.55)',
            fontFamily: 'var(--font-cormorant, Georgia, serif)',
            fontStyle: 'italic',
          }}
        >
          {resolvedMsg}
        </p>

        {/* Brand wordmark */}
        <p
          className="absolute bottom-10 text-[10px] font-semibold tracking-[0.22em] uppercase"
          style={{ color: 'rgba(120, 90, 30, 0.28)' }}
        >
          Shoonaya
        </p>
      </div>
    );
  }

  // ── page / ai ──────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col items-center gap-3 py-10 ${className}`}
      role="status"
      aria-label="Loading"
    >
      {/* Symbol */}
      <div
        className={`${motionClass} select-none relative`}
        style={{
          fontSize: variant === 'ai' ? 34 : 28,
          color: cfg.accentColor,
          lineHeight: 1,
        }}
      >
        {cfg.symbol}

        {/* Subtle bloom */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${cfg.accentColor}22 0%, transparent 65%)`,
            transform: 'scale(2.8)',
          }}
        />
      </div>

      {/* Message */}
      <p
        className="text-[12px] font-medium tracking-wide text-center max-w-[220px]"
        style={{
          color: 'rgba(120, 90, 30, 0.50)',
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          fontStyle: variant === 'ai' ? 'italic' : 'normal',
          lineHeight: 1.5,
        }}
      >
        {resolvedMsg}
      </p>
    </div>
  );
}

export default SacredLoader;
