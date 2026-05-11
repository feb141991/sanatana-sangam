import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'Community Guidelines | Shoonaya',
  description: 'Community expectations for conversations and conduct on Shoonaya.',
};

export default function GuidelinesPage() {
  return (
    <PublicPageShell
      eyebrow="Guidelines"
      title="Community should feel safe, thoughtful, and welcoming."
      intro="Shoonaya is meant to support sincere discussion, family continuity, and spiritual belonging. These guidelines define the kind of community we want to build."
      asideTitle="Moderation Standard"
      asideBody="Healthy communities are shaped by product design and moderation together. These guidelines should be reflected in user reporting and admin workflows."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Lead With Respect</h2>
        <p>
          Speak to others with dignity, even in disagreement. Critique ideas without attacking people or
          communities.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">No Harassment Or Hate</h2>
        <p>
          Harassment, bullying, hate speech, demeaning comparisons between traditions, and targeted abuse
          should not be allowed.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Protect Family And Private Data</h2>
        <p>
          Do not upload or expose private family information, especially about living relatives, without
          care and consent.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Avoid Dangerous Misinformation</h2>
        <p>
          Do not present unverified medical, legal, financial, or safety advice as authoritative truth.
          Spiritual guidance should not replace professional help where it is needed.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Honor The Purpose Of The Space</h2>
        <p>
          The platform is for community, spiritual learning, family continuity, and local belonging. Spam,
          manipulation, and bad-faith disruption should be moderated quickly.
        </p>
      </section>
    </PublicPageShell>
  );
}
