'use client';

/**
 * SocialShareDrawer — full social sharing panel for the profile page.
 *
 * Replaces the single WhatsApp button with a proper share menu covering:
 *  · Web Share API (native sheet)
 *  · WhatsApp deep link
 *  · Twitter / X
 *  · Copy profile link
 *
 * This is the Brand Recognition build — makes every profile a shareable
 * artefact and creates organic distribution across existing social channels.
 */

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Share2, X, Copy, Check, ExternalLink,
  Twitter, MessageCircle, Link2, Globe,
} from 'lucide-react';

interface SocialShareDrawerProps {
  userId: string;
  userName: string;
  streak?: number;
  tradition?: string | null;
  onClose: () => void;
}

const BASE = 'https://shoonaya.app';

type CopyState = 'idle' | 'copied';

export default function SocialShareDrawer({
  userId, userName, streak = 0, tradition, onClose,
}: SocialShareDrawerProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const profileUrl = `${BASE}/profile/${userId}`;
  const inviteUrl  = `${BASE}/invite/${userId}`;
  const firstName  = userName.split(' ')[0];

  const streakLine = streak > 0 ? ` ${streak}-day sadhana streak 🔥` : '';
  const shareText  = `${firstName} is on a spiritual journey on Shoonaya.${streakLine} Join me 🙏`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {/* blocked */}
  }, [inviteUrl]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: `${firstName} on Shoonaya`, text: shareText, url: inviteUrl });
      onClose();
    } catch {/* cancelled */}
  }, [firstName, shareText, inviteUrl, onClose]);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${inviteUrl}`)}`;
  const twitterHref  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(inviteUrl)}`;

  const CHANNELS = [
    ...(typeof navigator !== 'undefined' && 'share' in navigator
      ? [{ id: 'native', icon: Globe, label: 'Share…', desc: 'Native share sheet', color: '#C5A059', action: nativeShare, href: null }]
      : []),
    { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', desc: 'Send to a contact or group', color: '#22c55e', action: null, href: whatsappHref },
    { id: 'twitter', icon: Twitter, label: 'Twitter / X', desc: 'Post your practice', color: '#1d9bf0', action: null, href: twitterHref },
    { id: 'copy', icon: copyState === 'copied' ? Check : Copy, label: copyState === 'copied' ? 'Copied!' : 'Copy invite link', desc: `shoonaya.app/invite/${userId.slice(0,8)}…`, color: '#C5A059', action: copyLink, href: null },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div
          className="rounded-t-[2rem] px-5 pt-4 pb-8"
          style={{
            background: 'var(--bg-modal, #1a1107)',
            border: '1px solid rgba(197,160,89,0.18)',
            borderBottom: 'none',
          }}
        >
          {/* Handle */}
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(197,160,89,0.30)' }} />

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Share your practice
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Invite friends to the path
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
          </div>

          {/* Preview card */}
          <div
            className="rounded-2xl px-4 py-3 mb-5 text-sm leading-snug"
            style={{
              background: 'rgba(197,160,89,0.08)',
              border: '1px solid rgba(197,160,89,0.18)',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {shareText}
          </div>

          {/* Channel buttons */}
          <div className="space-y-2.5">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const content = (
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${ch.color}18`, border: `1px solid ${ch.color}28` }}
                  >
                    <Icon size={18} style={{ color: ch.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{ch.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{ch.desc}</p>
                  </div>
                  {ch.href && <ExternalLink size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />}
                </div>
              );

              if (ch.href) {
                return (
                  <a
                    key={ch.id}
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={ch.action ?? undefined}
                  className="w-full rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* Profile link */}
          <div className="mt-4 flex items-center gap-2">
            <Link2 size={11} style={{ color: 'rgba(197,160,89,0.5)' }} />
            <p className="text-[10px] truncate" style={{ color: 'rgba(197,160,89,0.5)' }}>
              {profileUrl}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
