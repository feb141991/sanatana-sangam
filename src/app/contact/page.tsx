import type { Metadata } from "next";
import PublicPageShell from "@/components/public/PublicPageShell";
import { OFFICIAL_EMAILS, OFFICIAL_ENTITY_NAME } from "@/config/official-links";

export const metadata: Metadata = {
  title: "Contact Shoonaya | Support, Privacy, Suggestions & Partnerships",
  description:
    "Contact Shoonaya (operated by The RDS Ventures) for seeker support, privacy requests, suggestions, partnerships, and general inquiries.",
  alternates: {
    canonical: "https://www.shoonaya.com/contact",
  },
};

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Support should be easy to find."
      intro={`Shoonaya is operated by ${OFFICIAL_ENTITY_NAME}. Reach the right desk directly using our official addresses below.`}
      asideTitle="Official Channels"
      asideBody={`All Shoonaya support, privacy, suggestions, partnerships, and general inquiries are handled by ${OFFICIAL_ENTITY_NAME} through our official @shoonaya.com addresses.`}
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Account &amp; App Support
        </h2>
        <p>
          Reach our support team at{" "}
          <a
            className="font-semibold text-[var(--brand-primary-strong)] hover:underline"
            href={`mailto:${OFFICIAL_EMAILS.support}`}
          >
            {OFFICIAL_EMAILS.support}
          </a>{" "}
          for account help, app issues, safety concerns, or moderation reports.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Privacy, Data Rights &amp; Grievances
        </h2>
        <p>
          For data deletion requests, DPDP/GDPR rights, or grievance redressal with {OFFICIAL_ENTITY_NAME}, write to{" "}
          <a
            className="font-semibold text-[var(--brand-primary-strong)] hover:underline"
            href={`mailto:${OFFICIAL_EMAILS.privacy}`}
          >
            {OFFICIAL_EMAILS.privacy}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Suggestions &amp; Feedback
        </h2>
        <p>
          Have an idea for a new feature, calendar improvement, story, or practice tool? Share it at{" "}
          <a
            className="font-semibold text-[var(--brand-primary-strong)] hover:underline"
            href={`mailto:${OFFICIAL_EMAILS.suggestions}`}
          >
            {OFFICIAL_EMAILS.suggestions}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Partnerships, Temples &amp; Educators
        </h2>
        <p>
          Temple organizers, satsang leaders, schools, and community builders can reach our partnerships team at{" "}
          <a
            className="font-semibold text-[var(--brand-primary-strong)] hover:underline"
            href={`mailto:${OFFICIAL_EMAILS.partners}`}
          >
            {OFFICIAL_EMAILS.partners}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Community Hello &amp; General Inquiries
        </h2>
        <p>
          Say hello to the sanctuary community team at{" "}
          <a
            className="font-semibold text-[var(--brand-primary-strong)] hover:underline"
            href={`mailto:${OFFICIAL_EMAILS.namaste}`}
          >
            {OFFICIAL_EMAILS.namaste}
          </a>
          , or reach {OFFICIAL_ENTITY_NAME} for general, official, and press inquiries at{" "}
          <a
            className="font-semibold text-[var(--brand-primary-strong)] hover:underline"
            href={`mailto:${OFFICIAL_EMAILS.info}`}
          >
            {OFFICIAL_EMAILS.info}
          </a>
          .
        </p>
      </section>
    </PublicPageShell>
  );
}
