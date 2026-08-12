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
            className="relative w-full max-w-lg rounded-3xl bg-[var(--premium-ivory,#FAF6EF)] border border-[var(--premium-border,rgba(200,146,74,0.3))] text-[var(--brand-primary-strong,#2C1A11)] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,253,247,0.98), rgba(250,244,233,0.96))',
            }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[var(--premium-border,rgba(200,146,74,0.2))] flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[rgba(200,146,74,0.12)] border border-[rgba(200,146,74,0.3)] flex items-center justify-center text-2xl shrink-0">
                  {explanation.emoji}
                </div>
                <div>
                  <h2
                    id="why-today-title"
                    className="text-xl font-bold text-[var(--brand-primary-strong,#2C1A11)] leading-snug"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Why {explanation.title} Today?
                  </h2>
                  <p className="text-xs text-[var(--brand-muted,#6E5849)] mt-0.5">
                    {explanation.formattedDate}
                  </p>
                </div>
              </div>

              {/* Close Button — Min 44px touch target */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close why today modal"
                className="w-11 h-11 rounded-full flex items-center justify-center border border-[rgba(200,146,74,0.2)] bg-white/60 hover:bg-[rgba(200,146,74,0.1)] text-[var(--brand-primary-strong)] transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1">
              {/* Description if present */}
              {explanation.description && (
                <p className="text-xs text-[var(--brand-muted,#6E5849)] leading-relaxed italic border-l-2 border-[var(--premium-gold,#C8924A)] pl-3">
                  {explanation.description}
                </p>
              )}

              {/* Status & Review State Banner */}
              {explanation.reviewState.isUnderReview ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      {explanation.reviewState.statusLabel}
                    </span>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      {explanation.reviewState.reviewReason}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <ShieldCheck className="text-emerald-700 shrink-0" size={18} />
                  <span className="text-xs font-semibold text-emerald-900">
                    {explanation.sources.length > 0
                      ? 'Published with tiered source metadata'
                      : 'Published calendar result; source metadata is unavailable in this response'}
                  </span>
                </div>
              )}

              {/* Profile & Calculation Location */}
              <div className="p-4 rounded-2xl bg-white/70 border border-[rgba(200,146,74,0.2)] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--premium-gold,#C8924A)] uppercase tracking-wider">
                  <Calendar size={15} />
                  <span>Calendar Profile & Location</span>
                </div>
                <div className="text-xs text-[var(--brand-primary-strong)]">
                  <span className="font-semibold">Profile:</span> {explanation.profileLabel}
                </div>
                {explanation.monthLabel && (
                  <div className="text-xs text-[var(--brand-primary-strong)] flex items-center justify-between">
                    <div>
                      <span className="font-semibold">Month Label:</span> {explanation.monthLabel.formattedLabel}
                    </div>
                    {explanation.monthLabel.isDivergentFromRuleDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20">
                        Profile Convention
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-[var(--brand-primary-strong)] flex items-start gap-1.5">
                  <MapPin size={14} className="text-[var(--premium-gold)] shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Calculation Site:</span> {explanation.locationLabel}
                  </span>
                </div>
              </div>

              {/* Concise Evaluation Reasons */}
              {explanation.reasons.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-[var(--premium-gold,#C8924A)] uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle size={15} />
                    <span>Calculation Factors</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.reasons.map((r, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/60 border border-[rgba(200,146,74,0.15)] text-xs"
                      >
                        <div className="font-semibold text-[var(--brand-primary-strong)] mb-0.5">
                          {r.label}
                        </div>
                        <div className="text-[var(--brand-muted)] leading-relaxed">
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
                  <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={15} />
                    <span>Diagnostics & Disclosures</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.disclosures.map((d, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl text-xs border ${
                          d.severity === 'warning'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-blue-50/80 border-blue-200 text-blue-900'
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
                  <h3 className="text-xs font-bold text-[var(--premium-gold,#C8924A)] uppercase tracking-wider flex items-center gap-2">
                    <Clock size={15} />
                    <span>Prescribed Ritual Windows</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {explanation.ritualWindows.map((w, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/60 border border-[rgba(200,146,74,0.15)] flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-[var(--brand-primary-strong)]">{w.label}</span>
                        <span className="font-mono text-[var(--brand-muted)] bg-[rgba(200,146,74,0.08)] px-2.5 py-1 rounded-lg">
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
                  <h3 className="text-xs font-bold text-[var(--premium-gold,#C8924A)] uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={15} />
                    <span>Recognized Sampradaya Variations</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/70 border border-[rgba(200,146,74,0.2)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[var(--brand-primary-strong)]">
                            {alt.traditionLabel}
                          </div>
                          {alt.note && (
                            <div className="text-[11px] text-[var(--brand-muted)] mt-0.5">
                              {alt.note}
                            </div>
                          )}
                        </div>
                        <div className="font-semibold text-[var(--premium-gold)] bg-[rgba(200,146,74,0.1)] px-3 py-1 rounded-full">
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
                  <h3 className="text-xs font-bold text-[var(--premium-gold,#C8924A)] uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={15} />
                    <span>Pramana & Sourced Authorities</span>
                  </h3>
                  <div className="space-y-2">
                    {explanation.sources.map((s, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/60 border border-[rgba(200,146,74,0.15)] text-xs"
                      >
                        <div className="font-semibold text-[var(--brand-primary-strong)]">
                          {s.title}
                        </div>
                        <div className="text-[11px] text-[var(--premium-gold)] font-medium mt-0.5">
                          {s.tier}
                        </div>
                        {s.citation && (
                          <div className="text-[11px] text-[var(--brand-muted)] italic mt-0.5">
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
            <div className="p-4 border-t border-[rgba(200,146,74,0.2)] bg-white/80 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] rounded-full bg-[var(--premium-gold,#C8924A)] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center"
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
