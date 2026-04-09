import Link from 'next/link';
import {
  PATHSHALA_TRADITIONS,
  getEntriesByTradition,
  getLibrarySectionById,
  getSectionsByTradition,
  type LibraryTradition,
} from '@/lib/library-content';
import { getPathshalaTraditionHref } from '@/lib/pathshala-links';
import type { PathshalaStudySummary } from '@/lib/pathshala-state';
import { MotionFade, MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

export default function LibraryClient({
  defaultSection = 'gita',
  continueLearning = null,
  bookmarkedEntries = [],
}: {
  defaultSection?: string;
  continueLearning?: PathshalaStudySummary | null;
  bookmarkedEntries?: PathshalaStudySummary[];
}) {
  const preferredTradition = getLibrarySectionById(defaultSection)?.tradition ?? 'hindu';

  return (
    <MotionFade className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--brand-primary)]">
            Tradition-first study
          </p>
          <h1 className="font-display font-bold text-xl text-gray-900 mt-1">Parampara Pathshala</h1>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            Enter gently: choose your tradition, then move into scripture families, study tracks, and texts without everything competing on one screen.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              eyebrow: 'Read',
              title: 'Study quietly',
              description: 'Open a tradition and move into full texts, chapters, and trusted study tracks.',
            },
            {
              eyebrow: 'Return',
              title: 'Resume where you left off',
              description: 'Bookmarks and continue-learning loops keep your reading rhythm calm and easy to resume.',
            },
            {
              eyebrow: 'Recite',
              title: 'Keep audio trustworthy',
              description: 'Pathshala holds recitation clearly: live in app where ready, companion-linked where authority still matters.',
            },
          ].map((item) => (
            <div key={item.title} className="clay-card rounded-[1.45rem] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">{item.eyebrow}</p>
              <p className="font-semibold text-gray-900 mt-2">{item.title}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="clay-card rounded-[1.6rem] px-4 py-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Pathshala gateway</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          This first screen is now intentionally simple: choose a tradition, then move into scripture families, track pages, and text study without excerpt clutter on the same surface.
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Pathshala translations are for study and orientation. For formal recitation, lineage practice, or doctrinal certainty, always defer to the cited source tradition.
        </p>
      </div>

      {(continueLearning || bookmarkedEntries.length > 0) && (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Return loop</p>
            <p className="text-sm text-gray-600 mt-1">Jump back to your latest study page, or reopen something you intentionally saved.</p>
          </div>

          {continueLearning && (
            <Link href={continueLearning.href} className="glass-panel rounded-[1.6rem] px-4 py-4 border border-white/70 block hover:-translate-y-0.5 transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Continue learning</p>
                  <h2 className="font-display text-lg font-bold text-gray-900 mt-2">{continueLearning.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{continueLearning.sectionTitle} · {continueLearning.source}</p>
                </div>
                <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                  Resume →
                </span>
              </div>
            </Link>
          )}

          {bookmarkedEntries.length > 0 && (
            <MotionStagger className="grid gap-3 sm:grid-cols-2" delay={0.05}>
              {bookmarkedEntries.map((entry) => (
                <MotionItem key={entry.entryId}>
                <Link
                  key={entry.entryId}
                  href={entry.href}
                  className="clay-card rounded-[1.45rem] px-4 py-4 block hover:-translate-y-0.5 transition"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Bookmarked</p>
                  <p className="font-semibold text-gray-900 mt-2">{entry.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{entry.sectionTitle}</p>
                </Link>
                </MotionItem>
              ))}
            </MotionStagger>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Choose tradition</p>
          <p className="text-sm text-gray-500 mt-1">Each tradition opens into its own scripture categories and study tracks on the next page.</p>
        </div>

        <MotionStagger className="grid gap-3 sm:grid-cols-2" delay={0.06}>
          {PATHSHALA_TRADITIONS.map((tradition) => {
            const sections = getSectionsByTradition(tradition.id);
            const entryCount = getEntriesByTradition(tradition.id).length;
            const isPreferred = tradition.id === preferredTradition;

            return (
              <MotionItem key={tradition.id}>
              <TraditionGatewayCard
                key={tradition.id}
                tradition={tradition.id}
                label={tradition.label}
                emoji={tradition.emoji}
                description={tradition.description}
                sections={sections.map((section) => section.title)}
                entryCount={entryCount}
                trackCount={sections.length}
                isPreferred={isPreferred}
              />
              </MotionItem>
            );
          })}
        </MotionStagger>
      </section>
    </MotionFade>
  );
}

function TraditionGatewayCard({
  tradition,
  label,
  emoji,
  description,
  sections,
  entryCount,
  trackCount,
  isPreferred,
}: {
  tradition: LibraryTradition;
  label: string;
  emoji: string;
  description: string;
  sections: string[];
  entryCount: number;
  trackCount: number;
  isPreferred: boolean;
}) {
  return (
    <Link
      href={getPathshalaTraditionHref(tradition)}
      className={`text-left rounded-[1.7rem] p-4 border transition block ${
        isPreferred ? 'clay-card border-[color:var(--brand-primary)]/20' : 'glass-panel hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{emoji}</p>
          <h2 className="font-display font-bold text-base mt-2 text-gray-900">{label}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPreferred && (
            <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
              Your path
            </span>
          )}
          <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
            {trackCount} tracks
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed mt-3 text-gray-600">{description}</p>

      <div className="flex flex-wrap gap-2 mt-4">
        {sections.slice(0, 4).map((section) => (
          <span key={section} className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
            {section}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <p className="text-xs text-gray-500">{entryCount} live passages</p>
        <p className="text-xs font-semibold text-[color:var(--brand-primary)]">Open Pathshala →</p>
      </div>
    </Link>
  );
}
