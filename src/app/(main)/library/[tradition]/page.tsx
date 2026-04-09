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
    <MotionFade className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.6rem] px-4 py-4 sm:rounded-[1.8rem] sm:px-5 sm:py-5">
        <Link href="/library" className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
          Parampara Pathshala
        </Link>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-3xl">{meta.emoji}</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">{meta.label}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mt-2 max-w-xl">{meta.description}</p>
          </div>
          <div className="clay-card rounded-[1.4rem] px-4 py-3 sm:min-w-[11rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Live catalog</p>
            <p className="font-display text-2xl font-bold text-gray-900 mt-2">{totalEntries}</p>
            <p className="text-xs text-gray-500 mt-1">{sections.length} active study tracks</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-4 sm:block hidden">{meta.studyPrompt}</p>
        <p className="sm:hidden text-sm text-[color:var(--brand-earth)] leading-relaxed mt-4">
          Start with one scripture family.
        </p>

        <div className="hidden sm:grid gap-3 sm:grid-cols-3 mt-4">
          {[
            {
              eyebrow: 'Start',
              title: 'Choose a scripture family',
              description: 'Begin with the category that matches your current intention, not the whole tradition at once.',
            },
            {
              eyebrow: 'Study',
              title: 'Stay in one track',
              description: 'Each track is designed to feel complete on its own, so you can go deep without losing your place.',
            },
            {
              eyebrow: 'Trust',
              title: 'Read with clear source posture',
              description: 'Pathshala keeps translation, original-text, and companion-source boundaries visible as you move deeper.',
            },
          ].map((item) => (
            <div key={item.title} className="clay-card rounded-[1.35rem] px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">{item.eyebrow}</p>
              <p className="font-semibold text-gray-900 mt-2">{item.title}</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Scripture categories</p>
          <p className="text-sm text-gray-600 mt-1">Choose a category, then open a track.</p>
        </div>
        <MotionStagger className="grid gap-3" delay={0.05}>
          {groups.map((group) => (
            <MotionItem key={group.id}>
            <div className="clay-card rounded-[1.6rem] px-4 py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-gray-900">{group.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">{group.desc}</p>
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
                      className="glass-panel rounded-[1.35rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xl">{section.emoji}</p>
                          <p className="font-semibold text-gray-900 mt-2">{section.title}</p>
                        </div>
                        <span className="text-xs text-gray-500">{section.count} texts</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mt-2">{section.desc}</p>
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
