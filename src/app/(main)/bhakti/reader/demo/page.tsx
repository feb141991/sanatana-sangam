'use client';

import SacredReader from '@/components/bhakti/SacredReader';

/**
 * ─── Pathshala Reader Demo (Gita 2.47) ───────────────────────────────────────
 * 
 * Demonstrates the Akasha Sync engine with precise word-level metadata.
 */
export default function GitaReaderDemo() {
  const demoTokens = [
    { start: 0,    end: 800,  word: 'कर्मण्ये' },
    { start: 800,  end: 1800, word: 'वाधिकारस्ते' },
    { start: 1800, end: 2400, word: 'मा' },
    { start: 2400, end: 3200, word: 'फलेषु' },
    { start: 3200, end: 4200, word: 'कदाचन' },
    { start: 4200, end: 5000, word: '।' },
    { start: 5000, end: 5800, word: 'मा' },
    { start: 5800, end: 6800, word: 'कर्मफलहेतुर्भूर्मा' },
    { start: 6800, end: 7400, word: 'ते' },
    { start: 7400, end: 8200, word: 'सङ्गोऽस्त्वकर्मणि' },
    { start: 8200, end: 9000, word: '।।' },
  ];

  return (
    <main className="min-h-screen bg-[var(--surface-base)] p-8 sm:p-20">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col space-y-4">
          <span className="text-[10px] font-black text-[var(--brand-primary)] uppercase tracking-[0.6em]">Pathshala / Karma Yoga</span>
          <h1 className="text-4xl sm:text-6xl font-bold premium-serif theme-ink">Shrimad Bhagavad Gita</h1>
          <p className="theme-muted max-w-xl text-lg">Focus on the action, never on the fruits. The foundational shloka of Karma Yoga, synchronized for your daily practice.</p>
        </div>

        <SacredReader
          shlokaId="gita-2-47"
          sanskrit="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥"
          translation="You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions."
          audioUrl="https://shoonaya-assets.s3.amazonaws.com/audio/gita_2_47.mp3" // Replace with real asset
          tokens={demoTokens}
          source="Chapter 2, Verse 47"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
          <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <h5 className="font-bold theme-ink mb-2">Daily Momentum</h5>
            <p className="text-sm theme-muted">Your recitation mastery of this shloka is at 65%. Complete 5 more sessions to reach Expert status.</p>
          </div>
          <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <h5 className="font-bold theme-ink mb-2">Traditional Insight</h5>
            <p className="text-sm theme-muted">Chanting this in the morning hours of Brahma Muhurta aligns your willpower with Dharmic duty.</p>
          </div>
          <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)]">
            <h5 className="font-bold theme-ink mb-2">Grammatical Notes</h5>
            <p className="text-sm theme-muted">"Karmany-eva" is a sandhi of Karmani + Eva, emphasizing that action alone is under your control.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
