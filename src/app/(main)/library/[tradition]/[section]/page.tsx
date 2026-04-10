import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLibrarySourceMeta } from '@/lib/library-provenance';
import {
  getCanonicalChaptersForSection,
  getCanonicalReadingPlansForSection,
  getOfficialGitaAudioUrl,
  getOfficialGitaChapterUrl,
  getOfficialRamayanaStudyUrl,
  getOfficialRamayanaTextUrl,
  getRamayanaKandasForSection,
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
  getGitaRecitationHref,
  getPathshalaChapterHref,
  getPathshalaEntryHrefFromSection,
  getPathshalaTraditionHref,
} from '@/lib/pathshala-links';
import { MotionFade, MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

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
  const ramayanaKandas = getRamayanaKandasForSection(section);
  const readingPlans = getCanonicalReadingPlansForSection(section);
  const featuredEntries = canonicalChapters.length > 0
    ? entries.filter((entry) => (
        ['gita-2-47', 'gita-2-20', 'gita-4-7', 'gita-6-5', 'gita-9-22', 'gita-18-66'].includes(entry.id)
      ))
    : ramayanaKandas.length > 0
      ? entries.filter((entry) => ['ram-bal-1', 'ram-sundara-1', 'ram-yuddha-1', 'ram-uttara-1'].includes(entry.id))
      : entries;
  const displayedFeaturedEntries = section === 'upanishad'
    ? [...featuredEntries].sort((a, b) => a.title.localeCompare(b.title))
    : featuredEntries;

  return (
    <MotionFade className="space-y-3 pb-6 fade-in">
      <div className="glass-panel rounded-[1.6rem] px-4 py-4 sm:rounded-[1.8rem] sm:px-5 sm:py-5 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-3xl">{sectionMeta.emoji}</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 mt-2">{sectionMeta.title}</h1>
            <p className="hidden sm:block text-sm text-gray-600 leading-relaxed mt-2 max-w-2xl">{sectionMeta.desc}</p>
          </div>
          <div className="clay-card rounded-[1.25rem] px-3 py-2.5 sm:rounded-[1.35rem] sm:px-4 sm:py-3 sm:min-w-[10rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Study track</p>
            <p className="font-display text-2xl font-bold text-gray-900 mt-2">{entries.length}</p>
            <p className="text-xs text-gray-500 mt-1">texts live in this track</p>
          </div>
        </div>

        {detail ? (
          <div className="flex flex-wrap gap-2">
            <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">{detail.pathType}</span>
            <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">{detail.corpusState}</span>
          </div>
        ) : null}
      </div>

      {(canonicalChapters.length > 0 || ramayanaKandas.length > 0) && (
        <section className="space-y-3">
          <div className="clay-card rounded-[1.45rem] sm:rounded-[1.6rem] px-3.5 py-3.5 sm:px-4 sm:py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2 sm:items-end">
                {canonicalChapters.length > 0 ? (
                  <>
                    <a
                      href={getOfficialGitaChapterUrl(1)}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Companion
                    </a>
                    <a
                      href={getOfficialGitaAudioUrl(1)}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Audio
                    </a>
                    <Link
                      href={getGitaRecitationHref()}
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Recite
                    </Link>
                  </>
                ) : (
                  <>
                    <a
                      href={getOfficialRamayanaTextUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Text
                    </a>
                    <a
                      href={getOfficialRamayanaStudyUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Index
                    </a>
                  </>
                )}
              </div>
            </div>

            <MotionStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" delay={0.05}>
              {(canonicalChapters.length > 0 ? canonicalChapters : ramayanaKandas).map((chapter) => (
                <MotionItem key={chapter.id}>
                <Link
                  key={chapter.id}
                  href={getPathshalaChapterHref(tradition, section, chapter.id)}
                  className="glass-panel rounded-[1.25rem] sm:rounded-[1.4rem] px-3.5 py-3.5 sm:px-4 sm:py-4 border border-white/60 hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">
                        {'chapterNumber' in chapter ? `Chapter ${chapter.chapterNumber}` : `Kanda ${chapter.kandaNumber}`}
                      </p>
                      <p className="font-semibold text-gray-900 mt-2">{chapter.englishTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">{chapter.transliterationTitle}</p>
                    </div>
                    <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                      {'verseCount' in chapter ? `${chapter.verseCount} verses` : `${chapter.cantoCount} cantos`}
                    </span>
                  </div>
                  <p className="hidden sm:block text-sm text-gray-600 leading-relaxed mt-3">{chapter.summary}</p>
                </Link>
                </MotionItem>
              ))}
            </MotionStagger>
          </div>
        </section>
      )}

      {readingPlans.length > 0 && (
        <section className="space-y-3">
          <div className="glass-panel rounded-[1.45rem] sm:rounded-[1.6rem] px-3.5 py-3.5 sm:px-4 sm:py-4 space-y-3">
            <MotionStagger className="grid gap-3 lg:grid-cols-3" delay={0.06}>
              {readingPlans.map((plan) => (
                <MotionItem key={plan.id}>
                <div className="clay-card rounded-[1.25rem] sm:rounded-[1.4rem] px-3.5 py-3.5 sm:px-4 sm:py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{plan.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{plan.cadence}</p>
                    </div>
                    <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                      {plan.chapters.length} chapters
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">{plan.subtitle}</p>

                  <div className="flex flex-wrap gap-2">
                    {plan.chapters.map((chapterNumber) => (
                      <Link
                        key={`${plan.id}-${chapterNumber}`}
                        href={getPathshalaChapterHref(tradition, section, section === 'gita' ? `chapter-${chapterNumber}` : `kanda-${chapterNumber}`)}
                        className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-700 hover:text-[color:var(--brand-primary)] transition"
                      >
                        {section === 'gita' ? `Ch ${chapterNumber}` : `K ${chapterNumber}`}
                      </Link>
                    ))}
                  </div>
                </div>
                </MotionItem>
              ))}
            </MotionStagger>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <MotionStagger className="grid gap-3" delay={0.08}>
          {displayedFeaturedEntries.map((entry) => {
            const sourceMeta = getLibrarySourceMeta(entry);
            const entrySection = getSectionForEntry(entry) ?? sectionMeta;
            const isUpanishad = section === 'upanishad';
            const originalStatusLabel = isUpanishad
              ? entry.original.trim().length > 0
                ? 'Original live'
                : 'Original companion'
              : null;
            const recitationStatusLabel = isUpanishad
              ? entry.companionSourceUrl
                ? 'Recitation companion'
                : 'Recitation planned'
              : null;

            return (
              <MotionItem key={entry.id}>
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
                      {originalStatusLabel && (
                        <span className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
                          entry.original.trim().length > 0
                            ? 'clay-pill text-[color:var(--brand-primary)]'
                            : 'glass-chip text-gray-600'
                        }`}>
                          {originalStatusLabel}
                        </span>
                      )}
                      {recitationStatusLabel && (
                        <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
                          {recitationStatusLabel}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500">{entry.source}</span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-gray-900 mt-2">{entry.title}</h2>
                  </div>
                  <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-2">
                  {isUpanishad
                    ? entry.original.trim().length > 0
                      ? 'Full translated study text with official-source Sanskrit now available directly inside Pathshala.'
                      : 'Full translated study text is live in Pathshala, with the official source linked for the original Sanskrit layer.'
                    : entry.meaning}
                </p>
              </Link>
              </MotionItem>
            );
          })}
        </MotionStagger>
      </section>
    </MotionFade>
  );
}
