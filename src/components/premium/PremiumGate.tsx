'use client';

import { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import PremiumActivateModal from './PremiumActivateModal';

interface Props {
  children: React.ReactNode;
  /** What to show in place of locked content. Defaults to a standard pill. */
  fallback?: React.ReactNode;
  /** If true, renders children blurred/overlayed instead of replacing them */
  blur?: boolean;
  /** Small compact badge variant */
  compact?: boolean;
}

export default function PremiumGate({ children, fallback, blur, compact }: Props) {
  const isPro = usePremium();
  const [showModal, setShowModal] = useState(false);

  if (isPro) return <>{children}</>;

  if (blur) {
    return (
      <>
        <div className="relative select-none pointer-events-none">
          <div className="opacity-30 blur-[3px]">{children}</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <UpgradePill compact={compact} onClick={() => setShowModal(true)} />
          </div>
        </div>
        <PremiumActivateModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      {fallback ?? <UpgradePill compact={compact} onClick={() => setShowModal(true)} />}
      <PremiumActivateModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

// ── Upgrade prompt pill ───────────────────────────────────────────────────────
function UpgradePill({ compact, onClick }: { compact?: boolean; onClick: () => void }) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(200,146,74,0.18), rgba(180,120,10,0.18))',
          border: '1px solid rgba(200,146,74,0.3)',
          color: 'var(--brand-primary-strong)',
        }}
      >
        <Lock size={9} />
        Pro
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(200,146,74,0.12), rgba(180,120,10,0.10))',
        border: '1px solid rgba(200,146,74,0.25)',
        color: 'var(--brand-primary-strong)',
      }}
    >
      <Sparkles size={14} />
      <span className="text-sm font-semibold">Unlock with Sangam Pro</span>
    </button>
  );
}
