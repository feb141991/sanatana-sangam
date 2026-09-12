import Link from "next/link";
import {
  ArrowRight,
  Baby,
  CalendarDays,
  Check,
  Globe2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import { GyanChauparPreview } from "./GyanChauparPreview";

const lineage = [
  {
    name: "Vedic and Upanishadic traditions",
    detail: "Recitation, inquiry, ritual and philosophical reflection.",
  },
  {
    name: "Buddhist canons and living schools",
    detail: "Dhamma, contemplative practice and community transmission.",
  },
  {
    name: "Jain āgamic and philosophical lineages",
    detail: "Study, restraint, reflection and paths of liberation.",
  },
  {
    name: "Guru Granth Sahib Ji and Sikh tradition",
    detail: "Gurbani, simran, seva and the life of sangat.",
  },
] as const;

const festivalPrinciples = [
  "Local timezone and calculation place remain visible",
  "Tradition and sampradāya variants are not silently collapsed",
  "Unresolved or unaudited dates remain withheld",
  "Reminders follow the user's own preferences",
] as const;

const communityPromises = [
  {
    icon: MapPin,
    title: "Nearby",
    copy: "Discover places and communities with local context.",
  },
  {
    icon: Users,
    title: "Mandali",
    copy: "Belong through respectful conversation and shared practice.",
  },
  {
    icon: Sparkles,
    title: "Practice",
    copy: "Carry a personal rhythm wherever life moves.",
  },
  {
    icon: Globe2,
    title: "Diaspora",
    copy: "Keep tradition close across distance and timezone.",
  },
] as const;

const faqs = [
  {
    question: "What is Shoonaya?",
    answer:
      "Shoonaya is a native spiritual companion for daily practice, sacred time, scripture, family and community across Hindu, Sikh, Buddhist and Jain traditions.",
  },
  {
    question: "Is Shoonaya only for Hindus?",
    answer:
      "No. Each supported tradition receives its own vocabulary, sources, observance context and experience. They meet in one community without being treated as interchangeable.",
  },
  {
    question: "Does Shoonaya work outside India?",
    answer:
      "That is central to the product. Location and IANA timezone context are designed for people practising across the global diaspora.",
  },
  {
    question: "How does Shoonaya handle sacred sources?",
    answer:
      "Verbatim source text, licensed material, translations and Shoonaya-authored explanations are kept distinct. Unsupported content is withheld rather than invented.",
  },
  {
    question: "Is my spiritual data private?",
    answer:
      "Private practice data is intended to remain private by default, with explicit choices for anything shared with family or community.",
  },
  {
    question: "How can I try Shoonaya?",
    answer:
      "The public website is the doorway to the native product. Android beta access will be offered through the verified invitation link when it is ready.",
  },
] as const;

export function LegacyHomeSections() {
  return (
    <>
      <section className="border-y border-[var(--card-border)] bg-[var(--surface-raised)] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-7 text-center sm:grid-cols-3 sm:divide-x sm:divide-[var(--card-border)]">
          {[
            ["Global", "A companion shaped for the diaspora"],
            ["Four paths", "Hindu · Sikh · Buddhist · Jain"],
            ["Pramana", "Source-grounded wisdom"],
          ].map(([value, label]) => (
            <div key={value} className="px-4">
              <p className="font-display text-3xl font-semibold text-[var(--brand-primary-strong)]">
                {value}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted-warm)]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <GyanChauparPreview />

      <section className="px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              A long living story
            </p>
            <h2 className="mt-5 font-display text-5xl font-medium leading-none sm:text-6xl">
              Four traditions. One thoughtful home.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[var(--text-muted-warm)]">
              The previous homepage celebrated the depth behind Shoonaya. That
              story remains—without forcing different traditions into one
              timeline or making unsupported historical claims.
            </p>
          </div>
          <ol className="relative border-l border-[var(--card-border)] pl-8">
            {lineage.map((item) => (
              <li key={item.name} className="relative pb-9 last:pb-0">
                <span className="absolute -left-[2.45rem] top-1.5 size-4 rounded-full border-4 border-[var(--surface-base)] bg-[var(--brand-primary)]" />
                <h3 className="font-display text-2xl font-semibold">
                  {item.name}
                </h3>
                <p className="mt-2 leading-7 text-[var(--text-muted-warm)]">
                  {item.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="festivals"
        className="bg-[var(--surface-soft)] px-5 py-24 sm:px-8 lg:px-10 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.76fr_1.24fr]">
            <div>
              <CalendarDays
                className="size-9 text-[var(--brand-primary-strong)]"
                aria-hidden="true"
              />
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
                Sacred calendar
              </p>
              <h2 className="mt-5 font-display text-5xl font-medium leading-none sm:text-6xl">
                Upcoming across traditions, with context.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[var(--text-muted-warm)]">
                The festival preview remains part of the story. Live dates
                belong in the app, where location, profile, verification and
                uncertainty can travel with every occurrence.
              </p>
              <Link
                href="/features/sacred-calendar"
                className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
              >
                Explore the Sacred Calendar{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {festivalPrinciples.map((principle) => (
                <article
                  key={principle}
                  className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-7 shadow-[var(--shadow-soft)]"
                >
                  <Check
                    className="size-6 text-[var(--brand-primary-strong)]"
                    aria-hidden="true"
                  />
                  <p className="mt-7 font-display text-2xl font-semibold leading-tight">
                    {principle}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl rounded-[2.75rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-strong)] sm:p-12 lg:p-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
                Global Sangam · community
              </p>
              <h2 className="mt-5 font-display text-5xl font-medium leading-none sm:text-6xl">
                Dharma has no borders.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[var(--text-muted-warm)]">
                Local belonging, shared learning and family continuity should
                remain possible across cities, countries and timezones—without
                turning sacred community into another noisy feed.
              </p>
              <Link
                href="/community"
                className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
              >
                See the community vision{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="relative min-h-72 overflow-hidden rounded-[2rem] bg-[var(--surface-soft)] p-8">
              <Globe2
                className="absolute -bottom-16 -right-12 size-80 text-[var(--brand-primary-soft)]"
                aria-hidden="true"
              />
              <div className="relative grid gap-4 sm:grid-cols-2">
                {communityPromises.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-raised)] p-5"
                    >
                      <ItemIcon
                        className="size-5 text-[var(--brand-primary-strong)]"
                        aria-hidden="true"
                      />
                      <h3 className="mt-4 font-display text-xl font-semibold">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-muted-warm)]">
                        {item.copy}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-soft)] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="flex size-20 items-center justify-center rounded-[2rem] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
            <Baby className="size-9" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              Coming next
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium sm:text-5xl">
              Kids Zone remains on the horizon.
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted-warm)]">
              A parent-guided space for stories, songs, festivals and
              age-appropriate learning—released only when its content and
              safeguards are ready.
            </p>
          </div>
          <span className="rounded-full border border-[var(--card-border)] px-5 py-3 text-sm font-semibold text-[var(--text-muted-warm)]">
            Planned · not yet live
          </span>
        </div>
      </section>

      <section id="faq" className="px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
            Frequently asked questions
          </p>
          <h2 className="mt-5 text-center font-display text-5xl font-medium leading-none sm:text-6xl">
            Everything you want to know.
          </h2>
          <div className="mt-12 divide-y divide-[var(--card-border)] border-y border-[var(--card-border)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-2">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-3 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]">
                  {faq.question}
                  <span
                    className="text-2xl font-light text-[var(--brand-primary-strong)] transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pb-6 pr-10 leading-7 text-[var(--text-muted-warm)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
