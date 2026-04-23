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
import { MobileCard, MobileScreen, MobileScreenHeader } from '@shared-core/ui/mobile';

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
    <MobileScreen className="pb-6">
      <MotionFade className="space-y-3 fade-in">
      <MobileCard>
        <MobileScreenHeader
          title="Parampara Pathshala"
          description="Choose a tradition and enter one track at a time."
          className="px-0"
        />
      </MobileCard>

      {(continueLearning || bookmarkedEntries.length > 0) && (
        <section className="space-y-3">

          {continueLearning && (
            <Link href={continueLearning.href} className="glass-panel rounded-[1.6rem] px-4 py-4 block hover:-translate-y-0.5 transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="type-card-label">Continue learning</p>
                  <h2 className="type-card-heading mt-2">{continueLearning.title}</h2>
                  <p className="type-body mt-1">{continueLearning.sectionTitle} · {continueLearning.source}</p>
                </div>
                <span className="clay-pill type-chip text-[color:var(--brand-primary)]">
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
                  <p className="type-card-label">Bookmarked</p>
                  <p className="type-card-heading mt-2">{entry.title}</p>
                  <p className="type-body mt-1">{entry.sectionTitle}</p>
                </Link>
                </MotionItem>
              ))}
            </MotionStagger>
          )}
        </section>
      )}

      <section className="space-y-3">
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
    </MobileScreen>
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
      className={`text-left rounded-[1.45rem] sm:rounded-[1.7rem] p-3.5 sm:p-4 border transition block ${
        isPreferred ? 'clay-card border-[color:var(--brand-primary)]/20' : 'glass-panel hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{emoji}</p>
          <h2 className="type-card-heading mt-2">{label}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPreferred && (
            <span className="clay-pill type-chip text-[color:var(--brand-primary)]">
              Your path
            </span>
          )}
          <span className="glass-chip px-3 py-1.5 rounded-full type-chip text-[color:var(--text-dim)]">
            {trackCount} tracks
          </span>
        </div>
      </div>

      <p className="type-body mt-3 hidden sm:block">{description}</p>

      <div className="hidden sm:flex flex-wrap gap-2 mt-4">
        {sections.slice(0, 4).map((section) => (
          <span key={section} className="glass-chip px-3 py-1.5 rounded-full type-chip text-[color:var(--text-dim)]">
            {section}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 sm:mt-4">
        <p className="type-micro">{entryCount} passages</p>
        <p className="type-micro text-[color:var(--brand-primary)]">Open Pathshala →</p>
      </div>
    </Link>
  );
}
