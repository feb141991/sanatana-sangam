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
 */
export function WhyTodayCard({ observance, context, onOpenModal }: WhyTodayCardProps) {
  const exp = mapWhyTodayExplanation(observance, context);

  return (
    <div
      className="rounded-3xl p-5 border border-[rgba(200,146,74,0.25)] text-[var(--brand-primary-strong,#2C1A11)] shadow-sm space-y-4"
      style={{ background: 'linear-gradient(135deg, rgba(255,253,247,0.95), rgba(250,244,233,0.9))' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[rgba(200,146,74,0.12)] border border-[rgba(200,146,74,0.3)] flex items-center justify-center text-xl shrink-0">
            {exp.emoji}
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
              Why {exp.title} Today?
            </h3>
            <p className="text-xs text-[var(--brand-muted,#6E5849)] mt-0.5">
              {exp.formattedDate}
            </p>
          </div>
        </div>

        {exp.reviewState.isUnderReview && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
            Under Review
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-white/70 border border-[rgba(200,146,74,0.15)]">
          <div className="font-semibold text-[var(--premium-gold,#C8924A)] uppercase tracking-wider text-[10px]">
            Profile
          </div>
          <div className="font-medium text-[var(--brand-primary-strong)] mt-0.5 truncate">
            {exp.profileLabel}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/70 border border-[rgba(200,146,74,0.15)]">
          <div className="font-semibold text-[var(--premium-gold,#C8924A)] uppercase tracking-wider text-[10px]">
            Calculation Location
          </div>
          <div className="font-medium text-[var(--brand-primary-strong)] mt-0.5 truncate">
            {exp.locationLabel}
          </div>
        </div>
      </div>

      {exp.reasons.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="font-semibold text-[var(--brand-primary-strong)]">
            Primary Reason: <span className="font-normal text-[var(--brand-muted)]">{exp.reasons[0].description}</span>
          </div>
        </div>
      )}

      {exp.disclosures.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 flex items-start gap-2">
          <span className="font-bold">Notice:</span>
          <span>{exp.disclosures[0].description}</span>
        </div>
      )}

      {onOpenModal && (
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full min-h-[44px] rounded-full border border-[var(--premium-gold,#C8924A)] text-[var(--premium-gold,#C8924A)] hover:bg-[rgba(200,146,74,0.08)] font-bold text-xs transition-colors flex items-center justify-center"
        >
          View Full Breakdown & Pramana Sources →
        </button>
      )}
    </div>
  );
}
