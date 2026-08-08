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

  // [2]/[3]/[4] — the formatter downgrades an occurrence to 'ambiguous' when several dates
  // matched but no CITED tradition variant explains the difference. It is deliberately NOT
  // a dispute: the cause may be location, an unresolved uncertainty, or a rule error, and
  // we cannot tell which. Before this branch existed, 'ambiguous' fell through to the plain
  // disclaimer and rendered exactly like a confirmed date — the engine detected a conflict
  // and the UI silently dropped it.
  const isAmbiguous = status === 'ambiguous' && !isUnresolved && !hasDisputeVariants;

  if (!isUnresolved && !hasDisputeVariants && !isAmbiguous) {
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

      {/* State 2: AMBIGUOUS — several dates matched, no cited tradition rule explains it.
          Copy must never name a tradition here: the cause is unknown and is most often the
          observer's own location. Attributing it to a sampradaya would invent a dispute. */}
      {isAmbiguous && (
        <div className="clay-card rounded-2xl p-3.5 border-[#C5A059]/30 bg-gradient-to-br from-[#C5A059]/10 to-transparent flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="text-[#C5A059]" size={16} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#F2EAD6]">Date Not Confirmed</p>
            <p className="text-[color:var(--brand-muted)] mt-0.5 leading-snug">
              More than one date matched for this observance, and no recognised tradition rule
              accounts for the difference. The date shown is our best reading and is under review.
            </p>
          </div>
        </div>
      )}

      {/* State 3: DISPUTE — cited tradition variants differ at this location */}
      {hasDisputeVariants && (
        <div className="clay-card rounded-2xl p-3.5 border-[#C5A059]/30 bg-gradient-to-br from-[#C5A059]/10 to-transparent flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <GitFork className="text-[#C5A059]" size={16} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#F2EAD6]">Tradition Observance Variations</p>
            <p className="text-[color:var(--brand-muted)] mt-0.5 leading-snug">
              {requestedTradition
                ? `Your tradition (${requestedTradition}) observes on this date. Other recognised traditions observe on:`
                : 'This is the date shown for you. Other recognised traditions observe on:'}
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
