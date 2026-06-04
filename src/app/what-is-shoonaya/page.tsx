import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'What is Shoonaya? | Spiritual App for Daily Dharma',
  description: 'Shoonaya is a spiritual companion app built for seekers of Sanatan, Sikh, Jain and Buddhist wisdom. Daily Dharma, Panchang, japa, scripture, and sacred community — all in one place.',
  openGraph: {
    title: 'What is Shoonaya? | Spiritual App for Daily Dharma',
    description: 'Shoonaya is a spiritual companion app built for seekers of Sanatan, Sikh, Jain and Buddhist wisdom. Daily Dharma, Panchang, japa, scripture, and sacred community — all in one place.',
    url: 'https://www.shoonaya.com/what-is-shoonaya',
  },
};

export default function WhatIsShoonayaPage() {
  return (
    <PublicPageShell
      eyebrow="About the App"
      title="What is Shoonaya?"
      intro="Shoonaya is a spiritual companion app built for seekers of Sanatan, Sikh, Jain and Buddhist wisdom — bringing Daily Dharma, Panchang, scripture, japa, festivals and sacred community into one living space."
      asideTitle="The Name"
      asideBody="Shoonaya comes from Shoonya — the Sanskrit word for zero, emptiness, and infinite potential. It is the place beyond labels where all paths meet. Our community calls themselves Zeroists: seekers who return to the source."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Who is it for?</h2>
        <p>
          Shoonaya is for anyone living a dharmic life — whether you were born into the tradition or found your way to it. It is especially built for the global diaspora: people who live far from temples, gurduwaras, and viharas but want to stay rooted in daily practice, scripture, and community.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">What does it include?</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Daily Dharma</strong> — a personalised morning practice with scripture, reflection, and japa</li>
          <li><strong>Panchang</strong> — the sacred Hindu calendar with tithi, nakshatra, yoga, and auspicious timings</li>
          <li><strong>Japa counter</strong> — a mala-based mantra counter with streak tracking</li>
          <li><strong>Scripture library</strong> — Gita, Upanishads, Guru Granth Sahib, Dhammapada, and more</li>
          <li><strong>Tirtha Map</strong> — find Hindu mandirs, Sikh gurduwaras, Buddhist viharas, and Jain temples near you anywhere in the world</li>
          <li><strong>Festivals &amp; vrat calendar</strong> — tradition-aware sacred dates with preparation guides</li>
          <li><strong>Kul family spaces</strong> — preserve your family lineage, stories, and heritage</li>
          <li><strong>Pathshala</strong> — structured dharmic learning paths for all levels</li>
          <li><strong>Mandali</strong> — find and connect with your local dharmic community</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Why not just use YouTube or WhatsApp groups?</h2>
        <p>
          Most people use a mix of YouTube for bhajans, WhatsApp for community, Google for panchang, and apps for meditation. Shoonaya brings all of that together — personalised to your tradition, your rashi, your language, and your timezone. No ads interrupting kirtan. No algorithm pulling you away from sadhana.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Which traditions does it support?</h2>
        <p>
          Shoonaya is built for four dharmic paths: <strong>Sanatan (Hindu)</strong>, <strong>Sikh</strong>, <strong>Jain</strong>, and <strong>Buddhist</strong>. The app adapts its content, calendar, scripture, and community features based on your tradition. You can follow multiple paths or switch at any time.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">Is it free?</h2>
        <p>
          Core features including Daily Dharma, Panchang, japa, scripture, and the Tirtha Map are free. Premium features for deeper community, family spaces, and advanced learning are available through Shoonaya Premium. The tradition should never be behind a paywall.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">When is it launching?</h2>
        <p>
          Shoonaya is launching on <strong>17 June 2026</strong>. The founding community — called <strong>Sthapakas</strong> — are joining now. The first 100 Sthapakas will have their founding number permanently on their profile and the opportunity to name a feature in the app.
        </p>
      </section>
    </PublicPageShell>
  );
}
