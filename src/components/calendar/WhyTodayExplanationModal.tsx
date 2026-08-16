'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Calendar, MapPin, BookOpen, Clock, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import type { ClientObservanceResult } from '@/lib/calendar/observance-formatter';
import type { ResolvedCalendarContext } from '@/lib/calendar/calendar-context';
import { mapWhyTodayExplanation } from '@/lib/calendar/why-today-mapper';

export interface WhyTodayExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  observance: ClientObservanceResult | null;
  context?: ResolvedCalendarContext;
}

// Styled to match the dark "living sky" glass aesthetic of its one current
// mount point (PanchangDetail.tsx) rather than the app's light --premium-*
// theme -- see the matching note in WhyTodayCard.tsx.
export function WhyTodayExplanationModal({
  isOpen,
  onClose,
  observance,
  context,
}: WhyTodayExplanationModalProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen || !observance) return null;

  const explanation = mapWhyTodayExplanation(observance, context);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="why-today-title"
        >
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-lg rounded-2xl border backdrop-blur-md text-white/90 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
            style={{ background: 'rgba(10,8,25,0.92)', borderColor: 'rgba(255,255,255,0.10)' }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[rgba(197,160,89,0.15)] border border-[#C5A059]/30 flex items-center justify-center text-2xl shrink-0">
                  {explanation.emoji}
                </div>
                <div>
                  <h2
                    id="why-today-title"
                    className="text-xl font-bold text-[#F2EAD6] leading-snug"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Why {explanation.title} Today?
                  </h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    {explanation.formattedDate}
                  </p>
                </div>
              </div>

              {/* Close Button — Min 44px touch target */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close why today modal"
                className="w-11 h-11 rounded-full flex items-center justify-center border border-white/15 bg-white/10 hover:bg-white/15 text-white/80 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1">
              {/* Description if present */}
              {explanation.description && (
                <p className="text-xs text-white/60 leading-relaxed italic border-l-2 border-[#C5A059] pl-3">
                  {explanation.description}
                </p>
              )}

              {/* Status & Review State Banner */}
              {explanation.reviewState.isUnderReview ? (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                  <AlertTriangle className="text-orange-300 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">
                      {explanation.reviewState.statusLabel}
                    </span>
                    <p className="text-xs text-orange-200/80 mt-1 leading-relaxed">
                      {explanation.reviewState.reviewReason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
                  <span className="text-xs font-semibold text-emerald-200">
                    {explanation.sources.length > 0
                      ? 'Published with tiered source metadata'
                      : 'Published calendar result; source metadata is unavailable in this response'}
                  </span>
                </div>
              )}

              {/* Profile & Calculation Location */}
              <div className="p-4 rounded-xl bg-white/[0.06] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                  <Calendar size={15} />
                  <span>Calendar Profile & Location</span>
                </div>
                <div className="text-xs text-white/90">
                  <span className="font-semibold">Profile:</span> {explanation.profileLabel}
                </div>
                {explanation.monthLabel && (
                  <div className="text-xs text-white/90 flex items-center justify-between">
                    <div>
                      <span className="font-semibold">Month Label:</span> {explanation.monthLabel.formattedLabel}
                    </div>
                    {explanation.monthLabel.isDivergentFromRuleDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Profile Convention
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-white/90 flex items-start gap-1.5">
                  <MapPin size={14} className="text-[#C5A059] shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Calculation Site:</span> {explanation.locationLabel}
                  </span>
                </div>
              </div>

              {/* Concise Evaluation Reasons */}
              {explanation.reasons.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle size={15} />
                    <span>Calculation Factors</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.reasons.map((r, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs"
                      >
                        <div className="font-semibold text-white/90 mb-0.5">
                          {r.label}
                        </div>
                        <div className="text-white/60 leading-relaxed">
                          {r.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclosures Section (latitude_proxy, compressed_night, etc) */}
              {explanation.disclosures.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={15} />
                    <span>Diagnostics & Disclosures</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.disclosures.map((d, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-xs border ${
                          d.severity === 'warning'
                            ? 'bg-orange-500/10 border-orange-500/25 text-orange-200/90'
                            : 'bg-blue-500/10 border-blue-500/25 text-blue-200/90'
                        }`}
                      >
                        <div className="font-semibold mb-0.5">{d.label}</div>
                        <div className="opacity-90 leading-relaxed">{d.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ritual Windows */}
              {explanation.ritualWindows.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-2">
                    <Clock size={15} />
                    <span>Prescribed Ritual Windows</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {explanation.ritualWindows.map((w, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-white/90">{w.label}</span>
                        <span className="font-mono text-white/60 bg-[rgba(197,160,89,0.10)] px-2.5 py-1 rounded-lg">
                          {w.timeRange}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recognized Alternatives / Disputed States */}
              {explanation.alternatives.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={15} />
                    <span>Recognized Sampradaya Variations</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white/90">
                            {alt.traditionLabel}
                          </div>
                          {alt.note && (
                            <div className="text-[11px] text-white/60 mt-0.5">
                              {alt.note}
                            </div>
                          )}
                        </div>
                        <div className="font-semibold text-[#C5A059] bg-[rgba(197,160,89,0.10)] px-3 py-1 rounded-full">
                          {alt.formattedDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source References & Tiers */}
              {explanation.sources.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={15} />
                    <span>Pramana & Sourced Authorities</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.sources.map((s, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs"
                      >
                        <div className="font-semibold text-white/90">
                          {s.title}
                        </div>
                        <div className="text-[11px] text-[#C5A059] font-medium mt-0.5">
                          {s.tier}
                        </div>
                        {s.citation && (
                          <div className="text-[11px] text-white/60 italic mt-0.5">
                            Citation: {s.citation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Button — Min 44px height */}
            <div className="p-4 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] rounded-full bg-[#C5A059] text-[#1c1c1a] font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                Close Explanation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
