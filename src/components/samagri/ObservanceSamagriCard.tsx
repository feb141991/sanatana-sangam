'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, ChevronDown, ChevronUp, Package, Clock, Check } from 'lucide-react';
import type { ObservanceSamagriPayload } from '@/types/samagri';

interface ObservanceSamagriCardProps {
  payload: ObservanceSamagriPayload;
  className?: string;
  onSelectPreorder?: (productId: string) => void;
}

export function ObservanceSamagriCard({
  payload,
  className = '',
  onSelectPreorder,
}: ObservanceSamagriCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reserved, setReserved] = useState(false);
  const { kit, ritualContext } = payload;

  const handleReserve = () => {
    setReserved(true);
    if (onSelectPreorder) {
      onSelectPreorder(kit.id);
    }
  };

  return (
    <div
      className={`rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)]/90 backdrop-blur-md p-6 sm:p-7 shadow-sm transition-all ${className}`}
    >
      {/* ── Header Ribbon ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
          <Sparkles className="size-3 text-amber-600 dark:text-amber-400" />
          Altar Preparation & Sacred Samagri
        </div>

        {ritualContext.recommendedOrderDeadline && (
          <div className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted-warm)] font-medium">
            <Clock className="size-3.5 text-amber-600/80" />
            <span>Order before {ritualContext.recommendedOrderDeadline} for timely delivery</span>
          </div>
        )}
      </div>

      {/* ── Product Hero Layout ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {/* Emblem / Image */}
        <div className="relative size-20 sm:size-24 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-900/10 border border-amber-500/20 p-2 shrink-0 flex items-center justify-center overflow-hidden">
          <Image
            src={kit.image}
            alt={kit.title}
            width={72}
            height={72}
            className="object-contain filter drop-shadow-md"
          />
        </div>

        {/* Info & Value Proposition */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-display font-semibold text-[var(--text-cream)] leading-snug">
              {kit.title}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <ShieldCheck className="size-3" />
              {kit.provenance.purityGuarantee.split('·')[0].trim()}
            </span>
          </div>

          <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted-warm)] line-clamp-2 leading-relaxed">
            {kit.subtitle}
          </p>

          <p className="mt-2 text-[11px] text-[var(--text-dim)]">
            <span className="font-semibold text-[var(--text-cream)]">Origin:</span> {kit.provenance.origin}
          </p>
        </div>

        {/* Price & Primary CTA */}
        <div className="w-full sm:w-auto sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--card-border)]/50 flex sm:flex-col items-center sm:items-end justify-between gap-3">
          <div>
            <div className="text-xl sm:text-2xl font-bold font-display text-[var(--text-cream)]">
              ₹{kit.priceInr}
              <span className="text-xs font-normal text-[var(--text-dim)] ml-1.5">(${kit.priceUsd})</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Free delivery for sadhana seekers
            </p>
          </div>

          <button
            onClick={handleReserve}
            disabled={reserved}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
              reserved
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
            }`}
          >
            {reserved ? (
              <>
                <Check className="size-3.5" />
                Interest Reserved
              </>
            ) : (
              <>
                <Package className="size-3.5" />
                Reserve Samagri Box
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Expandable Checklist of Sacred Items ─────────────────────────── */}
      {kit.itemsIncluded && kit.itemsIncluded.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--card-border)]/50">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Package className="size-3.5" />
              What is included in this box ({kit.itemsIncluded.length} authentic ritual items)
            </span>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {kit.itemsIncluded.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--surface-base)]/50 border border-[var(--card-border)]/40 flex items-start gap-2"
                    >
                      <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-cream)] truncate">{item.name}</p>
                        <p className="text-[10px] text-[var(--text-dim)]">{item.significance} ({item.quantity})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
