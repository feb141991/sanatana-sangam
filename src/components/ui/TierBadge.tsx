'use client';

import { getTierFromScore, getNextTier, getProgressToNextTier } from '@/lib/seva-tiers';

interface TierBadgeProps {
  sevaScore: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export default function TierBadge({ sevaScore, size = 'md', showProgress = false }: TierBadgeProps) {
  const current = getTierFromScore(sevaScore);
  const next = getNextTier(sevaScore);
  
  let sizeClasses = '';
  if (size === 'sm') {
    sizeClasses = 'text-[9px] px-2 py-0.5';
  } else if (size === 'md') {
    sizeClasses = 'text-[11px] px-3 py-1';
  } else if (size === 'lg') {
    sizeClasses = 'text-sm px-4 py-1.5';
  }

  const glowStyles = current.glow ? {
    boxShadow: '0 0 12px rgba(197,160,89,0.35)',
    border: '1px solid rgba(197,160,89,0.6)'
  } : {};

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-[240px]">
      <div 
        className={`rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold whitespace-nowrap ${sizeClasses}`}
        style={glowStyles}
      >
        {current.emoji} {current.label}  ·  {current.sanskrit}
      </div>
      
      {showProgress && next && (
        <div className="w-full text-center mt-1">
          <div className="h-[2px] rounded-full bg-amber-500/10 w-full overflow-hidden">
            <div 
              className="h-[2px] rounded-full bg-amber-500 transition-all duration-500" 
              style={{ width: `${getProgressToNextTier(sevaScore)}%` }} 
            />
          </div>
          <p className="text-[9px] text-amber-500/50 mt-1 uppercase tracking-widest">
            {sevaScore - current.min} / {next.min - current.min} seva to {next.label}
          </p>
        </div>
      )}
    </div>
  );
}
