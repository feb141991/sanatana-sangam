import type { ReactNode } from "react";

type MarketingPageHeroProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  children?: ReactNode;
};

export function MarketingPageHero({
  eyebrow,
  title,
  intro,
  children,
}: MarketingPageHeroProps) {
  return (
    <section className="relative w-full overflow-hidden border-b border-[var(--card-border)] px-6 pb-20 pt-36 sm:px-10 lg:px-14 xl:px-20 lg:pb-28 lg:pt-44">
      {/* Devotional Ambient Light Halos (Slow Breathing & Drifting) */}
      <div
        className="pointer-events-none absolute -top-28 right-10 md:right-1/4 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(216,138,28,0.15)_0%,rgba(197,160,89,0.05)_50%,transparent_75%)] blur-3xl animate-aurora"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(192,96,122,0.09)_0%,transparent_70%)] blur-3xl animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(61,138,96,0.06)_0%,transparent_70%)] blur-2xl animate-float"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1440px]">
        {eyebrow ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)] shadow-sm">
            <span className="size-1.5 rounded-full bg-[var(--brand-primary-strong)] animate-pulse" />
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-5 max-w-5xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.035em] text-[var(--text-cream)] sm:text-6xl lg:text-8xl">
          {title}
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--text-muted-warm)] sm:text-xl sm:leading-9">
          {intro}
        </p>
        {children && <div className="mt-8 relative z-20">{children}</div>}
      </div>
    </section>
  );
}
