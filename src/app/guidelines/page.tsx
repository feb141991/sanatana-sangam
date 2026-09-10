"use client";

import type { Metadata } from "next";
import PublicPageShell from "@/components/public/PublicPageShell";
import { GUIDELINES_DATA } from "@/lib/guidelines-content";
import { motion } from "framer-motion";

// Note: Metadata cannot be in a client component. I'll split it or keep it simple.
// Since it was 'use client' already (hypothetically), I'll make sure it's correct.

export default function GuidelinesPage() {
  return (
    <PublicPageShell
      eyebrow="Community Standards"
      title="How we gather."
      intro="Shoonaya is a digital sanctuary for sincere discussion, family continuity, and spiritual belonging. These guidelines define the baseline for our global community."
      asideTitle="Moderation"
      asideBody="Our community is moderated by a combination of human guardians and AI-assisted safety tools to ensure these standards are upheld for everyone, everywhere."
    >
      <div className="space-y-12">
        {GUIDELINES_DATA.map((section, idx) => (
          <motion.section
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex size-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--card-border)] font-serif text-sm text-[var(--brand-primary-strong)]">
                {idx + 1}
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold text-[color:var(--text-cream)] tracking-tight">
                  {section.title}
                </h2>
                <p className="text-xs font-medium uppercase italic tracking-widest text-[var(--brand-primary-strong)] opacity-80">
                  — {section.summary}
                </p>
                <div className="space-y-4">
                  {section.content.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-sm leading-relaxed text-[color:var(--brand-muted)]"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        ))}

        <div className="pt-8 border-t border-white/5 text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">
          Updated: May 14, 2026 • Shoonaya Ethics Council
        </div>
      </div>
    </PublicPageShell>
  );
}
