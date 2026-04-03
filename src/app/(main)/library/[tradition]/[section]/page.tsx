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
import { getUpanishadLayerCounts } from '@/lib/upanishad-study';
import {
  getGitaStoryEpisodeHref,
  getGitaStoryHref,
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
  const ramayanaKandas = getRamayanaKandasForSection(section);
  const readingPlans = getCanonicalReadingPlansForSection(section);
  const featuredEntries = canonicalChapters.length > 0
    ? entries.filter((entry) => (
        ['gita-2-47', 'gita-2-20', 'gita-4-7', 'gita-6-5', 'gita-9-22', 'gita-18-66'].includes(entry.id)
      ))
    : ramayanaKandas.length > 0
      ? entries.filter((entry) => ['ram-bal-1', 'ram-sundara-1', 'ram-yuddha-1', 'ram-uttara-1'].includes(entry.id))
      : entries;
  const upanishadLayerCounts = section === 'upanishad' ? getUpanishadLayerCounts() : null;

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

      {section === 'gita' && (
        <section className="space-y-3">
          <div className="story-hero-shell rounded-[1.8rem] px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-accent-soft)]">
                  New immersive mode
                </p>
                <h2 className="font-display text-2xl font-bold text-white mt-2">Kanu story mode</h2>
                <p className="text-sm text-white/85 leading-relaxed mt-3">
                  Walk from Gokul to Kurukshetra with a Krishna-inspired guide, then return to the chapter-and-verse Gita flow whenever you want the formal source layer.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="story-chip">English + Hindi</span>
                  <span className="story-chip">Story + deeper meaning</span>
                  <span className="story-chip">Verse anchors</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <Link href={getGitaStoryHref()} className="story-primary-cta">
                  Open story map
                </Link>
                <Link href={getGitaStoryEpisodeHref('kurukshetra-dawn-of-counsel')} className="story-secondary-cta">
                  Start near the Gita
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {section === 'upanishad' && upanishadLayerCounts && (
        <section className="space-y-3">
          <div className="glass-panel rounded-[1.6rem] px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Current source-backed layers</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  Pathshala now carries the 13 principal Upanishads as full translated study texts. The original Sanskrit layer is live where the official Vedic Heritage source is text-accessible, and stays companion-linked for the larger texts that are still exposed there as flipbooks or summary pages.
                </p>
              </div>
              <a
                href="https://vedicheritage.gov.in/vedicaudit-2023/upanishads/"
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold shrink-0"
                style={{ color: 'var(--brand-primary)' }}
              >
                Source overview
              </a>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="clay-card rounded-[1.2rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Translated study texts</p>
                <p className="font-display text-2xl font-bold text-gray-900 mt-2">{upanishadLayerCounts.total}</p>
                <p className="text-sm text-gray-600 mt-1">principal Upanishads live inside Pathshala</p>
              </div>
              <div className="glass-panel rounded-[1.2rem] px-4 py-4 border border-white/60">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Original Sanskrit live</p>
                <p className="font-display text-2xl font-bold text-gray-900 mt-2">{upanishadLayerCounts.originalLive}</p>
                <p className="text-sm text-gray-600 mt-1">texts currently available with official-source Sanskrit in app</p>
              </div>
              <div className="glass-panel rounded-[1.2rem] px-4 py-4 border border-white/60">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Official companion needed</p>
                <p className="font-display text-2xl font-bold text-gray-900 mt-2">{upanishadLayerCounts.originalCompanion}</p>
                <p className="text-sm text-gray-600 mt-1">texts still relying on official companion sources for the original layer</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {(canonicalChapters.length > 0 || ramayanaKandas.length > 0) && (
        <section className="space-y-3">
          <div className="clay-card rounded-[1.6rem] px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Complete study path</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  {canonicalChapters.length > 0
                    ? 'The full chapter-and-verse Gita is now live inside Pathshala. Use the chapter map below for structured study, and open the companion source when you want audio or extra commentary layers.'
                    : 'The Valmiki Ramayana now opens as a Kanda-first study path. Use the Kanda map below for narrative continuity, then open the companion sources when you want the wider public-domain text or sarga-level study index.'}
                </p>
              </div>
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
                      Companion source
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
                      Public-domain text
                    </a>
                    <a
                      href={getOfficialRamayanaStudyUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Study index
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(canonicalChapters.length > 0 ? canonicalChapters : ramayanaKandas).map((chapter) => (
                <Link
                  key={chapter.id}
                  href={getPathshalaChapterHref(tradition, section, chapter.id)}
                  className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
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
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">{chapter.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {readingPlans.length > 0 && (
        <section className="space-y-3">
          <div className="glass-panel rounded-[1.6rem] px-4 py-4 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Reading plans</p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                {section === 'gita'
                  ? 'Start with a guided rhythm instead of browsing at random. These plans point into the same canonical Gita chapter map above.'
                  : 'Start with a guided narrative rhythm instead of browsing disconnected passages. These plans point into the Kanda map above.'}
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {readingPlans.map((plan) => (
                <div key={plan.id} className="clay-card rounded-[1.4rem] px-4 py-4 space-y-3">
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
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              {(canonicalChapters.length > 0 || ramayanaKandas.length > 0) ? 'Featured entry points' : 'Texts and lessons'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {(canonicalChapters.length > 0 || ramayanaKandas.length > 0)
                ? section === 'gita'
                  ? 'The full verse corpus now lives inside the chapter pages above. These featured openings are good places to begin.'
                  : 'The Kanda flow now holds the narrative structure. These local passages are strong first openings inside the broader Ramayana path.'
                : section === 'upanishad'
                  ? 'Open a principal Upanishad to read the full translated study text, see the original-text layer, and jump to official companions where needed.'
                  : 'Open a text to read the passage, source note, and related material.'}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {featuredEntries.map((entry) => {
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
