'use client';

import React from 'react';
import type { ClientObservanceResult } from '@/lib/calendar/observance-formatter';
import type { ResolvedCalendarContext } from '@/lib/calendar/calendar-context';
import { mapWhyTodayExplanation } from '@/lib/calendar/why-today-mapper';

export interface WhyTodayCardProps {
  observance: ClientObservanceResult;
  context?: ResolvedCalendarContext;
  onOpenModal?: () => void;
}

/**
 * Shared inline card for "Why Today?" preview embedded on observance detail pages or feeds.
 * Uses mapWhyTodayExplanation data mapper.
 *
 * Styled to match the dark "living sky" glass aesthetic of its one current
 * mount point (PanchangDetail.tsx) rather than the app's light --premium-*
 * theme -- this card is never seen outside that page today, so it should
 * read as part of it, not as a light card dropped onto a night sky.
 */
export function WhyTodayCard({ observance, context, onOpenModal }: WhyTodayCardProps) {
  const exp = mapWhyTodayExplanation(observance, context);

  return (
    <div
      className="rounded-2xl p-5 border backdrop-blur-md text-white/90 shadow-sm space-y-4"
      style={{ background: 'rgba(10,8,25,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(197,160,89,0.15)] border border-[#C5A059]/30 flex items-center justify-center text-xl shrink-0">
            {exp.emoji}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F2EAD6]" style={{ fontFamily: 'var(--font-serif)' }}>
              Why {exp.title} Today?
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              {exp.formattedDate}
            </p>
          </div>
        </div>

        {exp.reviewState.isUnderReview && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            Under Review
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
          <div className="font-semibold text-[#C5A059] uppercase tracking-wider text-[10px]">
            Profile
          </div>
          <div className="font-medium text-white/90 mt-0.5 truncate">
            {exp.profileLabel}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
          <div className="font-semibold text-[#C5A059] uppercase tracking-wider text-[10px]">
            Calculation Location
          </div>
          <div className="font-medium text-white/90 mt-0.5 truncate">
            {exp.locationLabel}
          </div>
        </div>
      </div>

      {exp.reasons.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="font-semibold text-white/90">
            Primary Reason: <span className="font-normal text-white/60">{exp.reasons[0].description}</span>
          </div>
        </div>
      )}

      {exp.disclosures.length > 0 && (
        <div className="p-3 rounded-xl text-xs text-amber-200/80 flex items-start gap-2"
          style={{ background: 'rgba(255,200,100,0.08)', border: '1px solid rgba(255,200,100,0.15)' }}>
          <span className="font-bold text-amber-200">Notice:</span>
          <span>{exp.disclosures[0].description}</span>
        </div>
      )}

      {onOpenModal && (
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full min-h-[44px] rounded-full border border-[#C5A059] text-[#C5A059] hover:bg-[rgba(197,160,89,0.08)] font-bold text-xs transition-colors flex items-center justify-center"
        >
          View Full Breakdown →
        </button>
      )}
    </div>
  );
}
