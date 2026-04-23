import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLibrarySourceMeta } from '@/lib/library-provenance';
import {
  getCanonicalChapter,
  getCanonicalVerseLinksForChapter,
  getGitaEntriesForChapter,
  getOfficialGitaAudioUrl,
  getOfficialGitaChapterUrl,
  getOfficialRamayanaStudyUrl,
  getOfficialRamayanaTextUrl,
  getRamayanaEntriesForKanda,
  getRamayanaKanda,
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
import { getUpanishadStudyMeta } from '@/lib/upanishad-study';
import {
  getAIChatHref,
  getGitaRecitationHref,
  getPathshalaEntryHrefFromSection,
  getPathshalaSectionHref,
  getPathshalaTraditionHref,
} from '@/lib/pathshala-links';
import PathshalaActionBar from '@/app/(main)/library/PathshalaActionBar';
import { MotionFade, MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

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
  const canonicalKanda = getRamayanaKanda(section, entryId);
  const entry = getLibraryEntryById(entryId);
  const entrySection = entry ? getSectionForEntry(entry) : undefined;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isBookmarked = false;
  let scriptureScriptPreference = 'original';
  let showTransliterationPreference = true;
  let meaningLanguagePreference = 'en';

  if (user) {
    const { data: stateRow } = await supabase
      .from('pathshala_user_state')
      .select('bookmarked_at')
      .eq('user_id', user.id)
      .eq('entry_id', entryId)
      .maybeSingle();

    isBookmarked = !!stateRow?.bookmarked_at;

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('scripture_script, show_transliteration, meaning_language')
      .eq('id', user.id)
      .maybeSingle();

    scriptureScriptPreference = (profileRow as any)?.scripture_script ?? 'original';
    showTransliterationPreference = (profileRow as any)?.show_transliteration ?? true;
    meaningLanguagePreference = (profileRow as any)?.meaning_language ?? 'en';
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
      <MotionFade className="space-y-4 pb-6 fade-in">
        <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">
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
              <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-[color:var(--brand-muted)]">
                {canonicalChapter.verseCount} verses
              </span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[color:var(--text-cream)]">{canonicalChapter.englishTitle}</h1>
              <p className="text-sm text-[color:var(--brand-muted)] mt-1">{canonicalChapter.sanskritTitle} · {canonicalChapter.transliterationTitle}</p>
            </div>
            <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed">{canonicalChapter.summary}</p>
          </div>
        </div>

        <div className="clay-card rounded-[1.7rem] px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Companion source</p>
              <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
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
              <Link
                href={getGitaRecitationHref(canonicalChapter.id)}
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                style={{ color: 'var(--brand-primary)' }}
              >
                Guided recitation mode
              </Link>
            </div>
          </div>

            <MotionStagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" delay={0.04}>
              {studyPrompts.map((prompt) => (
                <MotionItem key={prompt.title}>
                <Link
                  key={prompt.title}
                  href={prompt.href}
                  className="glass-panel rounded-[1.4rem] px-4 py-4 motion-lift"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">{prompt.title}</p>
                  <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">{prompt.description}</p>
                </Link>
                </MotionItem>
              ))}
              <MotionItem>
              <a
                href={getOfficialGitaAudioUrl(canonicalChapter.chapterNumber)}
                target="_blank"
                rel="noreferrer"
                className="glass-panel rounded-[1.4rem] px-4 py-4 motion-lift"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Recitation mode</p>
                <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
                  Start with authoritative audio and recite along verse by verse. Pronunciation guidance comes after the trusted audio layer is in place.
                </p>
              </a>
              </MotionItem>
            </MotionStagger>
        </div>

        <section className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                eyebrow: 'Read',
                title: 'Stay verse by verse',
                description: 'Use the local chapter flow when you want continuity, bookmarks, and a calm in-app reading rhythm.',
              },
              {
                eyebrow: 'Recite',
                title: 'Lean on authoritative audio',
                description: 'Companion audio is still the trusted recitation layer while in-app authoritative playback is being prepared carefully.',
              },
              {
                eyebrow: 'Reflect',
                title: 'Study with one question',
                description: 'Ask for explanation, quiz, or flashcards one at a time so the chapter remains understandable instead of over-processed.',
              },
            ].map((item) => (
              <div key={item.title} className="glass-panel rounded-[1.35rem] px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[color:var(--brand-primary)]">{item.eyebrow}</p>
                <p className="font-semibold text-[color:var(--text-cream)] mt-2">{item.title}</p>
                <p className="text-sm text-[color:var(--brand-muted)] mt-2 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

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
                <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
                  Every verse in the chapter is now mapped to a local Pathshala page. Use these chips to move verse by verse inside the app, or jump to the companion source when you want audio and commentary.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2 text-[11px] font-medium">
                <span className="clay-pill text-[color:var(--brand-primary)]">Live in app</span>
                <span className="glass-chip px-3 py-1.5 rounded-full text-[color:var(--brand-muted)]">Companion source</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="clay-card rounded-[1.35rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">Current in-app coverage</p>
                <p className="font-display text-2xl font-bold text-[color:var(--text-cream)] mt-2">{localVerseCount} / {canonicalChapter.verseCount}</p>
                <p className="text-sm text-[color:var(--brand-muted)] mt-1">verses currently supported with local Pathshala entries</p>
              </div>
              <div className="glass-panel rounded-[1.35rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">Best way to study today</p>
                <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
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
                      className="clay-pill text-center text-sm font-semibold text-[color:var(--brand-primary)] py-2 motion-lift"
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
                    className="glass-chip text-center rounded-full px-3 py-2 text-sm font-medium text-[color:var(--text-muted-warm)] hover:text-[color:var(--brand-primary)] transition"
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-muted)]">Chapter verses</p>
            <p className="text-sm text-[color:var(--brand-muted)] mt-1">These verses are all live in Pathshala now, in order, as a complete local chapter reading surface.</p>
          </div>

          {chapterEntries.length === 0 ? (
            <div className="glass-panel rounded-[1.5rem] px-4 py-5">
              <p className="text-sm font-semibold text-[color:var(--text-cream)]">This chapter should be fully live, but no local verse entries were found.</p>
              <p className="text-sm text-[color:var(--brand-muted)] mt-2">
                That means the local corpus and chapter map have drifted out of sync. Use the companion source above for now while we fix the import.
              </p>
            </div>
          ) : (
            <MotionStagger className="grid gap-3" delay={0.05}>
              {chapterEntries.map((chapterEntry) => (
                <MotionItem key={chapterEntry.id}>
                <Link
                  key={chapterEntry.id}
                  href={getPathshalaEntryHrefFromSection(sectionMeta, chapterEntry)}
                  className="glass-panel rounded-[1.45rem] px-4 py-4 motion-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--text-cream)]">{chapterEntry.source}</p>
                      <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed mt-2">{chapterEntry.meaning}</p>
                    </div>
                    <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                  </div>
                </Link>
                </MotionItem>
              ))}
            </MotionStagger>
          )}
        </section>
      </MotionFade>
    );
  }

  if (canonicalKanda) {
    const kandaEntries = getRamayanaEntriesForKanda(canonicalKanda.kandaNumber);
    const studyContext = `Valmiki Ramayana ${canonicalKanda.transliterationTitle} — ${canonicalKanda.englishTitle}`;
    const studyPrompts = [
      {
        title: 'Explain with AI',
        description: 'Ask for a source-aware explanation of this Kanda’s narrative and dharmic themes.',
        href: getAIChatHref(
          `Explain Valmiki Ramayana ${canonicalKanda.transliterationTitle} (${canonicalKanda.englishTitle}) in simple but source-aware terms. Focus on the main events and dharmic lessons.`,
          studyContext,
        ),
      },
      {
        title: 'Character arcs',
        description: 'Trace the main people, loyalties, and turning points inside this Kanda.',
        href: getAIChatHref(
          `Map the main character arcs and turning points in Valmiki Ramayana ${canonicalKanda.transliterationTitle} (${canonicalKanda.englishTitle}).`,
          studyContext,
        ),
      },
      {
        title: 'Quiz me',
        description: 'Turn the Kanda into quick recall questions to strengthen retention.',
        href: getAIChatHref(
          `Quiz me on Valmiki Ramayana ${canonicalKanda.transliterationTitle} (${canonicalKanda.englishTitle}) with 5 short questions and then give the answers after I try.`,
          studyContext,
        ),
      },
    ];

    return (
      <MotionFade className="space-y-4 pb-6 fade-in">
        <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">
            <Link href="/library" className="text-[color:var(--brand-primary)]">Pathshala</Link>
            <span>•</span>
            <Link href={getPathshalaTraditionHref(tradition)} className="text-[color:var(--brand-primary)]">{traditionMeta.label}</Link>
            <span>•</span>
            <Link href={getPathshalaSectionHref(tradition, sectionMeta.id)} className="text-[color:var(--brand-primary)]">{sectionMeta.title}</Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                {sectionMeta.emoji} Kanda {canonicalKanda.kandaNumber}
              </span>
              <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-[color:var(--brand-muted)]">
                {canonicalKanda.cantoCount} cantos
              </span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[color:var(--text-cream)]">{canonicalKanda.englishTitle}</h1>
              <p className="text-sm text-[color:var(--brand-muted)] mt-1">{canonicalKanda.sanskritTitle} · {canonicalKanda.transliterationTitle}</p>
            </div>
            <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed">{canonicalKanda.summary}</p>
          </div>
        </div>

        <div className="clay-card rounded-[1.7rem] px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Companion sources</p>
              <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
                The Ramayana path is now organized Kanda first inside Pathshala. Use the public-domain Griffith text and the sarga-level study index alongside these guided pages while we expand local narrative coverage further.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
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
                Sarga study index
              </a>
            </div>
          </div>

          <MotionStagger className="grid gap-3 md:grid-cols-3" delay={0.04}>
            {studyPrompts.map((prompt) => (
              <MotionItem key={prompt.title}>
              <Link
                key={prompt.title}
                href={prompt.href}
                className="glass-panel rounded-[1.4rem] px-4 py-4 motion-lift"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">{prompt.title}</p>
                <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">{prompt.description}</p>
              </Link>
              </MotionItem>
            ))}
          </MotionStagger>
        </div>

        {user && (
          <PathshalaActionBar
            userId={user.id}
            tradition={tradition}
            sectionId={sectionMeta.id}
            entryId={canonicalKanda.id}
            initiallyBookmarked={isBookmarked}
          />
        )}

        <section className="space-y-3">
          <div className="glass-panel rounded-[1.6rem] px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Local Pathshala passages</p>
                <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
                  These passages are already live inside this Kanda path. They are the best local openings while the fuller Ramayana corpus is expanded.
                </p>
              </div>
              <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">
                {kandaEntries.length} live passages
              </span>
            </div>

            {kandaEntries.length === 0 ? (
              <div className="glass-panel rounded-[1.35rem] px-4 py-4">
                <p className="text-sm font-semibold text-[color:var(--text-cream)]">This Kanda structure is live, but no local passages have been mapped into it yet.</p>
                <p className="text-sm text-[color:var(--brand-muted)] mt-2">
                  Use the companion sources above for the full text while we continue local narrative ingestion.
                </p>
              </div>
            ) : (
              <MotionStagger className="grid gap-3" delay={0.05}>
                {kandaEntries.map((kandaEntry) => (
                  <MotionItem key={kandaEntry.id}>
                  <Link
                    key={kandaEntry.id}
                    href={getPathshalaEntryHrefFromSection(sectionMeta, kandaEntry)}
                    className="glass-panel rounded-[1.45rem] px-4 py-4 motion-lift"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[color:var(--text-cream)]">{kandaEntry.title}</p>
                        <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed mt-2">{kandaEntry.meaning}</p>
                      </div>
                      <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                    </div>
                  </Link>
                  </MotionItem>
                ))}
              </MotionStagger>
            )}
          </div>
        </section>
      </MotionFade>
    );
  }

  if (!entry || !entrySection || sectionMeta.id !== entrySection.id) {
    notFound();
  }

  const sourceMeta = getLibrarySourceMeta(entry);
  const relatedEntries = getRelatedEntries(entry, 4);
  const showOriginalScript = scriptureScriptPreference !== 'transliteration';
  const showTransliteration = showTransliterationPreference && entry.transliteration.trim().length > 0;
  const transliterationIsPrimary = scriptureScriptPreference === 'transliteration';
  const meaningHeading = meaningLanguagePreference === 'hi'
    ? 'Meaning (Hindi later)'
    : meaningLanguagePreference === 'pa'
      ? 'Meaning (Punjabi later)'
      : 'Meaning';
  const upanishadStudyMeta = sectionMeta.id === 'upanishad' ? getUpanishadStudyMeta(entry.id) : undefined;
  const upanishadStudyPrompts = sectionMeta.id === 'upanishad'
    ? [
        {
          title: 'Explain with AI',
          description: 'Ask for a source-aware explanation of the Upanishad’s main teaching in simple language.',
          href: getAIChatHref(
            `Explain ${entry.title} in simple but source-aware language. Focus on the central teaching, key Sanskrit ideas, and practical reflection.`,
            `${entry.title} — ${entry.source}`,
          ),
        },
        {
          title: 'Quiz me',
          description: 'Turn the text into short recall questions so the main teachings stay with you.',
          href: getAIChatHref(
            `Quiz me on ${entry.title} with 5 short recall questions, then show the answers after I try.`,
            `${entry.title} — ${entry.source}`,
          ),
        },
        {
          title: 'Make flashcards',
          description: 'Create revision cards for the core ideas, verses, and philosophical vocabulary.',
          href: getAIChatHref(
            `Make 6 study flashcards for ${entry.title}. Keep them source-aware and focused on the main teaching.`,
            `${entry.title} — ${entry.source}`,
          ),
        },
      ]
    : [];

  return (
    <MotionFade className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">
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
            <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-[color:var(--brand-muted)]">
              {sourceMeta.label}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[color:var(--text-cream)]">{entry.title}</h1>
            <p className="text-sm text-[color:var(--brand-muted)] mt-1">{entry.source}</p>
          </div>
        </div>
      </div>

      {upanishadStudyMeta && (
        <div className="clay-card rounded-[1.7rem] px-5 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-primary)]">Study with Pathshala</p>
              <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
                Use the full translated reading here, the Sanskrit layer when it is live in app, and the AI study prompts below for revision and reflection. Recitation stays companion-linked until the authoritative audio layer is added.
              </p>
            </div>
            {entry.companionSourceUrl && (
              <a
                href={entry.companionSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold shrink-0"
                style={{ color: 'var(--brand-primary)' }}
              >
                {entry.original.trim().length > 0 ? 'Official companion' : 'Open original source'}
              </a>
            )}
          </div>

          <MotionStagger className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" delay={0.04}>
            {upanishadStudyPrompts.map((prompt) => (
              <MotionItem key={prompt.title}>
              <Link
                key={prompt.title}
                href={prompt.href}
                className="glass-panel rounded-[1.4rem] px-4 py-4 motion-lift"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">{prompt.title}</p>
                <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">{prompt.description}</p>
              </Link>
              </MotionItem>
            ))}

            <MotionItem>
            <div className="glass-panel rounded-[1.4rem] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Recitation layer</p>
              <p className="text-sm text-[color:var(--text-muted-warm)] leading-relaxed mt-2">
                {upanishadStudyMeta.recitationLayerStatus === 'companion'
                  ? 'Use the official source as the recitation companion for now. Audio and guided recite-along come after the source-backed text layer.'
                  : 'Recitation support will be layered in after the source-backed text foundation is complete.'}
              </p>
            </div>
            </MotionItem>
          </MotionStagger>
        </div>
      )}

      <article className="clay-card rounded-[1.8rem] px-5 py-5 space-y-5">
        {upanishadStudyMeta && (
          <div className="glass-panel rounded-[1.45rem] px-4 py-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Study layers</p>
              <p className="mt-2 text-sm text-[color:var(--text-muted-warm)] leading-relaxed">
                This Upanishad now lives in Pathshala as a full translated study text. The original Sanskrit layer is surfaced where the official source is text-accessible, and otherwise stays linked as a companion source instead of being faked locally.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="clay-card rounded-[1.2rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">Translation study text</p>
                <p className="font-semibold text-[color:var(--text-cream)] mt-2">Live in app</p>
                <p className="text-sm text-[color:var(--brand-muted)] mt-1">Full translated reading is available directly in Pathshala.</p>
              </div>
              <div className="glass-panel rounded-[1.2rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">Original Sanskrit</p>
                <p className="font-semibold text-[color:var(--text-cream)] mt-2">
                  {upanishadStudyMeta.originalLayerStatus === 'live' ? 'Live in app' : 'Official companion'}
                </p>
                <p className="text-sm text-[color:var(--brand-muted)] mt-1">
                  {upanishadStudyMeta.originalLayerStatus === 'live'
                    ? 'The official Sanskrit text is available directly on this page.'
                    : 'Use the companion source while we continue local original-text ingestion.'}
                </p>
              </div>
              <div className="glass-panel rounded-[1.2rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">Recitation / audio</p>
                <p className="font-semibold text-[color:var(--text-cream)] mt-2">
                  {upanishadStudyMeta.recitationLayerStatus === 'live' ? 'Live in app' : upanishadStudyMeta.recitationLayerStatus === 'companion' ? 'Official companion' : 'Planned'}
                </p>
                <p className="text-sm text-[color:var(--brand-muted)] mt-1">
                  {upanishadStudyMeta.recitationLayerStatus === 'companion'
                    ? 'Use the official companion source for the next recitation step in this iteration.'
                    : 'Audio and recitation support will be layered in after the source-backed text foundation.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {entry.original.trim().length > 0 && showOriginalScript && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">
              {scriptureScriptPreference === 'both' ? 'Original text' : 'Scripture text'}
            </p>
            <p
              className={`mt-3 whitespace-pre-line leading-relaxed ${
                entry.tradition === 'sikh'
                  ? 'text-base'
                  : entry.tradition === 'buddhist' || entry.tradition === 'jain'
                    ? 'font-mono text-sm'
                    : 'font-devanagari text-lg'
              } text-[color:var(--text-cream)]`}
              style={{ fontFamily: entry.tradition === 'hindu' ? 'var(--font-devanagari, serif)' : 'inherit' }}
            >
              {entry.original}
            </p>
          </div>
        )}

        {showTransliteration && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">
              {transliterationIsPrimary ? 'Reading text' : 'Transliteration'}
            </p>
            <p className={`mt-2 leading-relaxed whitespace-pre-line ${transliterationIsPrimary ? 'text-base text-[color:var(--text-cream)]' : 'text-sm text-[color:var(--brand-muted)] italic'}`}>
              {entry.transliteration}
            </p>
          </div>
        )}

        {entry.fullText ? (
          <>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">Overview</p>
              <p className="mt-2 text-sm text-[color:var(--text-muted-warm)] leading-relaxed whitespace-pre-line">{entry.meaning}</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">Complete study text</p>
              <p className="mt-3 text-sm text-[color:var(--text-cream)] leading-relaxed whitespace-pre-line">{entry.fullText}</p>
            </div>
          </>
        ) : (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-muted)]">{meaningHeading}</p>
            <p className="mt-2 text-sm text-[color:var(--text-muted-warm)] leading-relaxed whitespace-pre-line">{entry.meaning}</p>
          </div>
        )}

        {(entry.sourceUrl || entry.companionSourceUrl) && (
          <div className="flex flex-wrap gap-2">
            {entry.sourceUrl && (
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold shrink-0"
                style={{ color: 'var(--brand-primary)' }}
              >
                {entry.companionSourceUrl ? 'Translation source' : 'Open source'}
              </a>
            )}
            {entry.companionSourceUrl && (
              <a
                href={entry.companionSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold shrink-0"
                style={{ color: 'var(--brand-primary)' }}
              >
                {entry.companionSourceLabel ?? 'Original source'}
              </a>
            )}
          </div>
        )}

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span key={tag} className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-[color:var(--brand-muted)]">
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--brand-muted)]">Study next</p>
            <p className="text-sm text-[color:var(--brand-muted)] mt-1">Continue inside the same text family without returning to the top-level Pathshala browse.</p>
          </div>
          <MotionStagger className="grid gap-3" delay={0.05}>
            {relatedEntries.map((relatedEntry) => (
              <MotionItem key={relatedEntry.id}>
              <Link
                key={relatedEntry.id}
                href={getPathshalaEntryHrefFromSection(sectionMeta, relatedEntry)}
                className="glass-panel rounded-[1.4rem] px-4 py-4 motion-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--text-cream)]">{relatedEntry.title}</p>
                    <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed mt-1 line-clamp-2">{relatedEntry.meaning}</p>
                  </div>
                  <span className="text-xs font-semibold text-[color:var(--brand-primary)]">Open →</span>
                </div>
              </Link>
              </MotionItem>
            ))}
          </MotionStagger>
        </section>
      )}
    </MotionFade>
  );
}
