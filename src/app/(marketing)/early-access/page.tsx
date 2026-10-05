import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Smartphone, Sparkles, Mail } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { EarlyAccessForm } from "@/components/marketing/EarlyAccessForm";

export const metadata: Metadata = {
  title: "Request Early Access | Shoonaya Private Testing",
  description:
    "Register for private testing access to Shoonaya. We provision applicant accounts in the background and deliver your personal installation link directly to your inbox.",
  alternates: { canonical: "https://www.shoonaya.com/early-access" },
  robots: { index: true, follow: true },
};

const TESTING_STEPS = [
  {
    step: "01",
    title: "Register Your Device & Preferences",
    desc: "Submit your email and preferred device (Android or iOS). Your request is timestamped and placed in our testing queue.",
    icon: Mail,
  },
  {
    step: "02",
    title: "Background Whitelisting & Provisioning",
    desc: "Our engineering team periodically provisions applicant batches in our testing database, preparing your personalized access token.",
    icon: Shield,
  },
  {
    step: "03",
    title: "Direct Access Link to Your Inbox",
    desc: "You receive a personal invitation email containing your direct download link (Play Store testing link / APK) and quick onboarding instructions.",
    icon: Smartphone,
  },
];

export default function EarlyAccessPage() {
  return (
    <main className="w-full overflow-hidden">
      <MarketingPageHero
        eyebrow="Stage: Private Testing"
        title="Experience Shoonaya before general release."
        intro="We are currently conducting private testing across select devices before public launch. Register your email below. Our team whitelists applicant accounts in the background and emails you a direct invitation link."
      />

      <section className="w-full px-6 py-16 sm:px-10 lg:px-14 xl:px-20 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Left Column: Interactive Form */}
          <EarlyAccessForm defaultSource="early-access-landing" />

          {/* Right Column: How Testing Works & Expectations */}
          <div className="space-y-8">
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-8 sm:p-10 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary-strong)]">
                The Onboarding Process
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--text-cream)] sm:text-3xl">
                How Private Testing Works
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted-warm)] sm:text-base">
                To guarantee reliability and traditional reverence, we roll out test builds deliberately rather than opening unchecked public downloads.
              </p>

              <div className="mt-8 space-y-6">
                {TESTING_STEPS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] font-mono text-sm font-bold">
                        {s.step}
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

            {/* Core Commitments Card */}
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-strong)]">
                <Sparkles className="size-4" />
                Testing Commitments
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  "No advertising trackers or third-party behavioral profiling.",
                  "Direct feedback channel with Shoonaya's founding team.",
                  "Tradition-specific customisation verified by scholarship.",
                  "Guaranteed Founding Member badge upon general release.",
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
