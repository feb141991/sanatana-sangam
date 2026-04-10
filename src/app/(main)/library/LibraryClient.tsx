import Link from 'next/link';
import { Search, BookOpen } from 'lucide-react';
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
import Chip from '@/components/ui/Chip';
import IconSquare from '@/components/ui/IconSquare';
import PillNav from '@/components/ui/PillNav';

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
  const topNavValue: 'gita' | 'upanishad' | 'stotram' =
    preferredTradition === 'hindu' ? 'gita' : preferredTradition === 'sikh' ? 'stotram' : 'upanishad';

  return (
    <MotionFade className="space-y-3 pb-6 fade-in">
      <div className="flex items-center justify-between px-1 pb-3">
        <p className="text-xl font-medium">Shastra</p>
        <Search size={16} className="text-gray-400" />
      </div>

      <PillNav
        value={topNavValue}
        onChange={() => {}}
        items={[
          { value: 'gita', label: 'Gita' },
          { value: 'upanishad', label: 'Upanishad' },
          { value: 'stotram', label: 'Stotram' },
        ]}
      />

      {(continueLearning || bookmarkedEntries.length > 0) && (
        <section className="space-y-3">
          <p className="text-[13px] font-medium text-gray-500 mb-2">Continue reading</p>

          {continueLearning && (
            <Link href={continueLearning.href} className="surface-panel block px-4 py-4 hover:-translate-y-0.5 transition active:scale-[0.97]">
              <div className="flex items-start gap-3.5">
                <IconSquare className="h-16 w-[52px] rounded-[8px]">
                  <BookOpen size={18} />
                </IconSquare>
                <div>
                  <p className="text-[15px] font-medium text-gray-900">{continueLearning.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{continueLearning.sectionTitle} · {continueLearning.source}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-[3px] rounded-full bg-black/10 min-w-[120px]">
                      <div className="h-full rounded-full bg-[color:var(--saffron-200)]" style={{ width: '65%' }} />
                    </div>
                    <span className="text-[11px] text-[color:var(--saffron-400)]">47/72</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Chip>Resume chapter 2</Chip>
                    <Chip variant="outline">All chapters</Chip>
                  </div>
                </div>
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
        <p className="text-[13px] font-medium text-gray-500 mb-2">Explore</p>
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
