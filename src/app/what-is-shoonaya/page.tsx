import type { Metadata } from "next";
import PublicPageShell from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "What is Shoonaya? | Spiritual Companion for Daily Dharma",
  description:
    "What is Shoonaya? A dharmic companion app for daily practice, sacred calendar, scripture, family, and community across Hindu, Sikh, Jain, and Buddhist traditions.",
  alternates: {
    canonical: "https://www.shoonaya.com/what-is-shoonaya",
  },
  openGraph: {
    title: "What is Shoonaya? | Spiritual Companion for Daily Dharma",
    description:
      "What is Shoonaya? A dharmic companion app for daily practice, sacred calendar, scripture, family, and community across Hindu, Sikh, Jain, and Buddhist traditions.",
    url: "https://www.shoonaya.com/what-is-shoonaya",
  },
};

export default function WhatIsShoonayaPage() {
  return (
    <PublicPageShell
      eyebrow="About the App"
      title="What is Shoonaya?"
      intro="Shoonaya is a modern dharmic companion for daily practice, sacred time, scripture, family, and community across Hindu, Sikh, Jain, and Buddhist traditions."
      asideTitle="The Name"
      asideBody="The name Shoonaya is inspired by the Sanskrit term śūnya (शून्य), associated with zero and emptiness. Shoonaya is the name of this dharmic companion for daily practice, sacred time, scripture, family, and community."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Who is it for?
        </h2>
        <p>
          Shoonaya is for anyone living a dharmic life, whether you grew up in the tradition or came to it later in life. It is especially meaningful for the global diaspora: families and individuals who live far from temples, gurduwaras, and viharas, but want to stay grounded in daily practice, sacred texts, and community.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          What does it include?
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Daily Dharma:</strong> a thoughtful morning practice with scripture, contemplation, and japa.
          </li>
          <li>
            <strong>Panchang:</strong> astronomical calculations with tithi, nakshatra, yoga, and auspicious timings.
          </li>
          <li>
            <strong>Japa Counter:</strong> a tactile mala counter with streak tracking and gentle feedback.
          </li>
          <li>
            <strong>Scripture Library:</strong> the Bhagavad Gita, Upanishads, Guru Granth Sahib, Dhammapada, and Jain Agamas.
          </li>
          <li>
            <strong>Tirtha Map:</strong> find Hindu mandirs, Sikh gurduwaras, Buddhist viharas, and Jain deris near you worldwide.
          </li>
          <li>
            <strong>Festivals and Vrats:</strong> authentic sacred calendar dates with preparation guidance.
          </li>
          <li>
            <strong>Kul Family Spaces:</strong> preserve your family gotra, ancestral stories, and generational sanskaras.
          </li>
          <li>
            <strong>Pathshala:</strong> verse-by-verse learning with original scripts and transliterations.
          </li>
          <li>
            <strong>Mandali:</strong> find and connect with your local spiritual community.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Why not just use social media or video apps?
        </h2>
        <p>
          Most seekers use an ad-hoc mix of video streams for bhajans, chat groups for announcements, search engines for panchang, and generic apps for meditation. Shoonaya brings all of that together, shaped for your tradition, your language, and your local sunrise. No commercials interrupting kirtan, and no algorithmic feeds pulling you away from prayer.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Which traditions does it support?
        </h2>
        <p>
          Shoonaya supports four living traditions: <strong>Sanatan (Hindu)</strong>, <strong>Sikh</strong>, <strong>Jain</strong>, and <strong>Buddhist</strong>. The platform adapts its vocabulary, calendar calculations, scripture, and community features based on your path. You can follow multiple traditions or switch whenever you wish.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Is it free?
        </h2>
        <p>
          Foundational tools including Daily Dharma, Panchang, Japa, Scripture, and the Tirtha Map are completely free. Sacred wisdom should never be locked behind a mandatory paywall. Optional subscriptions exist solely to support independent scholarship and server maintenance.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Is it live?
        </h2>
        <p>
          Shoonaya is live today on the web at shoonaya.com. You are welcome to begin your daily practice and explore the scriptures right now.
        </p>
      </section>
    </PublicPageShell>
  );
}
