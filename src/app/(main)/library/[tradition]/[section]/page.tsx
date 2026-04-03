import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLibrarySourceMeta } from '@/lib/library-provenance';
import {
  getCanonicalChaptersForSection,
  getOfficialGitaAudioUrl,
  getOfficialGitaChapterUrl,
} from '@/lib/pathshala-canonical';
import {
  getEntriesBySection,
  getLibrarySectionById,
  getPathshalaSectionDetail,
  getPathshalaTrackGroupForSection,
  getPathshalaTraditionMeta,
  getSectionForEntry,
  isLibraryTradition,
} from '@/lib/library-content';
import {
  getPathshalaChapterHref,
  getPathshalaEntryHrefFromSection,
  getPathshalaTraditionHref,
} from '@/lib/pathshala-links';

export default async function PathshalaSectionPage({
  params,
}: {
  params: Promise<{ tradition: string; section: string }>;
}) {
  const { tradition, section } = await params;

  if (!isLibraryTradition(tradition)) {
    notFound();
  }

  const sectionMeta = getLibrarySectionById(section);

  if (!sectionMeta || sectionMeta.tradition !== tradition) {
    notFound();
  }

  const traditionMeta = getPathshalaTraditionMeta(tradition);
  const trackGroup = getPathshalaTrackGroupForSection(section);
  const detail = getPathshalaSectionDetail(section);
  const entries = getEntriesBySection(section);
  const canonicalChapters = getCanonicalChaptersForSection(section);

  return (
    <div className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Link href="/library" className="text-[color:var(--brand-primary)]">Pathshala</Link>
          <span>•</span>
          <Link href={getPathshalaTraditionHref(tradition)} className="text-[color:var(--brand-primary)]">{traditionMeta.label}</Link>
          {trackGroup && (
            <>
              <span>•</span>
              <span>{trackGroup.title}</span>
            </>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-3xl">{sectionMeta.emoji}</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">{sectionMeta.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed mt-2 max-w-2xl">{sectionMeta.desc}</p>
          </div>
          <div className="clay-card rounded-[1.35rem] px-4 py-3 min-w-[10rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Study track</p>
            <p className="font-display text-2xl font-bold text-gray-900 mt-2">{entries.length}</p>
            <p className="text-xs text-gray-500 mt-1">texts live in this track</p>
          </div>
        </div>

        {detail && (
          <div className="clay-card rounded-[1.6rem] px-4 py-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">{detail.pathType}</span>
              <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">{detail.corpusState}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Live now</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-1">{detail.liveScope}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Complete text goal</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-1">{detail.completeTextGoal}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">Source targets</p>
                <div className="flex flex-wrap gap-2">
                  {detail.sourceTargets.map((source) => (
                    <span key={source} className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">Study modes</p>
                <div className="flex flex-wrap gap-2">
                  {detail.studyModes.map((mode) => (
                    <span key={mode} className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {canonicalChapters.length > 0 && (
        <section className="space-y-3">
          <div className="clay-card rounded-[1.6rem] px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Complete study path</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  This text is being rebuilt as a full chapter-and-verse Pathshala. Use the chapter map below for structured study, and open the official source when you want the complete text immediately.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <a
                  href={getOfficialGitaChapterUrl(1)}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Official full text
                </a>
                <a
                  href={getOfficialGitaAudioUrl(1)}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Official audio
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {canonicalChapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={getPathshalaChapterHref(tradition, section, chapter.id)}
                  className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
                        Chapter {chapter.chapterNumber}
                      </p>
                      <p className="font-semibold text-gray-900 mt-2">{chapter.englishTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">{chapter.transliterationTitle}</p>
                    </div>
                    <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                      {chapter.verseCount} verses
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">{chapter.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Texts and lessons</p>
            <p className="text-sm text-gray-600 mt-1">Open a text to read the passage, source note, and related material.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {entries.map((entry) => {
            const sourceMeta = getLibrarySourceMeta(entry);
            const entrySection = getSectionForEntry(entry) ?? sectionMeta;

            return (
              <Link
                key={entry.id}
                href={getPathshalaEntryHrefFromSection(entrySection, entry)}
                className="glass-panel rounded-[1.5rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                        {sourceMeta.label}
                      </span>
                      <span className="text-[11px] text-gray-500">{entry.source}</span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-gray-900 mt-2">{entry.title}</h2>
                  </div>
                  <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-2">{entry.meaning}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
