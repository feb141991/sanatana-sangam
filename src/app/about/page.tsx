import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'About Shoonaya | Find your infinite.',
  description:
    'Shoonaya is a daily spiritual sanctuary for sacred time, practice, and connection. See what is unfolding in your local Panchang and make room for daily practice.',
  alternates: {
    canonical: 'https://www.shoonaya.com/about',
  },
};

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About Shoonaya"
      title="Find your infinite."
      intro="A daily spiritual sanctuary for sacred time, practice, and connection. When life is full, Shoonaya helps you notice what is unfolding in your local Panchang, understand sacred days, and make room for meaningful practice."
      asideTitle="Sacred time, lived daily"
      asideBody="Follow the rhythm of the day, return to a practice that fits your life, and stay connected to the wisdom, family, and community that matter to you."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">What We Believe</h2>
        <p>
          Sacred days can pass unnoticed in a full calendar. Shoonaya brings daily context and
          practical ways to engage closer together, so a date can become a moment for reflection,
          learning, or practice. Rooted in Sanatan Dharma, Shoonaya presents distinct Sikh, Jain,
          and Buddhist experiences in their own context where available.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">What The App Includes</h2>
        <p>
          Explore your local Panchang and upcoming observances such as Ekadashi and Amavasya. Make
          space for Japa and daily sadhana, read scripture, and explore Rashiphal and Kundali
          reflections. Live Darshan, sacred-place discovery, Kul family spaces, and Mandali community
          help connect personal practice with family and community life.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Who It Is For</h2>
        <p>
          Shoonaya is for people whose days are full but who still want to remember sacred time and
          keep a meaningful spiritual practice close. It is especially useful for families and
          diaspora communities seeking connection across distance and generations.
        </p>
      </section>
    </PublicPageShell>
  );
}
