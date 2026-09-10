import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Smartphone } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";

export const metadata: Metadata = {
  title: "Join the Shoonaya Android Beta",
  description:
    "Join the Shoonaya Android beta and help test the native dharmic companion on a real device.",
  alternates: { canonical: "https://www.shoonaya.com/beta/android" },
  robots: { index: true, follow: true },
};

const betaExpectations = [
  "Install and test Shoonaya on a real Android device",
  "Use evolving native features before the public release",
  "Share practical feedback about clarity, reliability and accessibility",
  "Expect some features and visual details to change during testing",
] as const;

function getBetaUrl() {
  const value = process.env.NEXT_PUBLIC_ANDROID_BETA_URL?.trim();
  return value && value.startsWith("https://") ? value : null;
}

export default function AndroidBetaPage() {
  const betaUrl = getBetaUrl();

  return (
    <main>
      <MarketingPageHero
        eyebrow="Native Android beta"
        title="Help shape Shoonaya on Android."
        intro="Test the native app in real daily use and help us strengthen the experience before the wider public release."
      >
        {betaUrl ? (
          <a
            href={betaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 font-semibold text-[var(--surface-base)]"
          >
            Open the Android beta
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : (
          <span className="inline-flex min-h-12 items-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-6 text-sm font-semibold text-[var(--text-muted-warm)]">
            Beta invitation link being prepared
          </span>
        )}
      </MarketingPageHero>

      <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="flex min-h-80 items-center justify-center rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)]">
            <div className="flex size-32 items-center justify-center rounded-[2.25rem] bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] shadow-[var(--shadow-soft)]">
              <Smartphone className="size-14" aria-hidden="true" />
            </div>
          </div>
          <div className="rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary-strong)]">
              What beta participation means
            </p>
            <ul className="mt-8 space-y-6">
              {betaExpectations.map((expectation) => (
                <li key={expectation} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1 text-lg leading-8 text-[var(--text-muted-warm)]">
                    {expectation}
                  </span>
                </li>
              ))}
            </ul>

            {!betaUrl && (
              <div className="mt-10 border-t border-[var(--card-border)] pt-8">
                <p className="text-sm leading-7 text-[var(--text-muted-warm)]">
                  The verified Google Play testing destination has not been
                  configured yet. Once it is available, this page will expose
                  the real invitation rather than a placeholder store link.
                </p>
                <Link
                  href="/contact"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--brand-primary-strong)]"
                >
                  Contact Shoonaya
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
