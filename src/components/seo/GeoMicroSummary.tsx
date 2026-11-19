import React from 'react';
import type { GeoModel } from '@/lib/seo/geo-model';

interface GeoMicroSummaryProps {
  geo: GeoModel;
  cardBg?: string;
  borderColor?: string;
  textColor?: string;
}

export function GeoMicroSummary({
  geo,
  cardBg = 'rgba(255, 255, 255, 0.03)',
  borderColor = 'rgba(255, 255, 255, 0.1)',
  textColor,
}: GeoMicroSummaryProps) {
  if (!geo || (!geo.qa?.length && !geo.facts?.length)) {
    return null;
  }

  return (
    <section
      aria-label="Quick Answers & Practice Summary"
      className="rounded-2xl p-5 sm:p-6 space-y-5 my-8 transition-all"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor }}>
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">📜</span>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">
            Quick Answers & Practice Summary
          </h2>
        </div>
        {geo.provenance && (
          <span
            className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              backgroundColor: 'rgba(197, 160, 89, 0.15)',
              color: '#c5a059',
              border: '1px solid rgba(197, 160, 89, 0.25)',
            }}
          >
            {geo.provenance}
          </span>
        )}
      </div>

      {/* ── Key Facts Chips ───────────────────────────────────────── */}
      {geo.facts && geo.facts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1" aria-label="Key Facts">
          {geo.facts.map((fact, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${borderColor}`,
              }}
            >
              <span className="opacity-50 text-[11px] font-medium">{fact.label}:</span>
              <span className="font-semibold text-[11px] capitalize">{fact.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Q&A Items (Citable Fact Blocks) ───────────────────────── */}
      {geo.qa && geo.qa.length > 0 && (
        <div className="space-y-4 pt-1" role="region" aria-label="Frequently Asked Questions">
          {geo.qa.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className="text-sm font-semibold text-[var(--brand-primary,#c5a059)] leading-snug">
                {item.question}
              </h3>
              <p className="text-xs sm:text-sm opacity-85 leading-relaxed">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer Attribution ────────────────────────────────────── */}
      <div className="pt-2 border-t flex items-center justify-between text-[11px] opacity-50" style={{ borderColor }}>
        <span>Canonical Summary · Shoonaya Spiritual Sanctuary</span>
        <span>Verified Canonical Sources</span>
      </div>
    </section>
  );
}
