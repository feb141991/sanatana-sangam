import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  asideTitle?: string;
  asideBody?: string;
};

export default function PublicPageShell({
  eyebrow,
  title,
  intro,
  children,
  asideTitle = "Platform trust",
  asideBody = "Shoonaya keeps privacy, safety, source integrity and honest product status visible across the public website and native app.",
}: PublicPageShellProps) {
  return (
    <MarketingShell>
      <main className="px-5 pb-20 pt-36 sm:px-8 lg:px-10 lg:pb-28 lg:pt-44">
        <div className="mx-auto max-w-7xl">
          <header className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--brand-primary-strong)]">
              {eyebrow}
            </p>
            <h1 className="mt-5 font-display text-5xl font-medium leading-none tracking-[-0.035em] text-[var(--text-cream)] sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--text-muted-warm)]">
              {intro}
            </p>
          </header>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="min-w-0 space-y-8 rounded-[2.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-7 text-base leading-8 text-[var(--text-muted-warm)] shadow-[var(--shadow-soft)] sm:p-10">
              {children}
            </article>

            <aside className="min-w-0 space-y-5">
              <section className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)]">
                  Why this matters
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--text-cream)]">
                  {asideTitle}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--text-muted-warm)]">
                  {asideBody}
                </p>
              </section>

              <section className="rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary-strong)]">
                  Continue
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/beta/android"
                    className="flex min-h-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--surface-base)]"
                  >
                    Join the Android beta
                  </Link>
                  <Link
                    href="/contact"
                    className="flex min-h-12 items-center justify-center rounded-2xl border border-[var(--card-border)] px-4 text-sm font-semibold text-[var(--text-cream)]"
                  >
                    Contact Shoonaya
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
