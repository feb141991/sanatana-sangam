'use client';

import { useState } from 'react';
import { TERMS_DATA, TermsRegion } from '@/lib/terms-content';
import { motion, AnimatePresence } from 'framer-motion';

export default function TermsClient() {
  const [region, setRegion] = useState<TermsRegion>('global');

  const currentAppendix = TERMS_DATA.appendices.find(a => a.region === region);

  return (
    <div className="space-y-8">
      {/* Region Selector */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit">
        <button
          onClick={() => setRegion('global')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
            region === 'global' ? 'bg-[#C5A059] text-[#1a1610]' : 'text-white/40 hover:text-white'
          }`}
        >
          Global
        </button>
        {TERMS_DATA.appendices.map(app => (
          <button
            key={app.region}
            onClick={() => setRegion(app.region)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              region === app.region ? 'bg-[#C5A059] text-[#1a1610]' : 'text-white/40 hover:text-white'
            }`}
          >
            {app.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr]">
        <AnimatePresence mode="wait">
          <motion.div
            key={region}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            {/* Global Sections (Always shown first) */}
            {TERMS_DATA.global.map((section, idx) => (
              <section key={idx} className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-6 bg-[#C5A059]/40 rounded-full group-hover:bg-[#C5A059] transition-colors" />
                  <h2 className="font-display text-2xl font-bold text-[color:var(--text-cream)] tracking-tight">
                    {section.title}
                  </h2>
                </div>
                <p className="text-[#C5A059] font-medium text-xs uppercase tracking-widest mb-4 opacity-80 italic">
                  — {section.summary}
                </p>
                <div className="space-y-4">
                  {section.content.map((p, pIdx) => (
                    <p key={pIdx} className="text-sm leading-relaxed text-[color:var(--brand-muted)]">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* Regional Appendix Sections */}
            {currentAppendix && (
              <div className="pt-10 border-t border-white/10 mt-16">
                <div className="inline-block px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest mb-8">
                  {currentAppendix.label} Specific Addendum
                </div>
                <div className="space-y-10">
                  {currentAppendix.sections.map((section, idx) => (
                    <section key={idx} className="group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-6 bg-[#C5A059]/20 rounded-full" />
                        <h2 className="font-display text-2xl font-bold text-[color:var(--text-cream)] tracking-tight">
                          {section.title}
                        </h2>
                      </div>
                      <p className="text-[#C5A059] font-medium text-xs uppercase tracking-widest mb-4 opacity-60 italic">
                        — {section.summary}
                      </p>
                      <div className="space-y-4">
                        {section.content.map((p, pIdx) => (
                          <p key={pIdx} className="text-sm leading-relaxed text-[color:var(--brand-muted)]">
                            {p}
                          </p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-8 border-t border-white/5 text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">
        Last Updated: May 14, 2026 • Shoonaya Global Governance
      </div>
    </div>
  );
}
