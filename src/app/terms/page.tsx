import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'Terms | Sanatana Sangam',
  description: 'Terms of use for Sanatana Sangam.',
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms"
      title="Shared space needs shared rules."
      intro="These terms describe the baseline expectations for using Sanatana Sangam. They should be reviewed and finalized before a full commercial or public-scale launch."
      asideTitle="Launch Readiness"
      asideBody="Terms are part of product trust. Users should understand what the service offers, what content standards apply, and how access may change over time."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Using The Service</h2>
        <p>
          By creating an account or using the app, you agree to use Sanatana Sangam respectfully and in
          ways that do not harm other users, communities, or the integrity of the service.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Your Content</h2>
        <p>
          You remain responsible for the content you post, including posts, replies, messages, profile
          details, and family records you add to the platform.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Acceptable Use</h2>
        <p>
          Do not post abusive, harassing, hateful, misleading, or intentionally harmful material. Do not
          impersonate others, misuse admin tools, or attempt unauthorized access to any part of the platform.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Moderation</h2>
        <p>
          Sanatana Sangam may review, restrict, or remove content and accounts that violate platform
          guidelines, safety standards, or applicable law.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Service Changes</h2>
        <p>
          Features may change as the product evolves. During early launch stages, parts of the product may
          still be refined, removed, or expanded based on reliability, safety, and user feedback.
        </p>
      </section>
    </PublicPageShell>
  );
}
