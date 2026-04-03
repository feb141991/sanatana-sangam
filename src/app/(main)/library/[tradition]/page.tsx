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
    <div className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5">
        <Link href="/library" className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">
          Parampara Pathshala
        </Link>
        <div className="flex items-start justify-between gap-4 mt-3">
          <div>
            <p className="text-3xl">{meta.emoji}</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">{meta.label}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mt-2 max-w-xl">{meta.description}</p>
          </div>
          <div className="clay-card rounded-[1.4rem] px-4 py-3 min-w-[11rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Live catalog</p>
            <p className="font-display text-2xl font-bold text-gray-900 mt-2">{totalEntries}</p>
            <p className="text-xs text-gray-500 mt-1">{sections.length} active study tracks</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-4">{meta.studyPrompt}</p>
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Scripture categories</p>
          <p className="text-sm text-gray-600 mt-1">Choose a category first, then open a study track inside it.</p>
        </div>
        <div className="grid gap-3">
          {groups.map((group) => (
            <div key={group.id} className="clay-card rounded-[1.6rem] px-4 py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-gray-900">{group.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">{group.desc}</p>
                </div>
                <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                  {group.sectionIds.length} tracks
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {group.sectionIds.map((sectionId) => {
                  const section = sections.find((item) => item.id === sectionId);
                  if (!section) return null;

                  return (
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
