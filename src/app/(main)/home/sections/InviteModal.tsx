'use client';

import { useState, useEffect } from 'react';
import { useReducedMotion, motion } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { APP } from '@/lib/config';
import { createClient } from '@/lib/supabase';

function generateInviteCode(userId: string): string {
  return userId.replace(/-/g, '').slice(-6).toUpperCase();
}

const TRADITION_EMOJIS: Record<string, string> = {
  hindu: '🕉️',
  sikh: '☬',
  buddhist: '☸️',
  jain: '🤲',
};

interface InviteModalProps {
  userId: string;
  onClose: () => void;
}

export function InviteModal({ userId, onClose }: InviteModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const code = generateInviteCode(userId);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP.BASE_URL;
  const link = `${baseUrl}/join?ref=${code}`;

  const [copied, setCopied] = useState(false);
  const [tradition, setTradition] = useState('hindu');
  const [referralCount, setReferralCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    
    async function fetchReferralAndTradition() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('founding_number, tradition')
          .eq('id', userId)
          .maybeSingle();

        if (!active) return;
        if (profile?.tradition) {
          setTradition(profile.tradition);
        }

        if (profile?.founding_number !== null && profile?.founding_number !== undefined) {
          const { count, error } = await supabase
            .from('referral_attributions')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_sthapaka_number', profile.founding_number);

          if (!error && count !== null && active) {
            setReferralCount(count);
          }
        }
      } catch (err) {
        console.error('Failed to fetch referral or tradition:', err);
      }
    }

    fetchReferralAndTradition();
    return () => {
      active = false;
    };
  }, [userId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied! 🙏');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    const shareText = `Join me on Shoonaya — your home for dharma, Panchang, scriptures, and community.\n\nUse my invite: ${code}\n${link}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Join me on Shoonaya 🙏', text: shareText, url: link });
        return;
      } catch {
        /* User cancelled or share failed */
      }
    }
    handleCopyLink();
  };

  const traditionEmoji = TRADITION_EMOJIS[tradition.toLowerCase()] ?? '✨';

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
      style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(200,146,74,0.08) 0%, transparent 60%), var(--premium-ivory)',
      }}
    >
      <motion.div
        className="w-full max-w-sm rounded-[24px] bg-white/80 p-6 py-8 relative shadow-2xl border"
        onClick={e => e.stopPropagation()}
        style={{
          borderColor: 'var(--premium-border)',
          boxShadow: '0 8px 40px rgba(62,42,31,0.10)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        initial={prefersReducedMotion ? undefined : { scale: 0.95, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
          aria-label="Close"
        >
          <X size={16} style={{ color: 'var(--brand-primary-strong)' }} />
        </button>

        <div className="flex flex-col items-center">
          {/* a. Icon */}
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-[rgba(200,146,74,0.1)] border-[1.5px] border-[rgba(200,146,74,0.3)]">
            <span className="text-[48px] leading-none">{traditionEmoji}</span>
          </div>

          {/* b. Heading */}
          <h2 className="font-serif text-[22px] font-bold text-center mt-4" style={{ color: 'var(--brand-primary-strong)' }}>
            Invite a Zeroist
          </h2>

          {/* c. Subhead */}
          <p className="text-[13px] text-center mt-2 leading-relaxed" style={{ color: 'var(--brand-muted)' }}>
            Share Shoonaya with a fellow seeker. Every Zeroist you bring earns you 50 Seva points.
          </p>
        </div>

        {/* d. Divider */}
        <div className="h-[1px] my-5" style={{ background: 'var(--premium-border)' }} />

        {/* e. Invite link box */}
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border"
          style={{ backgroundColor: 'var(--premium-ivory)', borderColor: 'var(--premium-border)' }}
        >
          <span className="font-mono text-xs truncate flex-1" style={{ color: 'var(--brand-primary-strong)' }}>
            {link}
          </span>
          <button
            onClick={handleCopyLink}
            className="font-semibold text-xs transition-colors shrink-0 outline-none"
            style={{ color: 'var(--premium-gold)' }}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>

        {/* f. Share button */}
        <button
          onClick={handleShare}
          className="w-full rounded-full text-white font-bold py-3.5 mt-5 transition-transform active:scale-[0.98] outline-none"
          style={{ backgroundColor: 'var(--premium-gold)' }}
        >
          Share with a Friend →
        </button>

        {/* g. Stats row */}
        {referralCount !== null && referralCount >= 0 && (
          <div className="flex justify-center gap-2 mt-5">
            <div
              className="px-3 py-1 rounded-full border text-xs"
              style={{
                backgroundColor: 'rgba(200,146,74,0.07)',
                borderColor: 'rgba(200,146,74,0.2)',
                color: 'var(--brand-primary-strong)',
              }}
            >
              {referralCount} Friend{referralCount !== 1 ? 's' : ''} joined
            </div>
            <div
              className="px-3 py-1 rounded-full border text-xs"
              style={{
                backgroundColor: 'rgba(200,146,74,0.07)',
                borderColor: 'rgba(200,146,74,0.2)',
                color: 'var(--brand-primary-strong)',
              }}
            >
              {referralCount * 50} Seva earned
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
