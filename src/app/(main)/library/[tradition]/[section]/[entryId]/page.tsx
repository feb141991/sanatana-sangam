import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLibrarySourceMeta } from '@/lib/library-provenance';
import {
  getCanonicalChapter,
  getCanonicalVerseLinksForChapter,
  getGitaEntriesForChapter,
  getOfficialGitaAudioUrl,
  getOfficialGitaChapterUrl,
} from '@/lib/pathshala-canonical';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  getLibraryEntryById,
  getLibrarySectionById,
  getPathshalaTraditionMeta,
  getRelatedEntries,
  getSectionForEntry,
  isLibraryTradition,
} from '@/lib/library-content';
import {
  getAIChatHref,
  getPathshalaEntryHrefFromSection,
  getPathshalaSectionHref,
  getPathshalaTraditionHref,
} from '@/lib/pathshala-links';
import PathshalaActionBar from '@/app/(main)/library/PathshalaActionBar';

export default async function PathshalaEntryPage({
  params,
}: {
  params: Promise<{ tradition: string; section: string; entryId: string }>;
}) {
  const { tradition, section, entryId } = await params;

  if (!isLibraryTradition(tradition)) {
    notFound();
  }

  const traditionMeta = getPathshalaTraditionMeta(tradition);
  const sectionMeta = getLibrarySectionById(section);
  const canonicalChapter = getCanonicalChapter(section, entryId);
  const entry = getLibraryEntryById(entryId);
  const entrySection = entry ? getSectionForEntry(entry) : undefined;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isBookmarked = false;

  if (user) {
    const { data: stateRow } = await supabase
      .from('pathshala_user_state')
      .select('bookmarked_at')
      .eq('user_id', user.id)
      .eq('entry_id', entryId)
      .maybeSingle();

    isBookmarked = !!stateRow?.bookmarked_at;
  }

  if (!sectionMeta || sectionMeta.tradition !== tradition) {
    notFound();
  }

  if (canonicalChapter) {
    const chapterEntries = getGitaEntriesForChapter(canonicalChapter.chapterNumber);
    const verseLinks = getCanonicalVerseLinksForChapter(canonicalChapter.chapterNumber);
    const localVerseCount = verseLinks.filter((verse) => !!verse.localEntry).length;
    const chapterContext = `Bhagavad Gita Chapter ${canonicalChapter.chapterNumber} — ${canonicalChapter.englishTitle}`;
    const studyPrompts = [
      {
        title: 'Explain with AI',
        description: 'Ask for a simple but source-aware explanation of the chapter’s main teaching.',
        href: getAIChatHref(
          `Explain Bhagavad Gita Chapter ${canonicalChapter.chapterNumber} (${canonicalChapter.englishTitle}) in simple words. Keep it source-aware and practical.`,
          chapterContext,
        ),
      },
      {
        title: 'Quiz me',
        description: 'Turn the chapter into a few short recall questions to check understanding.',
        href: getAIChatHref(
          `Quiz me on Bhagavad Gita Chapter ${canonicalChapter.chapterNumber} (${canonicalChapter.englishTitle}) with 5 short questions and then give the answers after I try.`,
          chapterContext,
        ),
      },
      {
        title: 'Make flashcards',
        description: 'Create quick revision cards for key ideas, verses, and Sanskrit terms.',
        href: getAIChatHref(
          `Make 6 study flashcards for Bhagavad Gita Chapter ${canonicalChapter.chapterNumber} (${canonicalChapter.englishTitle}) with one key idea per card.`,
          chapterContext,
        ),
      },
    ];

    return (
      <div className="space-y-4 pb-6 fade-in">
        <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            <Link href="/library" className="text-[color:var(--brand-primary)]">Pathshala</Link>
            <span>•</span>
            <Link href={getPathshalaTraditionHref(tradition)} className="text-[color:var(--brand-primary)]">{traditionMeta.label}</Link>
            <span>•</span>
            <Link href={getPathshalaSectionHref(tradition, sectionMeta.id)} className="text-[color:var(--brand-primary)]">{sectionMeta.title}</Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                {sectionMeta.emoji} Chapter {canonicalChapter.chapterNumber}
              </span>
              <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
                {canonicalChapter.verseCount} verses
              </span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">{canonicalChapter.englishTitle}</h1>
              <p className="text-sm text-gray-500 mt-1">{canonicalChapter.sanskritTitle} · {canonicalChapter.transliterationTitle}</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{canonicalChapter.summary}</p>
          </div>
        </div>

        <div className="clay-card rounded-[1.7rem] px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Companion source</p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                This full chapter is now available inside Pathshala. Use the IIT Kanpur Gita Supersite alongside it when you want authoritative audio, recitation support, or extra commentary layers.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <a
                href={getOfficialGitaChapterUrl(canonicalChapter.chapterNumber)}
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                style={{ color: 'var(--brand-primary)' }}
              >
                Open companion text
              </a>
              <a
                href={getOfficialGitaAudioUrl(canonicalChapter.chapterNumber)}
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                style={{ color: 'var(--brand-primary)' }}
              >
                Listen / recite
              </a>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {studyPrompts.map((prompt) => (
              <Link
                key={prompt.title}
                href={prompt.href}
                className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">{prompt.title}</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{prompt.description}</p>
              </Link>
            ))}
            <a
              href={getOfficialGitaAudioUrl(canonicalChapter.chapterNumber)}
              target="_blank"
              rel="noreferrer"
              className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Recitation mode</p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                Start with authoritative audio and recite along verse by verse. Pronunciation guidance comes after the trusted audio layer is in place.
              </p>
            </a>
          </div>
        </div>

        {user && (
          <PathshalaActionBar
            userId={user.id}
            tradition={tradition}
            sectionId={sectionMeta.id}
            entryId={canonicalChapter.id}
            initiallyBookmarked={isBookmarked}
          />
        )}

        <section className="space-y-3">
          <div className="glass-panel rounded-[1.6rem] px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Verse navigator</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  Every verse in the chapter is now mapped to a local Pathshala page. Use these chips to move verse by verse inside the app, or jump to the companion source when you want audio and commentary.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 text-[11px] font-medium">
                <span className="clay-pill text-[color:var(--brand-primary)]">Live in app</span>
                <span className="glass-chip px-3 py-1.5 rounded-full text-gray-600">Companion source</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="clay-card rounded-[1.35rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Current in-app coverage</p>
                <p className="font-display text-2xl font-bold text-gray-900 mt-2">{localVerseCount} / {canonicalChapter.verseCount}</p>
                <p className="text-sm text-gray-600 mt-1">verses currently supported with local Pathshala entries</p>
              </div>
              <div className="glass-panel rounded-[1.35rem] px-4 py-4 border border-white/60">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Best way to study today</p>
                <p className="text-sm text-gray-700 leading-relaxed mt-2">
                  Stay inside Pathshala for the full verse flow, bookmarks, and AI study prompts, then use the companion links above for audio and deeper reference layers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
              {verseLinks.map((verse) => {
                if (verse.localEntry) {
                  return (
                    <Link
                      key={`verse-${verse.verseNumber}`}
                      href={getPathshalaEntryHrefFromSection(sectionMeta, verse.localEntry)}
                      className="clay-pill text-center text-sm font-semibold text-[color:var(--brand-primary)] py-2 hover:-translate-y-0.5 transition"
                    >
                      {verse.verseNumber}
                    </Link>
                  );
                }

                return (
                  <a
                    key={`verse-${verse.verseNumber}`}
                    href={verse.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-chip text-center rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-[color:var(--brand-primary)] transition"
                  >
                    {verse.verseNumber}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Chapter verses</p>
            <p className="text-sm text-gray-600 mt-1">These verses are all live in Pathshala now, in order, as a complete local chapter reading surface.</p>
          </div>

          {chapterEntries.length === 0 ? (
            <div className="glass-panel rounded-[1.5rem] px-4 py-5">
              <p className="text-sm font-semibold text-gray-900">This chapter should be fully live, but no local verse entries were found.</p>
              <p className="text-sm text-gray-600 mt-2">
                That means the local corpus and chapter map have drifted out of sync. Use the companion source above for now while we fix the import.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {chapterEntries.map((chapterEntry) => (
                <Link
                  key={chapterEntry.id}
                  href={getPathshalaEntryHrefFromSection(sectionMeta, chapterEntry)}
                  className="glass-panel rounded-[1.45rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{chapterEntry.source}</p>
                      <p className="text-sm text-gray-600 leading-relaxed mt-2">{chapterEntry.meaning}</p>
                    </div>
                    <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (!entry || !entrySection || sectionMeta.id !== entrySection.id) {
    notFound();
  }

  const sourceMeta = getLibrarySourceMeta(entry);
  const relatedEntries = getRelatedEntries(entry, 4);

  return (
    <div className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Link href="/library" className="text-[color:var(--brand-primary)]">Pathshala</Link>
          <span>•</span>
          <Link href={getPathshalaTraditionHref(tradition)} className="text-[color:var(--brand-primary)]">{traditionMeta.label}</Link>
          <span>•</span>
          <Link href={getPathshalaSectionHref(tradition, sectionMeta.id)} className="text-[color:var(--brand-primary)]">{sectionMeta.title}</Link>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
              {sectionMeta.emoji} {sectionMeta.title}
            </span>
            <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
              {sourceMeta.label}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{entry.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{entry.source}</p>
          </div>
        </div>
      </div>

      <article className="clay-card rounded-[1.8rem] px-5 py-5 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Original text</p>
          <p
            className={`mt-3 whitespace-pre-line leading-relaxed ${
              entry.tradition === 'sikh'
                ? 'text-base'
                : entry.tradition === 'buddhist' || entry.tradition === 'jain'
                  ? 'font-mono text-sm'
                  : 'font-devanagari text-lg'
            } text-gray-900`}
            style={{ fontFamily: entry.tradition === 'hindu' ? 'var(--font-devanagari, serif)' : 'inherit' }}
          >
            {entry.original}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Transliteration</p>
          <p className="mt-2 text-sm text-gray-600 italic leading-relaxed whitespace-pre-line">{entry.transliteration}</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Meaning</p>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{entry.meaning}</p>
        </div>

        <div className="glass-panel rounded-[1.35rem] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Source note</p>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">{sourceMeta.note}</p>
        </div>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span key={tag} className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {user && (
        <PathshalaActionBar
          userId={user.id}
          tradition={tradition}
          sectionId={sectionMeta.id}
          entryId={entry.id}
          initiallyBookmarked={isBookmarked}
        />
      )}

      {relatedEntries.length > 0 && (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Study next</p>
            <p className="text-sm text-gray-600 mt-1">Continue inside the same text family without returning to the top-level Pathshala browse.</p>
          </div>
          <div className="grid gap-3">
            {relatedEntries.map((relatedEntry) => (
              <Link
                key={relatedEntry.id}
                href={getPathshalaEntryHrefFromSection(sectionMeta, relatedEntry)}
                className="glass-panel rounded-[1.4rem] px-4 py-4 border border-white/60 hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{relatedEntry.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1 line-clamp-2">{relatedEntry.meaning}</p>
                  </div>
                  <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
