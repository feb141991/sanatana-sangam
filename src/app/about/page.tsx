import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'About | Sanatana Sangam',
  description: 'Learn what Sanatana Sangam is building for the global dharmic community.',
};

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About"
      title="A digital home for dharmic life."
      intro="Sanatana Sangam is being built to help people stay connected to community, family, sacred practice, and local belonging in modern life, especially across the diaspora."
      asideTitle="Product Intent"
      asideBody="The app is designed around three living needs: finding your local Mandali, preserving your family's continuity, and staying anchored in a daily rhythm of dharma."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">What We Believe</h2>
        <p>
          Spiritual identity is strongest when it is lived, shared, and carried forward. That is why
          Sanatana Sangam focuses on people, family, and practice rather than only passive content.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">What The App Includes</h2>
        <p>
          Today the product includes local community discovery, family groups, lineage tracking,
          scripture browsing, discussions, sacred place discovery, and tradition-aware daily spiritual
          touchpoints.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-gray-900 mb-2">Who It Is For</h2>
        <p>
          The current launch direction is especially focused on diaspora users who want to reconnect
          with dharmic life through nearby people, family continuity, and small daily habits that can
          realistically fit modern schedules.
        </p>
      </section>
    </PublicPageShell>
  );
}
