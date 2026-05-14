'use client';

import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';
import { GUIDELINES_DATA } from '@/lib/guidelines-content';
import { motion } from 'framer-motion';

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
              <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-serif text-sm">
                {idx + 1}
              </div>
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold text-[color:var(--text-cream)] tracking-tight">
                  {section.title}
                </h2>
                <p className="text-[#C5A059] font-medium text-xs uppercase tracking-widest opacity-80 italic">
                  — {section.summary}
                </p>
                <div className="space-y-4">
                  {section.content.map((p, pIdx) => (
                    <p key={pIdx} className="text-sm leading-relaxed text-[color:var(--brand-muted)]">
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
