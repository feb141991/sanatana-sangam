import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  findPublicPanchatantraStory,
  getStoryOfTheDay,
  panchatantraStoryUrl,
  type PanchatantraLang,
} from '@/lib/panchatantra-public';
import { BookOpen, Sparkles, ExternalLink, Compass } from 'lucide-react';

export const revalidate = 0;

interface EmbedStoryPageProps {
  searchParams: Promise<{
    slug?: string;
    theme?: 'light' | 'dark' | 'gold';
    lang?: 'en' | 'hi';
  }>;
}

export async function generateMetadata({ searchParams }: EmbedStoryPageProps): Promise<Metadata> {
  const params = await searchParams;
  const lang: PanchatantraLang = params.lang === 'hi' ? 'hi' : 'en';
  const story = params.slug ? findPublicPanchatantraStory(params.slug) || getStoryOfTheDay() : getStoryOfTheDay();

  const title = lang === 'hi' ? story.titleHi : story.title;
  return {
    title: `${title} | Panchatantra Story of the Day`,
    description: `Read the illustrated fable "${title}" with moral takeaway. Powered by Shoonaya Panchatantra Library.`,
  };
}

export default async function EmbedStoryPage({ searchParams }: EmbedStoryPageProps) {
  const params = await searchParams;
  const lang: PanchatantraLang = params.lang === 'hi' ? 'hi' : 'en';
  const theme = params.theme || 'light';

  const story = params.slug ? findPublicPanchatantraStory(params.slug) || getStoryOfTheDay() : getStoryOfTheDay();
  const title = lang === 'hi' ? story.titleHi : story.title;
  const moral = lang === 'hi' ? story.moralHi : story.moral;
  const excerpt = lang === 'hi' ? story.bodyHi[0] : story.body[0];
  const storyUrl = panchatantraStoryUrl(story.slug, lang);

  const themeStyles = {
    light: {
      card: 'bg-white text-stone-900 border-stone-200 shadow-sm',
      headerBg: 'bg-amber-50/70 border-amber-100',
      pillBg: 'bg-amber-100/70 text-amber-900 border-amber-200/60',
      moralBg: 'bg-amber-50/80 text-amber-900 border-amber-200/60',
      mutedText: 'text-stone-500',
      cta: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
      footerBorder: 'border-stone-100 bg-stone-50/80 text-stone-600',
      linkText: 'text-amber-700 hover:text-amber-900',
    },
    dark: {
      card: 'bg-stone-900 text-stone-100 border-stone-800 shadow-md',
      headerBg: 'bg-stone-800/60 border-stone-700/50',
      pillBg: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
      moralBg: 'bg-amber-950/40 text-amber-300 border-amber-800/30',
      mutedText: 'text-stone-400',
      cta: 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm',
      footerBorder: 'border-stone-800 bg-stone-950/60 text-stone-400',
      linkText: 'text-amber-400 hover:text-amber-300',
    },
    gold: {
      card: 'bg-amber-950 text-amber-50 border-amber-700/40 shadow-lg',
      headerBg: 'bg-amber-900/40 border-amber-700/30',
      pillBg: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
      moralBg: 'bg-amber-900/30 text-amber-200 border-amber-700/30',
      mutedText: 'text-amber-200/70',
      cta: 'bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold shadow-md',
      footerBorder: 'border-amber-900/60 bg-amber-950/80 text-amber-300/80',
      linkText: 'text-amber-300 hover:text-amber-100',
    },
  }[theme];

  const firstScene = story.scenes[0];

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 sm:p-3 box-border">
      <div
        className={`w-full rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${themeStyles.card}`}
      >
        {/* Header Strip */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between ${themeStyles.headerBg}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold truncate tracking-wide">
              {lang === 'hi' ? 'पंचतंत्र दैनिक नीति-कथा' : 'Panchatantra Story of the Day'}
            </span>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${themeStyles.pillBg}`}>
            {story.durationMin} {lang === 'hi' ? 'मिनट' : 'min read'}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3">
          {/* Cover Illustration */}
          {firstScene && (
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/40 shadow-inner">
              <Image
                src={firstScene.src}
                alt={lang === 'hi' ? firstScene.altHi : firstScene.alt}
                fill
                sizes="(max-width: 440px) 100vw, 440px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Title */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif leading-snug">
              {title}
            </h2>

            {/* Moral Badge */}
            <div className={`mt-2 p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${themeStyles.moralBg}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {lang === 'hi' ? 'नीति संदेश (Moral)' : 'Moral Lesson'}
                </span>
                <span className="font-medium italic">
                  &ldquo;{moral}&rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <p className={`text-xs line-clamp-3 leading-relaxed ${themeStyles.mutedText}`}>
            {excerpt}
          </p>

          {/* CTA Link to Full Storybook */}
          <Link
            href={storyUrl}
            target="_blank"
            rel="noopener"
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${themeStyles.cta}`}
          >
            <span>{lang === 'hi' ? 'पूरी सचित्र कथा पढ़ें' : 'Read Full Illustrated Story'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dofollow Canonical Backlink */}
        <div className={`px-4 py-2 border-t flex items-center justify-between text-[11px] ${themeStyles.footerBorder}`}>
          <span className="truncate">
            {lang === 'hi' ? 'हस्तनिर्मित क्लेमेशन कला' : 'Handcrafted Claymation Artwork'}
          </span>
          <Link
            href="https://www.shoonaya.com/stories/panchatantra"
            target="_blank"
            rel="noopener"
            className={`font-semibold inline-flex items-center gap-1 transition-colors underline-offset-2 hover:underline ${themeStyles.linkText}`}
          >
            <span>🕉️ Shoonaya Stories</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
