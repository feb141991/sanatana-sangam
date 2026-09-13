import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Route, Sparkles } from "lucide-react";

import { LegacyExperienceFrame } from "@/components/marketing/LegacyExperienceFrame";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";

export const metadata: Metadata = {
  title: "Play Gyan Chaupar | Shoonaya",
  description:
    "Play Shoonaya’s interactive Gyan Chaupar and explore a contemplative journey through virtues, obstacles and self-knowledge.",
  alternates: { canonical: "https://www.shoonaya.com/play/gyan-chaupar" },
};

const journeyNotes = [
  {
    title: "The impatient traveller",
    body: "A traveller races toward the highest square, treating every ladder as proof of progress. One careless throw returns them to an old attachment. The board offers a quiet question: were they moving upward, or merely moving quickly?",
    label: "An editorial reflection",
  },
  {
    title: "The square that looked like a setback",
    body: "Another player lands far below where they hoped. Instead of abandoning the journey, they notice the teaching written on that square. What appeared to be a fall becomes the first moment they understand how the board is asking them to play.",
    label: "An editorial reflection",
  },
] as const;

export default function GyanChauparPage() {
  return (
    <main>
      <MarketingPageHero
        eyebrow="Play sacred wisdom"
        title="A board where every move asks something of you."
        intro="Gyan Chaupar turns ascent, distraction, virtue and consequence into a contemplative journey. Play the complete Shoonaya board below—the same experience, preserved without rewriting its rules or motion."
      >
        <a
          href="#play"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 font-semibold text-[var(--surface-base)]"
        >
          Begin the journey
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </MarketingPageHero>

      <section id="play" className="scroll-mt-24 px-4 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <LegacyExperienceFrame
            section="gyan-chaupar"
            title="Interactive Gyan Chaupar board"
          />
        </div>
      </section>

      <section className="border-y border-[var(--card-border)] bg-[var(--surface-soft)] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
                Stories around the board
              </p>
              <h2 className="mt-5 font-display text-5xl font-medium leading-none sm:text-6xl">
                The throw is chance. The response is practice.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-[var(--text-muted-warm)]">
                These short Shoonaya reflections are interpretive prompts, not
                quotations from scripture or claims about the game’s historical
                origin.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {journeyNotes.map((story, index) => (
                <article
                  key={story.title}
                  className="flex min-h-80 flex-col rounded-[2.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-center justify-between text-[var(--brand-primary-strong)]">
                    {index === 0 ? <Route aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                    <span className="font-display text-3xl text-[var(--text-dim)]">0{index + 1}</span>
                  </div>
                  <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-primary-strong)]">
                    {story.label}
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-semibold">{story.title}</h3>
                  <p className="mt-5 text-base leading-8 text-[var(--text-muted-warm)]">{story.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-7 sm:p-9">
            <div className="flex items-center gap-4">
              <BookOpen className="size-6 text-[var(--brand-primary-strong)]" aria-hidden="true" />
              <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted-warm)]">
                Shoonaya keeps historical claims, sourced teachings and editorial interpretation visibly distinct.
              </p>
            </div>
            <Link href="/traditions" className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]">
              Explore the traditions <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
