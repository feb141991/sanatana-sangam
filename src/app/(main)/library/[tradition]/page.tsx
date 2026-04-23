import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getEntriesByTradition,
  getPathshalaTrackGroups,
  getPathshalaTraditionMeta,
  getSectionsByTradition,
  isLibraryTradition,
} from '@/lib/library-content';
import { getPathshalaSectionHref } from '@/lib/pathshala-links';
import { MotionFade, MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

export default async function PathshalaTraditionPage({
  params,
}: {
  params: Promise<{ tradition: string }>;
}) {
  const { tradition } = await params;

  if (!isLibraryTradition(tradition)) {
    notFound();
  }

  const meta = getPathshalaTraditionMeta(tradition);
  const groups = getPathshalaTrackGroups(tradition);
  const sections = getSectionsByTradition(tradition);
  const totalEntries = getEntriesByTradition(tradition).length;

  return (
    <MotionFade className="space-y-3 pb-6 fade-in">
      <div className="glass-panel rounded-[1.6rem] px-4 py-4 sm:rounded-[1.8rem] sm:px-5 sm:py-5">
        <Link href="/library" className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
          Parampara Pathshala
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-3xl">{meta.emoji}</p>
            <h1 className="font-display text-2xl font-bold text-[color:var(--text-cream)] mt-2">{meta.label}</h1>
            <p className="hidden sm:block text-sm text-[color:var(--brand-muted)] leading-relaxed mt-2 max-w-xl">{meta.description}</p>
          </div>
          <div className="clay-card rounded-[1.25rem] px-3 py-2.5 sm:rounded-[1.4rem] sm:px-4 sm:py-3 sm:min-w-[11rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-muted)]">Live catalog</p>
            <p className="font-display text-2xl font-bold text-[color:var(--text-cream)] mt-2">{totalEntries}</p>
            <p className="text-xs text-[color:var(--brand-muted)] mt-1">{sections.length} active study tracks</p>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <MotionStagger className="grid gap-3" delay={0.05}>
          {groups.map((group) => (
            <MotionItem key={group.id}>
            <div className="clay-card rounded-[1.45rem] sm:rounded-[1.6rem] px-3.5 py-3.5 sm:px-4 sm:py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-[color:var(--text-cream)]">{group.title}</p>
                  <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed mt-1">{group.desc}</p>
                </div>
                <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                  {group.sectionIds.length} tracks
                </span>
              </div>

              <MotionStagger className="grid gap-3 sm:grid-cols-2" delay={0.04}>
                {group.sectionIds.map((sectionId) => {
                  const section = sections.find((item) => item.id === sectionId);
                  if (!section) return null;

                  return (
                    <MotionItem key={section.id}>
                    <Link
                      key={section.id}
                      href={getPathshalaSectionHref(tradition, section.id)}
                      className="glass-panel rounded-[1.35rem] px-4 py-4 motion-lift"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xl">{section.emoji}</p>
                          <p className="font-semibold text-[color:var(--text-cream)] mt-2">{section.title}</p>
                        </div>
                        <span className="text-xs text-[color:var(--brand-muted)]">{section.count} texts</span>
                      </div>
                      <p className="hidden sm:block text-sm text-[color:var(--brand-muted)] leading-relaxed mt-2">{section.desc}</p>
                      <p className="text-xs font-semibold text-[color:var(--brand-primary)] mt-3">Open track →</p>
                    </Link>
                    </MotionItem>
                  );
                })}
              </MotionStagger>
            </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </section>
    </MotionFade>
  );
}
