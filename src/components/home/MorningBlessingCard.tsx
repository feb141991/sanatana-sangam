'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Share2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

import { getTraditionMeta } from '@/lib/tradition-config';
import { readLocalStorageItem, writeLocalStorageItem } from '@/lib/safe-browser-storage';
import {
  isMorningBlessingWindow,
  buildMorningBlessingKey,
  buildMorningBlessingMessage,
} from '@/lib/morning-blessing-policy';

export interface MorningBlessingCardProps {
  tithiName?: string | null;
  nakshatraName?: string | null;
  cityName?: string | null;
  tradition?: string | null;
  verseSnippet?: string | null;
  timezone?: string;
}

export default function MorningBlessingCard({
  tithiName,
  nakshatraName,
  cityName,
  tradition,
  verseSnippet,
  timezone,
}: MorningBlessingCardProps) {
  const [dismissed, setDismissed] = useState(true);
  const [copied, setCopied] = useState(false);

  const meta = getTraditionMeta(tradition ?? 'hindu');
  const accent = meta.accentColour ?? '#C5A059';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMorningBlessingWindow()) {
      setDismissed(true);
      return;
    }
    const key = buildMorningBlessingKey(new Date(), timezone);
    if (readLocalStorageItem(key)) {
      setDismissed(true);
      return;
    }
    setDismissed(false);
  }, [timezone]);

  const dismiss = useCallback(() => {
    const key = buildMorningBlessingKey(new Date(), timezone);
    writeLocalStorageItem(key, '1');
    setDismissed(true);
  }, [timezone]);

  const handleShare = useCallback(async () => {
    const message = buildMorningBlessingMessage({
      tithiName,
      cityName,
      verseSnippet,
    });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Morning Blessing · Shoonaya',
          text: message,
          url: 'https://www.shoonaya.com/get?utm_source=whatsapp&utm_medium=morning_card&utm_campaign=suprabhat_loop',
        });
        return;
      } catch (err) {
        // User cancelled or unsupported, fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Morning blessing copied to clipboard for WhatsApp!');
      setTimeout(() => setCopied(false), 2500);
    }
  }, [cityName, tithiName, verseSnippet]);

  if (dismissed) return null;

  const headline = tithiName
    ? `${tithiName}${cityName ? ` · ${cityName}` : ''}`
    : 'Pratah Smaran · Auspicious Morning';

  return (
    <div
      role="region"
      aria-label="Morning Blessing Card"
      className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all shadow-sm my-4"
      style={{
        borderColor: 'var(--card-border, rgba(255, 255, 255, 0.1))',
        background: 'linear-gradient(135deg, var(--surface-soft, rgba(255, 255, 255, 0.03)) 0%, var(--card-bg, rgba(255, 255, 255, 0.01)) 100%)',
      }}
    >
      {/* Devotional Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: 'var(--card-border, rgba(255, 255, 255, 0.15))',
              backgroundColor: 'var(--surface-soft, rgba(255, 255, 255, 0.05))',
            }}
          >
            <Sun className="size-4" style={{ color: accent }} />
          </div>

          <div className="min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.15em] block"
              style={{ color: accent }}
            >
              PRATAH SMARAN · MORNING BLESSING
            </span>
            <h3 className="text-sm font-semibold text-[var(--text-cream,#f5f0e6)] mt-0.5 truncate">
              {headline}
            </h3>
            <p className="text-xs text-[var(--text-muted-warm,#c5b8a5)] mt-1 line-clamp-2 leading-relaxed">
              {verseSnippet ? `“${verseSnippet}”` : 'Share today’s sacred tithi and morning reflection with your family on WhatsApp.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Morning Blessing prompt"
          className="p-1.5 rounded-lg text-[var(--text-dim,#888)] hover:text-[var(--text-cream,#fff)] hover:bg-white/5 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          style={{
            backgroundColor: accent,
            color: '#1a1612',
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
          <span>{copied ? 'Copied Blessing!' : 'Share Morning Blessing on WhatsApp'}</span>
        </button>
      </div>
    </div>
  );
}
