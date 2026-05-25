'use client';

import { getTraditionMeta } from '@/lib/tradition-config';

interface Props {
  sankalpa: { id: string; text: string; start_date: string; end_date: string; tradition: string; related_practice?: string } | null;
  onSet: () => void;
  onComplete: () => void;
}

export default function SankalpaBanner({ sankalpa, onSet, onComplete }: Props) {
  if (!sankalpa) {
    return (
      <div 
        onClick={onSet}
        className="flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-transform active:scale-[0.98] mt-6"
        style={{ 
          background: 'rgba(197, 160, 89, 0.08)', 
          border: '1px solid rgba(197, 160, 89, 0.2)' 
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">🌅</span>
          <span className="text-sm font-medium theme-ink">Set your Sankalpa for this month</span>
        </div>
        <span className="text-[var(--brand-primary)]">→</span>
      </div>
    );
  }

  // Calculate days elapsed and progress
  const today = new Date();
  const start = new Date(sankalpa.start_date);
  const end = new Date(sankalpa.end_date);
  
  const totalMs = end.getTime() - start.getTime();
  const targetDays = Math.max(1, Math.floor(totalMs / (1000 * 60 * 60 * 24)));
  
  const elapsedMs = today.getTime() - start.getTime();
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
  
  const remainingDays = Math.max(0, targetDays - elapsedDays);
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / targetDays) * 100));

  const meta = getTraditionMeta(sankalpa.tradition);
  const accentColor = meta?.accentColour || 'var(--brand-primary)';

  return (
    <div className="rounded-3xl p-5 border shadow-sm relative overflow-hidden mt-6" 
         style={{ background: 'var(--surface-soft)', borderColor: 'var(--border-subtle)' }}>
      {/* Background progress bar hint */}
      <div 
        className="absolute bottom-0 left-0 h-1 transition-all duration-1000"
        style={{ width: `${progressPercent}%`, background: accentColor, opacity: 0.6 }}
      />
      
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
          🌅 Sankalpa
        </span>
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {remainingDays} days left
        </span>
      </div>
      
      <p className="text-[15px] font-serif leading-snug line-clamp-2 theme-ink mb-4">
        &ldquo;{sankalpa.text}&rdquo;
      </p>
      
      <div className="flex items-center justify-between mt-4">
        <div className="h-1.5 flex-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mr-4">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, background: accentColor }} />
        </div>
        
        <button 
          onClick={onComplete}
          className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-transform active:scale-[0.98]"
          style={{ borderColor: accentColor, color: accentColor, background: `${accentColor}11` }}
        >
          ✓ Complete
        </button>
      </div>
    </div>
  );
}
