import Link from 'next/link';
import { getCanonicalChaptersForSection, getOfficialGitaAudioUrl, getOfficialGitaChapterUrl } from '@/lib/pathshala-canonical';
import { getGitaRecitationHref, getPathshalaChapterHref, getPathshalaSectionHref, getPathshalaTraditionHref } from '@/lib/pathshala-links';
import { getPathshalaTraditionMeta } from '@/lib/library-content';
import { MotionFade, MotionItem, MotionStagger } from '@/components/motion/MotionPrimitives';

export default async function GitaRecitationPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const params = await searchParams;
  const chapters = getCanonicalChaptersForSection('gita');
  const traditionMeta = getPathshalaTraditionMeta('hindu');
  const highlightedChapter = chapters.find((chapter) => chapter.id === params.chapter);

  return (
    <MotionFade className="space-y-4 pb-6 fade-in">
      <div className="glass-panel rounded-[1.8rem] px-5 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <Link href="/library" className="text-[color:var(--brand-primary)]">Pathshala</Link>
          <span>•</span>
          <Link href={getPathshalaTraditionHref('hindu')} className="text-[color:var(--brand-primary)]">{traditionMeta.label}</Link>
          <span>•</span>
          <Link href={getPathshalaSectionHref('hindu', 'gita')} className="text-[color:var(--brand-primary)]">Bhagavad Gita</Link>
          <span>•</span>
          <span>Recitation</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">Authoritative audio first</span>
            <span className="glass-chip px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-600">Gita-first focus</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Bhagavad Gita recitation mode</h1>
            <p className="text-sm text-gray-700 leading-relaxed mt-2">
              Stay inside Pathshala for the complete local text, then use the IIT Kanpur Gita Supersite for authoritative recitation and audio. This keeps the study layer and the recitation layer honest instead of mixing in synthetic chanting too early.
            </p>
          </div>
        </div>
      </div>

      <div className="clay-card rounded-[1.7rem] px-5 py-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="clay-card rounded-[1.2rem] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Reading layer</p>
            <p className="font-semibold text-gray-900 mt-2">Live in app</p>
            <p className="text-sm text-gray-600 mt-1">All 18 chapters are structured for study and verse navigation directly in Pathshala.</p>
          </div>
          <div className="glass-panel rounded-[1.2rem] px-4 py-4 border border-white/60">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Recitation layer</p>
            <p className="font-semibold text-gray-900 mt-2">Official companion</p>
            <p className="text-sm text-gray-600 mt-1">Audio and verse-by-verse recitation stay with the trusted IIT source in this iteration.</p>
          </div>
          <div className="glass-panel rounded-[1.2rem] px-4 py-4 border border-white/60">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Next layer later</p>
            <p className="font-semibold text-gray-900 mt-2">Howler-guided playback</p>
            <p className="text-sm text-gray-600 mt-1">We will add opt-in guided reading controls later, after the authoritative-source audio flow is fully established.</p>
          </div>
        </div>

        {highlightedChapter && (
          <div className="glass-panel rounded-[1.35rem] px-4 py-4 border border-white/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Continue chapter</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-gray-900">{highlightedChapter.englishTitle}</p>
                <p className="text-sm text-gray-600 mt-1">Chapter {highlightedChapter.chapterNumber} · {highlightedChapter.verseCount} verses</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={getPathshalaChapterHref('hindu', 'gita', highlightedChapter.id)}
                  className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Study chapter
                </Link>
                <a
                  href={getOfficialGitaAudioUrl(highlightedChapter.chapterNumber)}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Listen now
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Recite chapter by chapter</p>
          <p className="text-sm text-gray-600 mt-1">Open the local chapter for reading, or go straight to the official audio companion for recitation.</p>
        </div>

        <MotionStagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" delay={0.05}>
          {chapters.map((chapter) => (
            <MotionItem key={chapter.id}>
              <div className="glass-panel rounded-[1.45rem] px-4 py-4 border border-white/60 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-primary)]">Chapter {chapter.chapterNumber}</p>
                    <p className="font-semibold text-gray-900 mt-2">{chapter.englishTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">{chapter.transliterationTitle}</p>
                  </div>
                  <span className="clay-pill text-[11px] font-medium text-[color:var(--brand-primary)]">{chapter.verseCount} verses</span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">{chapter.summary}</p>

                <div className="grid gap-2">
                  <Link
                    href={getPathshalaChapterHref('hindu', 'gita', chapter.id)}
                    className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    Study inside Pathshala
                  </Link>
                  <a
                    href={getOfficialGitaAudioUrl(chapter.chapterNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    Authoritative audio
                  </a>
                  <a
                    href={getOfficialGitaChapterUrl(chapter.chapterNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-button-secondary px-4 py-2 rounded-full text-sm font-semibold text-center"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    Companion text
                  </a>
                </div>
              </div>
            </MotionItem>
          ))}
        </MotionStagger>
      </section>
    </MotionFade>
  );
}
