import Link from 'next/link';
import {
  PATHSHALA_TRADITIONS,
  getEntriesByTradition,
  getLibrarySectionById,
  getSectionsByTradition,
  type LibraryTradition,
} from '@/lib/library-content';
import MvpHero from '@/components/layout/MvpHero';
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
    <MotionFade className="space-y-3 pb-6 fade-in">
      <MvpHero
        theme="pathshala"
        title="Parampara Pathshala"
        description="Choose one tradition, then move through one clear study track at a time."
        chips={['Scripture', 'Recite', 'Return loops']}
      />

      {(continueLearning || bookmarkedEntries.length > 0) && (
        <section className="space-y-3">

          {continueLearning && (
            <Link href={continueLearning.href} className="surface-panel block px-4 py-4 hover:-translate-y-0.5 transition active:scale-[0.97]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-[color:var(--text-tertiary)]">Continue learning</p>
                  <h2 className="text-[22px] font-medium text-gray-900 mt-2">{continueLearning.title}</h2>
                  <p className="text-[14px] text-gray-600 mt-1">{continueLearning.sectionTitle} · {continueLearning.source}</p>
                </div>
                <span className="glass-chip rounded-[24px] px-3 py-1 text-[12px] font-medium">
                  Resume
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
                  className="surface-card block px-4 py-4 hover:-translate-y-0.5 transition active:scale-[0.97]"
                >
                  <p className="text-[11px] text-[color:var(--text-tertiary)]">Bookmarked</p>
                  <p className="font-medium text-gray-900 mt-2">{entry.title}</p>
                  <p className="text-[14px] text-gray-600 mt-1">{entry.sectionTitle}</p>
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
  description,
  sections,
  entryCount,
  trackCount,
  isPreferred,
}: {
  tradition: LibraryTradition;
  label: string;
  description: string;
  sections: string[];
  entryCount: number;
  trackCount: number;
  isPreferred: boolean;
}) {
  return (
    <Link
      href={getPathshalaTraditionHref(tradition)}
      className={`text-left rounded-[16px] p-4 border transition block active:scale-[0.97] ${
        isPreferred ? 'bg-[color:var(--saffron-50)] border-[color:var(--saffron-100)]' : 'bg-white hover:-translate-y-0.5'
      }`}
      style={!isPreferred ? { borderColor: 'rgba(0,0,0,0.15)' } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--saffron-50)] text-[color:var(--saffron-800)] text-sm font-medium">
            {trackCount}
          </div>
          <h2 className="text-[16px] font-medium mt-2 text-gray-900">{label}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPreferred && (
            <span className="glass-chip rounded-[24px] px-3 py-1 text-[12px] font-medium">
              Your path
            </span>
          )}
          <span className="glass-chip px-3 py-1.5 rounded-[24px] text-[12px] font-medium">
            {trackCount} tracks
          </span>
        </div>
      </div>

      <p className="hidden sm:block text-[14px] leading-relaxed mt-3 text-gray-600">{description}</p>

      <div className="hidden sm:flex flex-wrap gap-2 mt-4">
        {sections.slice(0, 4).map((section) => (
          <span key={section} className="glass-chip px-3 py-1.5 rounded-[24px] text-[12px] font-medium">
            {section}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 sm:mt-4">
        <p className="text-[12px] text-gray-500">{entryCount} passages</p>
        <p className="text-[12px] font-medium text-[color:var(--saffron-800)]">Open Pathshala</p>
      </div>
    </Link>
  );
}
