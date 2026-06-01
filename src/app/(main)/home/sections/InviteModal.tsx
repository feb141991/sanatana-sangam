'use client';

import { useReducedMotion, motion } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { APP } from '@/lib/config';

function generateInviteCode(userId: string): string {
  return userId.replace(/-/g, '').slice(-6).toUpperCase();
}

interface InviteModalProps {
  userId: string;
  onClose: () => void;
}

export function InviteModal({ userId, onClose }: InviteModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const code    = generateInviteCode(userId);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP.BASE_URL;
  const link    = `${baseUrl}/join?ref=${code}`;

  async function share() {
    const shareText = `Join me on Shoonaya — your home for dharma, Panchang, scriptures, and community.\n\nUse my invite: ${code}\n${link}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Join me on Shoonaya 🙏', text: shareText, url: link });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Invite link copied! 🙏');
    } catch {
      window.prompt('Copy your invite link:', link);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      <motion.div
        className="w-full rounded-t-[2rem] p-6 space-y-5"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, var(--surface-raised), var(--card-bg))',
          borderTop: '1px solid rgba(197, 160, 89, 0.20)',
          boxShadow: '0 -20px 48px rgba(0, 0, 0, 0.24)',
          backdropFilter: 'blur(22px) saturate(125%)',
          WebkitBackdropFilter: 'blur(22px) saturate(125%)',
        }}
        initial={prefersReducedMotion ? undefined : { y: 32, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { y: 20, opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'rgba(197, 160, 89, 0.28)' }} />

        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>
            Invite Friends &amp; Family
          </h3>
          <button onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center motion-press bg-transparent border-0 outline-none"
            style={{ background: 'rgba(197, 160, 89, 0.10)' }}>
            <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
          </button>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>
          Share Shoonaya with your family and friends. They can use your invite code while joining.
        </p>

        <div
          className="rounded-[1.4rem] p-5 text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.12), var(--card-bg))',
            borderColor: 'rgba(197, 160, 89, 0.18)',
          }}
        >
          <p className="text-[10px] mb-2 font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-dim)' }}>Your Invite Code</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand-primary)' }}>{code}</p>
          <p className="text-[11px] mt-2" style={{ color: 'var(--text-dim)' }}>{link}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={share}
            className="py-3 font-semibold rounded-2xl text-sm border-0 outline-none"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))', color: '#1a1610' }}>
            Share 🙏
          </button>
          <button onClick={async () => {
            await navigator.clipboard.writeText(code);
            toast.success('Code copied!');
          }}
            className="py-3 font-semibold rounded-2xl border text-sm"
            style={{
              color: 'var(--brand-primary)',
              borderColor: 'rgba(197, 160, 89, 0.20)',
              background: 'rgba(44, 38, 28, 0.88)',
            }}>
            Copy Code
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--text-dim)' }}>
          🙏 Spread the light of dharma
        </p>
      </motion.div>
    </motion.div>
  );
}
