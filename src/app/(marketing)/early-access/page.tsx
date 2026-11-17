import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Compass, Shield, Smartphone, Sparkles } from "lucide-react";

import { AppStoreBadges } from "@/components/marketing/AppStoreBadges";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { OFFICIAL_STORE_LINKS } from "@/config/official-links";

export const metadata: Metadata = {
  title: "Download Shoonaya | Android App Live on Google Play",
  description:
    "Download Shoonaya free on Google Play for Android. Daily local Panchang, sacred observances, Japa mala, Pathshala, and family Kul spaces. iOS app coming soon.",
  alternates: { canonical: "https://www.shoonaya.com/early-access" },
  robots: { index: true, follow: true },
};

const APP_STEPS = [
  {
    step: "01",
    title: "Download Free on Google Play",
    desc: "Install Shoonaya directly from the official Google Play Store on your Android device — no waitlist or invitation required.",
    icon: Smartphone,
  },
  {
    step: "02",
    title: "Choose Your Tradition & City",
    desc: "Select Sanatan, Sikh, Jain, or Buddhist context and set your location for astronomy-backed local Panchang timings.",
    icon: Compass,
  },
  {
    step: "03",
    title: "iOS Coming Soon",
    desc: "Our iPhone and iPad release is on the way to the Apple App Store. In the meantime, you can also explore Shoonaya directly in your browser.",
    icon: Shield,
  },
];

export default function DownloadAppPage() {
  return (
    <main className="w-full overflow-x-clip">
      <MarketingPageHero
        eyebrow="Now Live on Google Play"
        title="Download Shoonaya on Android."
        intro="Shoonaya is now publicly available on Google Play for Android. Follow your local Panchang, sacred observances, Japa mala, and Pathshala study in one calm sanctuary. iOS is coming soon."
      >
        <AppStoreBadges />
      </MarketingPageHero>

      <section className="w-full px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* Left Column: Direct Download Card */}
          <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(216,138,28,0.25)] bg-[rgba(216,138,28,0.12)] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand-primary-strong)]">
              <span className="size-1.5 rounded-full bg-[#4ade80]" />
              Android Live · iOS Coming Soon
            </div>

            <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-[var(--text-cream)] sm:text-3xl">
              Get the Shoonaya App Today
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
              Download Shoonaya directly from Google Play on Android. No ads, no third-party tracking, and free to begin your daily practice.
            </p>

            <div className="mt-7">
              <AppStoreBadges />
            </div>

            <div className="mt-8 border-t border-[var(--card-border)] pt-6 flex flex-wrap items-center gap-4">
              <a
                href={OFFICIAL_STORE_LINKS.googlePlay}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--brand-primary-strong)] hover:underline"
              >
                Open Google Play Store
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <Link
                href="/features"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--text-muted-warm)] hover:text-[var(--text-cream)] transition-colors"
              >
                Explore all features
              </Link>
            </div>
          </div>

          {/* Right Column: Getting Started & Commitments */}
          <div className="space-y-8">
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-8 sm:p-10 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
                Getting Started
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--text-cream)] sm:text-3xl">
                Start in Under a Minute
              </h2>

              <div className="mt-8 space-y-6">
                {APP_STEPS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-[var(--text-cream)] sm:text-lg">
                          {s.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted-warm)] sm:text-sm">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                <Sparkles className="size-4" />
                Our Sanctuary Commitments
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  "No advertising trackers or third-party behavioral profiling.",
                  "Astronomy-backed local Panchang & verified observance timings.",
                  "Tradition-specific customization honoring Hindu, Sikh, Jain, and Buddhist paths.",
                  "Free on Android today, with iOS coming soon to the App Store.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-xs text-[var(--text-cream)] sm:text-sm">
                    <CheckCircle className="size-4 shrink-0 text-[var(--brand-primary-strong)] mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
