'use client';

/**
 * MilestoneShareCard — viral sharing moment at streak milestones.
 *
 * The diaspora's primary social channel is WhatsApp. When a user hits a streak
 * milestone, this card gives them a beautiful shareable moment that looks great
 * as a screenshot and carries the invite link — zero marketing budget required.
 *
 * Milestones: 7 / 21 / 40 / 108 days (traditional Vedic cycles)
 *
 * UX:
 * - Appears above the WeeklyHabitRow when the user's japaStreak hits a milestone
 * - Dismissable per milestone — each milestone only prompts once
 * - Shares via Web Share API (native sheet on mobile) or clipboard fallback
 * - Dismissed state stored in localStorage keyed by milestone number
 */

import { useState, useCallback } from 'react';
import { Share2, X, Flame, Copy, Check } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';
import { shareShoonayaShareCard } from '@/lib/share/shoonaya-card-data';
import SacredGlowIcon from '@/components/ui/SacredGlowIcon';

const MILESTONES = [7, 21, 40, 108] as const;
type Milestone = (typeof MILESTONES)[number];

const MILESTONE_COPY: Record<Milestone, { title: string; body: string }> = {
  7:   { title: '7-day streak!',  body: 'I completed 7 days of daily sadhana on Shoonaya. Join me 🙏' },
  21:  { title: '21-day streak!', body: '21 days — a habit takes root. Daily sadhana on Shoonaya has changed my mornings. Join me' },
  40:  { title: '40-day vow!',    body: '40 days of unbroken sadhana on Shoonaya. The path becomes the practice 🕉️' },
  108: { title: '108 days!',      body: '108 days of daily practice on Shoonaya — the sacred number complete 🪔 Join me on the path' },
};

const TRADITION_SYMBOLS: Record<string, string> = {
  hindu: '🕉️',
  sikh: '☬',
  buddhist: '☸️',
  jain: '🤲',
};

function getActiveMilestone(streak: number): Milestone | null {
  // Exact match — we only show this card on the day the milestone is hit
  return MILESTONES.includes(streak as Milestone) ? (streak as Milestone) : null;
}

function dismissedKey(milestone: Milestone): string {
  return `shoonaya-milestone-shared-${milestone}`;
}

function isAlreadyDismissed(milestone: Milestone): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(dismissedKey(milestone)));
}

interface MilestoneShareCardProps {
  japaStreak: number;
  userId: string;
  userName?: string;
  tradition?: string | null;
}

export default function MilestoneShareCard({
  japaStreak,
  userId,
  userName,
  tradition,
}: MilestoneShareCardProps) {
  const milestone = getActiveMilestone(japaStreak);
  const [dismissed, setDismissed] = useState(() =>
    milestone ? isAlreadyDismissed(milestone) : true
  );
  const [copied, setCopied] = useState(false);

  const meta   = getTraditionMeta(tradition ?? 'hindu');
  const accent = meta.accentColour ?? '#C5A059';
  const symbol = TRADITION_SYMBOLS[tradition ?? 'hindu'] ?? '🕉️';

  const dismiss = useCallback(() => {
    if (milestone) localStorage.setItem(dismissedKey(milestone), '1');
    setDismissed(true);
  }, [milestone]);

  const share = useCallback(async () => {
    if (!milestone) return;
    const copy = MILESTONE_COPY[milestone];
    const base = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com');
    const url  = `${base}/invite/${userId}`;
    const text = `${copy.body}\n\n${url}`;

    // Primary: the reusable premium card. The invite URL rides along in the
    // native sheet so WhatsApp recipients get the visual card + a tappable link.
    const result = await shareShoonayaShareCard(
      {
        tradition: tradition ?? 'hindu',
        streakCount: japaStreak,
        caption: copy.body,
        userName: userName || undefined,
      },
      {
        fileName: 'shoonaya-streak-card.png',
        shareTitle: `Shoonaya — ${copy.title}`,
        shareText: copy.body,
        shareUrl: url,
      },
    );

    if (result === 'shared' || result === 'downloaded') { dismiss(); return; }
    if (result === 'cancelled') return; // user dismissed — neutral, not a failure

    // Image path failed — fall back to native text share, then clipboard.
    if (navigator.share) {
      try {
        await navigator.share({ title: `Shoonaya — ${copy.title}`, text: copy.body, url });
        dismiss();
        return;
      } catch {
        /* cancelled — fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => { setCopied(false); dismiss(); }, 2500);
    } catch {
      dismiss();
    }
  }, [milestone, userId, dismiss, japaStreak, tradition, userName]);

  if (!milestone || dismissed) return null;

  const copy = MILESTONE_COPY[milestone];

  return (
    <div className="px-5 mb-4">
      <div
        className="rounded-2xl px-4 py-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 60%, transparent 100%)`,
          border: `1px solid ${accent}35`,
          boxShadow: `0 0 30px ${accent}15`,
        }}
      >
        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X size={13} style={{ color: 'var(--brand-muted)' }} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
          >
            <SacredGlowIcon color={accent} size={30} variant="milestone" animated>
              <Flame size={18} style={{ color: accent }} />
            </SacredGlowIcon>
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--brand-ink)' }}>
              {symbol} {copy.title}
            </p>
            {userName && (
              <p className="text-[11px]" style={{ color: 'var(--brand-muted)' }}>
                Well done, {userName.split(' ')[0]}
              </p>
            )}
          </div>
        </div>

        {/* Share card preview */}
        <div
          className="rounded-xl px-3 py-2.5 mb-3 text-xs leading-relaxed"
          style={{
            background: `${accent}0a`,
            border: `1px solid ${accent}18`,
            color: 'var(--brand-muted)',
          }}
        >
          {copy.body}
        </div>

        {/* Share button */}
        <button
          type="button"
          onClick={share}
          className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95"
          style={{ background: accent, color: '#0E0E0F', boxShadow: `0 0 14px ${accent}33` }}
        >
          {copied ? (
            <>
              <SacredGlowIcon color="var(--brand-ink)" size={22} variant="active">
                <Check size={13} />
              </SacredGlowIcon>
              Copied!
            </>
          ) : (
            <>{typeof navigator !== 'undefined' && 'share' in navigator
              ? (
                <>
                  <SacredGlowIcon color="var(--brand-ink)" size={22} variant="active" animated>
                    <Share2 size={13} />
                  </SacredGlowIcon>
                  Share your milestone
                </>
              )
              : (
                <>
                  <SacredGlowIcon color="var(--brand-ink)" size={22} variant="active">
                    <Copy size={13} />
                  </SacredGlowIcon>
                  Copy to share
                </>
              )
            }</>
          )}
        </button>
      </div>
    </div>
  );
}
