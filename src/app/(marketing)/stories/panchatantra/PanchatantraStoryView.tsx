import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

import {
  PANCHATANTRA_HUB_PATH,
  RETELLING_NOTICE,
  panchatantraStoryPath,
  type PanchatantraLang,
  type PublicPanchatantraStory,
} from "@/lib/panchatantra-public";

type PanchatantraStoryViewProps = {
  story: PublicPanchatantraStory;
  lang: PanchatantraLang;
  others: PublicPanchatantraStory[];
};

const COPY = {
  en: {
    back: "All Panchatantra stories",
    minutes: "min read",
    moral: "The moral",
    switchLabel: "हिंदी में पढ़ें",
    more: "More Panchatantra stories",
    app: "More Panchatantra stories are in the Shoonaya app.",
    appCta: "Get the app",
  },
  hi: {
    back: "सभी पंचतंत्र कथाएँ",
    minutes: "मिनट में पढ़ें",
    moral: "सीख",
    switchLabel: "Read in English",
    more: "और पंचतंत्र कथाएँ",
    app: "Shoonaya ऐप में और भी पंचतंत्र कथाएँ हैं।",
    appCta: "ऐप पाएँ",
  },
} as const;

export function PanchatantraStoryView({ story, lang, others }: PanchatantraStoryViewProps) {
  const copy = COPY[lang];
  const isHindi = lang === "hi";
  const title = isHindi ? story.titleHi : story.title;
  const moral = isHindi ? story.moralHi : story.moral;
  const paragraphs = isHindi ? story.bodyHi : story.body;
  const otherLang: PanchatantraLang = isHindi ? "en" : "hi";

  return (
    <main className="w-full overflow-hidden" lang={isHindi ? "hi" : undefined}>
      <section className="relative w-full border-b border-[var(--card-border)] bg-gradient-to-b from-[var(--surface-soft)] via-[var(--surface-base)] to-[var(--surface-base)] px-6 pb-14 pt-32 sm:px-10 lg:px-14 lg:pb-20 lg:pt-40">
        <div className="mx-auto max-w-3xl">
          <Link
            href={PANCHATANTRA_HUB_PATH}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-semibold text-[var(--text-muted-warm)] transition-colors hover:text-[var(--text-cream)]"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>{copy.back}</span>
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-[var(--text-dim)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              {story.durationMin} {copy.minutes}
            </span>
            <Link
              href={panchatantraStoryPath(story.slug, otherLang)}
              hrefLang={otherLang}
              lang={otherLang}
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--card-border)] px-4 font-semibold text-[var(--text-muted-warm)] transition-colors hover:text-[var(--text-cream)]"
            >
              {copy.switchLabel}
            </Link>
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-[var(--text-cream)] sm:text-5xl">
            <span aria-hidden="true" className="mr-3">
              {story.portrait}
            </span>
            {title}
          </h1>

          <p className="mt-6 text-sm leading-relaxed text-[var(--text-dim)]">{RETELLING_NOTICE[lang]}</p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-14 sm:px-10 lg:py-20">
        <div className="space-y-6 text-lg leading-9 text-[var(--text-muted-warm)]">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <aside className="mt-12 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-[var(--text-cream)]">{copy.moral}</h2>
          <p className="mt-3 text-lg leading-8 text-[var(--text-muted-warm)]">{moral}</p>
        </aside>
      </article>

      {others.length > 0 ? (
        <section className="mx-auto max-w-3xl border-t border-[var(--card-border)] px-6 py-12 sm:px-10">
          <h2 className="font-display text-xl font-semibold text-[var(--text-cream)]">{copy.more}</h2>
          <ul className="mt-5 space-y-3">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  href={panchatantraStoryPath(other.slug, lang)}
                  className="flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--text-cream)] transition-colors hover:border-[var(--brand-primary-strong)]"
                >
                  <span aria-hidden="true">{other.portrait}</span>
                  <span className="flex-1">{isHindi ? other.titleHi : other.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-6 pb-20 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-6">
          <p className="flex-1 text-base leading-7 text-[var(--text-muted-warm)]">{copy.app}</p>
          <Link
            href="/get"
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--brand-primary-strong)] px-5 text-sm font-semibold text-[var(--text-cream)]"
          >
            {copy.appCta}
          </Link>
        </div>
      </section>
    </main>
  );
}
