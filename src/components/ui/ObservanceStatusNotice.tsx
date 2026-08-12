'use client';

import React from 'react';
import { HelpCircle, GitFork, Info, AlertTriangle, MapPin, CheckCircle2 } from 'lucide-react';
import type { SourceReference } from '@sangam/dharma-rules';
import type { ResolvedCalendarContext } from '@/lib/calendar/calendar-context';
import {
  formatTraditionLabel,
  formatSourceProvenance,
  resolveNoticeDisplayState,
} from './observance-status-helpers';

export interface ObservanceAlternative {
  profile: {
    calendar: string;
    tradition: string;
  };
  civilDate: string | null;
  monthLabel?: string | null;
  note?: string | null;
  sourceRef?: SourceReference | null;
}

export interface ObservanceVariantItem {
  variantKey?: string;
  traditionKey?: string;
  traditionLabel: string;
  civilDate: string | null;
  formattedDate?: string;
  isPrimary?: boolean;
  profileEligibility?: string;
  sourceRef?: SourceReference | null;
  note?: string | null;
}

export interface ObservanceStatusNoticeProps {
  status?: 'resolved' | 'ambiguous' | 'unresolved' | 'under_review';
  reviewStatus?: string;
  isLocationEffectOnly?: boolean;
  engineError?: string | null;
  observanceName?: string;
  requestedTradition?: string;
  userProfileLabel?: string;
  userSampradaya?: string;
  primaryDate?: string | null;
  variants?: ObservanceVariantItem[];
  alternatives?: ObservanceAlternative[];
  sourceRefs?: SourceReference[];
  context?: ResolvedCalendarContext;
  className?: string;
}

export function ObservanceStatusNotice({
  status = 'resolved',
  reviewStatus,
  isLocationEffectOnly = false,
  engineError,
  observanceName,
  primaryDate,
  variants = [],
  alternatives = [],
  sourceRefs = [],
  context,
  className = '',
}: ObservanceStatusNoticeProps) {
  const {
    isUnsupportedProfile,
    isUnderReview,
    isLocationVarianceOnly,
    consolidatedVariants,
  } = resolveNoticeDisplayState({
    status,
    reviewStatus,
    isLocationEffectOnly,
    primaryDate,
    variants,
    alternatives,
    sourceRefs,
    context,
  });

  const hasVariants = consolidatedVariants.length > 0;

  return (
    <div className={`space-y-3 text-left ${className}`}>
      {/* ── State 1: ENGINE ERROR ────────────────────────────────────────────── */}
      {engineError && (
        <div className="clay-card rounded-2xl p-4 border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="text-rose-500" size={16} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-rose-200">Engine Calculation Notice</p>
            <p className="text-rose-100/80 mt-1 leading-relaxed">
              {engineError}
            </p>
          </div>
        </div>
      )}

      {/* ── State 2: UNSUPPORTED PROFILE / UNDER REVIEW (No guessed candidate selected) ── */}
      {isUnderReview && !engineError && (
        <div className="clay-card rounded-2xl p-4 border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-transparent flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <HelpCircle className="text-amber-400" size={16} />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-amber-200 text-sm">Under Review</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Scholar Review In Progress
              </span>
            </div>
            <p className="text-amber-100/80 mt-1 leading-relaxed">
              {isUnsupportedProfile
                ? 'Your profile parameters are unconfirmed or incomplete. Shoonaya does not select a guessed date when profile contracts are under review. Candidate dates are listed below.'
                : 'Multiple recognized source dates exist for this observance. Publication is withheld pending governance review.'}
            </p>
          </div>
        </div>
      )}

      {/* ── State 3: LOCATION-ONLY TIMING VARIANCE (Not a tradition dispute) ── */}
      {isLocationVarianceOnly && !isUnderReview && (
        <div className="clay-card rounded-2xl p-3.5 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="text-blue-400" size={16} />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-blue-200">Location-Based Timing Variance</p>
            <p className="text-blue-100/80 mt-0.5 leading-relaxed">
              Local sunrise or moonrise boundary causes the calendar date to differ at your location. This is a geographical calculation effect, not a tradition dispute.
            </p>
          </div>
        </div>
      )}

      {/* ── State 4: DISPUTED / TRADITION VARIANTS DISPLAY (All together in one card) ── */}
      {hasVariants && (
        <div className="clay-card rounded-2xl p-4 border-[#C5A059]/40 bg-gradient-to-br from-[#C5A059]/12 to-transparent space-y-3">
          <div className="flex items-center gap-2.5 border-b border-[#C5A059]/20 pb-2.5">
            <GitFork className="text-[#C5A059] shrink-0" size={18} />
            <div>
              <h4 className="text-xs font-bold text-[#F2EAD6] uppercase tracking-wider">
                Recognized Tradition Variants
              </h4>
              <p className="text-[11px] text-[color:var(--brand-muted)] mt-0.5">
                {observanceName ? `Sourced readings for ${observanceName}:` : 'Sourced tradition variants for this location:'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {consolidatedVariants.map((variant, idx) => {
              const isPrimary = Boolean(variant.isPrimary);
              const sourceLabel = formatSourceProvenance(variant.sourceRef);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    isPrimary
                      ? 'bg-[#C5A059]/20 border-[#C5A059]/60 text-white'
                      : 'bg-black/30 border-white/10 text-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isPrimary && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#C5A059] text-black font-extrabold uppercase tracking-wide">
                          <CheckCircle2 size={11} /> Primary for Your Profile
                        </span>
                      )}
                      <span>{variant.traditionLabel}</span>
                    </div>
                    <span className="font-mono font-bold text-[#C5A059] text-xs">
                      {variant.civilDate || 'Under Review'}
                    </span>
                  </div>

                  {variant.profileEligibility && (
                    <div className="text-[11px] opacity-80">
                      <span className="font-medium text-white/90">Eligibility:</span> {variant.profileEligibility}
                    </div>
                  )}

                  {variant.note && (
                    <div className="text-[11px] italic opacity-80">
                      Note: {variant.note}
                    </div>
                  )}

                  <div className="text-[10px] opacity-75 font-mono pt-1 border-t border-white/10 flex items-center justify-between">
                    <span>Source Pramana:</span>
                    <span className="text-[#C5A059]/90 font-medium truncate max-w-[240px] text-right">
                      {sourceLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standing Governance Disclaimer */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/40 px-1 pt-0.5">
        <Info size={11} className="shrink-0" />
        <span>Vedic dates depend on traditional calculation rules and geographical location.</span>
      </div>
    </div>
  );
}
