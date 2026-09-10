"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, CalendarDays, CircleDot, Users } from "lucide-react";
import { useEffect, useState } from "react";

const moments = [
  {
    label: "Sacred time",
    title: "Begin with today in context.",
    description: "Local sacred-time context shaped by profile and place.",
    icon: CalendarDays,
    detail: "Calendar",
  },
  {
    label: "Daily practice",
    title: "Return, one bead at a time.",
    description:
      "A focused mala space designed around presence and continuity.",
    icon: CircleDot,
    detail: "Japa",
  },
  {
    label: "Living wisdom",
    title: "Study with sources in view.",
    description: "Structured learning with script, meaning and provenance.",
    icon: BookOpen,
    detail: "Pathshala",
  },
  {
    label: "Belonging",
    title: "Find community without noise.",
    description: "Local discovery and respectful spaces for shared practice.",
    icon: Users,
    detail: "Mandali",
  },
] as const;

export function HeroFeatureCarousel() {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % moments.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, [isPaused, prefersReducedMotion]);

  const activeMoment = moments[activeIndex];
  const Icon = activeMoment.icon;

  return (
    <div
      className="relative mx-auto w-full max-w-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="absolute -inset-8 rounded-full bg-[var(--brand-primary-soft)] blur-3xl" />
      <div className="relative mx-auto min-h-[32rem] w-[min(23rem,86vw)] rounded-[3rem] border border-[var(--card-border)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-glow)]">
        <div className="flex h-full min-h-[30.5rem] flex-col overflow-hidden rounded-[2.35rem] border border-[var(--card-border-soft)] bg-[var(--card-bg)]">
          <div className="flex items-center justify-between px-6 py-5">
            <span className="font-display text-xl font-semibold">Shoonaya</span>
            <span className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary-strong)]">
              App preview
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeMoment.label}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.28 }}
              className="flex flex-1 flex-col px-6 pb-6"
            >
              <div className="mt-5 flex size-16 items-center justify-center rounded-3xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                <Icon className="size-7" aria-hidden="true" />
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary-strong)]">
                {activeMoment.label}
              </p>
              <h2 className="mt-3 font-display text-4xl font-medium leading-none">
                {activeMoment.title}
              </h2>
              <p className="mt-5 text-sm leading-7 text-[var(--text-muted-warm)]">
                {activeMoment.description}
              </p>
              <div className="mt-auto rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-5">
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  Explore
                </span>
                <p className="mt-2 font-display text-2xl">
                  {activeMoment.detail}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-center gap-2">
        {moments.map((moment, index) => (
          <button
            key={moment.label}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            aria-label={`Show ${moment.label}`}
            aria-pressed={activeIndex === index}
          >
            <span
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index
                  ? "w-7 bg-[var(--brand-primary)]"
                  : "w-2 bg-[var(--text-dim)]"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
