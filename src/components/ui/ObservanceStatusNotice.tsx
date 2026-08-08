'use client';

import React from 'react';
import { HelpCircle, GitFork, Info } from 'lucide-react';

export interface ObservanceAlternative {
  profile: {
    calendar: string;
    tradition: string;
  };
  civilDate: string | null;
  monthLabel?: string | null;
  note?: string | null;
}

export interface ObservanceStatusNoticeProps {
  status: 'resolved' | 'ambiguous' | 'unresolved';
  reviewStatus?: string;
  alternatives?: ObservanceAlternative[];
  requestedTradition?: string;
  className?: string;
}

export function ObservanceStatusNotice({
  status,
  reviewStatus,
  alternatives = [],
  requestedTradition,
  className = '',
}: ObservanceStatusNoticeProps) {
  const isUnresolved = status === 'unresolved' || reviewStatus === 'in_review' || reviewStatus === 'needs_review';
  const hasDisputeVariants = alternatives.length > 0 && alternatives.some(a => a.civilDate !== null);

  if (!isUnresolved && !hasDisputeVariants) {
    return (
      <div className={`flex items-center gap-1.5 text-[10px] text-white/40 px-1 pt-1 ${className}`}>
        <Info size={11} className="shrink-0 text-[#C5A059]/60" />
        <span>Vedic dates depend on traditional calculation rules and geographical location.</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 text-left ${className}`}>
      {/* State 1: UNDER REVIEW — engine could not settle it */}
      {isUnresolved && !hasDisputeVariants && (
        <div className="clay-card rounded-2xl p-3.5 border-[#C5A059]/30 bg-gradient-to-br from-[#C5A059]/10 to-transparent flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <HelpCircle className="text-[#C5A059]" size={16} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#F2EAD6]">Under Review</p>
            <p className="text-[color:var(--brand-muted)] mt-0.5 leading-snug">
              The engine could not settle an exact date for this location. A scholar review is in progress.
            </p>
          </div>
        </div>
      )}

      {/* State 2: DISPUTE — cited tradition variants differ at this location */}
      {hasDisputeVariants && (
        <div className="clay-card rounded-2xl p-3.5 border-[#C5A059]/30 bg-gradient-to-br from-[#C5A059]/10 to-transparent flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <GitFork className="text-[#C5A059]" size={16} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#F2EAD6]">Tradition Observance Variations</p>
            <p className="text-[color:var(--brand-muted)] mt-0.5 leading-snug">
              Your tradition ({requestedTradition || 'Primary'}) observes on this date. Other recognized traditions observe on:
            </p>
            <div className="mt-2 space-y-1">
              {alternatives.map((alt, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-black/20 rounded-lg px-2.5 py-1 text-white/80">
                  <span className="capitalize">{alt.profile.tradition.replace('_', ' ')}:</span>
                  <span className="font-semibold text-[#C5A059]">{alt.civilDate || 'Under Review'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Standing Disclaimer */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/40 px-1 pt-0.5">
        <Info size={11} className="shrink-0" />
        <span>Vedic dates depend on traditional calculation rules and geographical location.</span>
      </div>
    </div>
  );
}
