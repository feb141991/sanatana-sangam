import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export const metadata: Metadata = {
  title: "Shoonaya Membership",
  description:
    "Learn how Shoonaya approaches free daily practice and future native-app membership without publishing unverified store pricing.",
  alternates: { canonical: "https://www.shoonaya.com/pricing" },
};

const membershipPrinciples = [
  "Core daily practice remains accessible",
  "Paid access will be managed through verified native-store billing",
  "Membership claims will follow features that are genuinely available",
  "Restore and subscription-management paths will be clear before release",
] as const;

export default function PricingPage() {
  return (
    <MarketingShell>
      <main>
        <MarketingPageHero
          eyebrow="Membership"
          title="A clear exchange, without pressure."
          intro="Shoonaya is being prepared as a native app. Final Android membership options and store pricing will be published only after billing, restoration and account entitlements are verified end to end."
        >
          <Link
            href="/beta/android"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 font-semibold text-[var(--surface-base)]"
          >
            Join the Android beta
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </MarketingPageHero>

        <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-primary-strong)]">
                Our commitment
              </p>
              <h2 className="mt-5 font-display text-5xl font-medium leading-none">
                Dharma is not a feature bundle.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[var(--text-muted-warm)]">
                Membership should support deeper personalisation, family tools
                and advanced capabilities without placing basic daily practice
                behind an artificial barrier.
              </p>
            </div>

            <div className="rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--shadow-soft)] sm:p-12">
              <ul className="space-y-6">
                {membershipPrinciples.map((principle) => (
                  <li key={principle} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    <span className="pt-1 text-lg leading-8 text-[var(--text-muted-warm)]">
                      {principle}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-10 border-t border-[var(--card-border)] pt-8 text-sm leading-7 text-[var(--text-dim)]">
                No payment is collected from this public website. Verified
                native pricing will replace this notice when the store release
                is ready.
              </p>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
