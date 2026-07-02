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

interface TraditionSymbolProps {
  tradition?: string | null;
  accentColor: string;
  size?: number;
  compact?: boolean;
}

function TraditionSymbol({
  tradition,
  accentColor,
  size = 120,
  compact = false,
}: TraditionSymbolProps) {
  const normTrad = (tradition ?? 'other').toLowerCase();

  switch (normTrad) {
    case 'hindu':
      return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {!compact && (
            <>
              {/* Concentric sound/vibration rings */}
              <circle cx="60" cy="60" r="32" stroke={accentColor} strokeWidth="1" opacity="0.3" />
              <circle cx="60" cy="60" r="44" stroke={accentColor} strokeWidth="1" opacity="0.2" />
              <circle cx="60" cy="60" r="56" stroke={accentColor} strokeWidth="1" opacity="0.1" />

              {/* Lotus base petals */}
              <path d="M60,90 C57,95 50,95 48,91 C48,87 55,87 60,90 Z" fill={accentColor} fillOpacity="0.12" stroke={accentColor} strokeWidth="1" />
              <path d="M60,90 C63,95 70,95 72,91 C72,87 65,87 60,90 Z" fill={accentColor} fillOpacity="0.12" stroke={accentColor} strokeWidth="1" />
              <path d="M60,90 C57,98 50,102 46,98 C44,94 52,92 60,90 Z" fill={accentColor} fillOpacity="0.12" stroke={accentColor} strokeWidth="1" />
              <path d="M60,90 C63,98 70,102 74,98 C76,94 68,92 60,90 Z" fill={accentColor} fillOpacity="0.12" stroke={accentColor} strokeWidth="1" />
            </>
          )}

          {/* Conch shell spiral */}
          <path d="M60,35 C72,35 82,43 82,55 C82,68 70,78 60,78 C50,78 38,68 38,55 C38,43 48,35 60,35 Z" fill={accentColor} fillOpacity="0.12" stroke={accentColor} strokeWidth="1.5" />
          <path d="M60,35 C55,42 50,50 50,58 C50,66 55,73 60,78" stroke={accentColor} strokeWidth="1.2" />
          <path d="M60,35 C65,42 70,50 70,58 C70,66 65,73 60,78" stroke={accentColor} strokeWidth="1.2" />
          <path d="M60,45 C57,48 55,52 55,58 C55,64 57,68 60,70" stroke={accentColor} strokeWidth="1" />
          <path d="M60,45 C63,48 65,52 65,58 C65,64 63,68 60,70" stroke={accentColor} strokeWidth="1" />
          <path d="M60,35 C60,20 63,20 60,20 C57,20 60,20 60,35" stroke={accentColor} strokeWidth="1.5" />
        </svg>
      );

    case 'sikh':
      return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {!compact && (
            <>
              {/* Concentric circles behind */}
              <circle cx="60" cy="60" r="44" stroke={accentColor} strokeWidth="1" opacity="0.12" />
              <circle cx="60" cy="60" r="54" stroke={accentColor} strokeWidth="1" opacity="0.12" />
              <circle cx="60" cy="60" r="64" stroke={accentColor} strokeWidth="1" opacity="0.12" />

              {/* 8 Radial lines */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180;
                const rStart = 50;
                const rEnd = 62;
                const x1 = 60 + rStart * Math.cos(angle);
                const y1 = 60 + rStart * Math.sin(angle);
                const x2 = 60 + rEnd * Math.cos(angle);
                const y2 = 60 + rEnd * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={accentColor}
                    strokeWidth="0.8"
                    opacity="0.25"
                  />
                );
              })}
            </>
          )}

          {/* Monumental Khanda Character */}
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="96"
            fontFamily="sans-serif"
            fill={accentColor}
          >
            ☬
          </text>
        </svg>
      );

    case 'buddhist':
      return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {!compact && (
            <>
              {/* Soft Lotus Petals */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = i * 45;
                return (
                  <ellipse
                    key={i}
                    cx="60"
                    cy="8"
                    rx="6"
                    ry="14"
                    fill={accentColor}
                    opacity="0.15"
                    transform={`rotate(${angle}, 60, 60)`}
                  />
                );
              })}
              {/* Thin outer ring */}
              <circle cx="60" cy="60" r="58" stroke={accentColor} strokeWidth="1" opacity="0.3" />
            </>
          )}

          {/* Dharma Wheel Character */}
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="88"
            fontFamily="sans-serif"
            fill={accentColor}
          >
            ☸
          </text>
        </svg>
      );

    case 'jain':
      return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {!compact && (
            <>
              {/* Jain Siddhashila crescent above fingers */}
              <path
                d="M48,22 C53,25 61,25 66,22"
                stroke={accentColor}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="57" cy="17" r="2" fill={accentColor} />
            </>
          )}

          {/* Open Palm Hand Outline with wristband */}
          <path
            d="M42,92 C42,92 41,75 41,70 C41,65 33,62 33,58 C33,55 36,53 39,56 L46,65 L46,45 C46,41 49,41 49,45 L49,60 L54,38 C54,34 57,34 57,38 L57,60 L62,35 C62,31 65,31 65,35 L62,60 L70,40 C70,36 73,36 73,40 L68,68 C68,70 76,72 76,82 C76,92 70,95 68,95 L46,95 Z M46,95 L46,102 C46,104 49,105 57,105 C65,105 68,104 68,102 L68,95"
            stroke={accentColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Jain symbol inside palm */}
          <circle cx="57" cy="74" r="8" stroke={accentColor} strokeWidth="1" />
          <path d="M57,66 C61,66 65,70 65,74" stroke={accentColor} strokeWidth="1" />
          <path d="M65,74 C65,78 61,82 57,82" stroke={accentColor} strokeWidth="1" />
          <path d="M57,82 C53,82 49,78 49,74" stroke={accentColor} strokeWidth="1" />
          <path d="M49,74 C49,70 53,66 57,66" stroke={accentColor} strokeWidth="1" />
          <circle cx="57" cy="74" r="2" fill={accentColor} />
        </svg>
      );

    default: // universal / other
      return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {!compact && (
            /* Depth infinity lemniscate */
            <path
              d="M60,60 C68,48 88,48 88,60 C88,72 68,72 60,60 C52,48 32,48 32,60 C32,72 52,72 60,60 Z"
              stroke={accentColor}
              strokeWidth="2.2"
              opacity="0.2"
              transform="translate(2, 2) scale(0.9)"
              style={{ transformOrigin: '60px 60px' }}
            />
          )}

          {/* Main infinity lemniscate */}
          <path
            d="M60,60 C68,48 88,48 88,60 C88,72 68,72 60,60 C52,48 32,48 32,60 C32,72 52,72 60,60 Z"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Central Shoonya dot */}
          <circle cx="60" cy="60" r="3" fill={accentColor} />
        </svg>
      );
  }
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
        <div className={`${motionClass} select-none`}>
          <TraditionSymbol tradition={tradition} accentColor={cfg.accentColor} size={120} compact={false} />
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
  const size = variant === 'ai' ? 54 : 48;

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
          width: size,
          height: size,
          color: cfg.accentColor,
          lineHeight: 1,
        }}
      >
        <TraditionSymbol tradition={tradition} accentColor={cfg.accentColor} size={size} compact={true} />

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
