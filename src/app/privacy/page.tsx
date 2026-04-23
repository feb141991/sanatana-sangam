import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'Privacy | Sanatana Sangam',
  description: 'Privacy expectations for Sanatana Sangam users.',
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy"
      title="Privacy should be clear, not hidden."
      intro="This page explains the product's current privacy posture in plain language. It should be reviewed and finalized with legal counsel before a full public launch."
      asideTitle="Pre-Launch Note"
      asideBody="This privacy page is a strong operational starting point, but production launch should still include a legally reviewed final version."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Information You Provide</h2>
        <p>
          Sanatana Sangam stores account information, profile details, dharmic identity selections,
          family group participation, community activity, and content you choose to post inside the app.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Location Data</h2>
        <p>
          The app may request device location to help place you in a nearby Mandali, show nearby sacred
          places, and personalize local experiences. You should only request precise location when the
          feature clearly needs it, and users should be able to decline.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Notifications</h2>
        <p>
          If you enable notifications, the app may store notification subscription identifiers and
          in-app notification history so reminders and alerts can be delivered to your account.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Family And Community Data</h2>
        <p>
          Family and lineage features can contain sensitive personal information. Before public launch,
          destructive permissions, privacy settings, and data export expectations should be tightened and
          clearly documented.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Your Choices</h2>
        <p>
          You should be able to update your profile, leave groups where appropriate, and request support
          for account or data concerns. The production support contact should be published on the contact page.
        </p>
      </section>
    </PublicPageShell>
  );
}
