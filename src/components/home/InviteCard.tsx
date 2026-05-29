'use client';

/**
 * InviteCard — viral referral widget for the home page.
 *
 * The #1 driver of installed-base growth is existing users inviting friends.
 * This card gives them a frictionless one-tap share with tradition-aware copy.
 *
 * Uses Web Share API where available (mobile), falls back to clipboard copy.
 * Deep link format: https://shoonaya.app?ref=<userId>
 * (The ref param can be picked up during signup to track referrals later.)
 */

import { useState } from 'react';
import { Share2, Copy, Check, Users } from 'lucide-react';
import { getTraditionMeta } from '@/lib/tradition-config';

interface InviteCardProps {
  userId: string;
  userName?: string;
  tradition?: string | null;
}

const SHARE_COPY: Record<string, string> = {
  hindu:    "I've been using Shoonaya for daily sadhana — japa, panchang, Gita study. Join me 🕉️",
  sikh:     "Shoonaya is a beautiful space for Nitnem, Gurbani study and connecting with the sangat ☬",
  buddhist: "Using Shoonaya to track daily practice — meditation, Dhammapada study and more ☸️",
  jain:     "Shoonaya brings dharmic practice to daily life — japa, pathshala and community 🤲",
};

const BASE_URL = 'https://shoonaya.app';

// Same deterministic code as HomeDashboard → InviteModal
function generateInviteCode(userId: string): string {
  return userId.replace(/-/g, '').slice(-6).toUpperCase();
}

export default function InviteCard({ userId, userName, tradition }: InviteCardProps) {
  const [copied, setCopied] = useState(false);

  const meta      = getTraditionMeta(tradition ?? 'hindu');
  const accent    = meta.accentColour ?? '#C5A059';
  // Personalised landing page — shows inviter name, tradition copy, proper CTA
  // Previously shared /?ref=userId which hit landing.html and lost the ref param
  const refUrl    = `${BASE_URL}/invite/${userId}`;
  const shareText = SHARE_COPY[tradition ?? 'hindu'] ?? SHARE_COPY.hindu;
  const fullText  = `${shareText}\n\n${refUrl}`;

  async function handleShare() {
    // Web Share API — native sheet on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shoonaya — Daily Dharmic Practice',
          text:  shareText,
          url:   refUrl,
        });
        return;
      } catch {
        /* user cancelled or not supported — fall through to clipboard */
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked — nothing to do */
    }
  }

  return (
    <div className="px-5 mb-5">
      <div
        className="rounded-2xl px-4 py-4"
        style={{
          background: `linear-gradient(135deg, ${accent}0d 0%, transparent 70%)`,
          border: `1px solid ${accent}22`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}15`, border: `1px solid ${accent}28` }}
          >
            <Users size={18} style={{ color: accent }} />
          </div>

          {/* Copy */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--brand-ink)' }}>
              {userName
                ? `${userName.split(' ')[0]}, bring someone to the path`
                : 'Bring a seeker to the path'}
            </p>
            <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--brand-muted)' }}>
              Share Shoonaya with a friend or family member
            </p>
          </div>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold shrink-0 transition-all active:scale-95"
            style={{
              background: accent,
              color: '#0E0E0F',
              boxShadow: `0 0 14px ${accent}33`,
            }}
          >
            {copied ? (
              <>
                <Check size={13} />
                Copied!
              </>
            ) : (
              <>
                {typeof navigator !== 'undefined' && 'share' in navigator
                  ? <Share2 size={13} />
                  : <Copy size={13} />}
                Invite
              </>
            )}
          </button>
        </div>

        {/* Referral link preview */}
        <div
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[10px]"
          style={{
            background: `${accent}0a`,
            border: `1px solid ${accent}18`,
          }}
        >
          <span style={{ color: 'var(--brand-muted)' }}>Your invite link:</span>
          <span className="font-mono truncate flex-1" style={{ color: accent }}>
            shoonaya.app/invite/{userId.slice(0, 8)}…
          </span>
        </div>
      </div>
    </div>
  );
}
