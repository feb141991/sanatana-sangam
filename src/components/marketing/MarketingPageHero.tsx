import type { ReactNode } from "react";

type MarketingPageHeroProps = {
  eyebrow: string;
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
    <section className="border-b border-[var(--card-border)] px-5 pb-20 pt-36 sm:px-8 lg:px-10 lg:pb-28 lg:pt-44">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand-primary-strong)]">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.035em] text-[var(--text-cream)] sm:text-6xl lg:text-8xl">
          {title}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--text-muted-warm)] sm:text-xl">
          {intro}
        </p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
