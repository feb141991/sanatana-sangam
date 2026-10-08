import type { Metadata } from "next";
import PublicPageShell from "@/components/public/PublicPageShell";

export const metadata: Metadata = {
  title: "What Is Shoonaya? | Find your infinite.",
  description:
    "Shoonaya is a daily spiritual sanctuary for sacred time, practice, and connection. Explore Panchang, observances, Japa, scripture, reflection, family, and community.",
  alternates: {
    canonical: "https://www.shoonaya.com/what-is-shoonaya",
  },
  openGraph: {
    title: "What Is Shoonaya? | Find your infinite.",
    description:
      "Shoonaya is a daily spiritual sanctuary for sacred time, practice, and connection. Explore Panchang, observances, Japa, scripture, reflection, family, and community.",
    url: "https://www.shoonaya.com/what-is-shoonaya",
  },
};

export default function WhatIsShoonayaPage() {
  return (
    <PublicPageShell
      eyebrow="About the App"
      title="What is Shoonaya?"
      intro="Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection. It helps people with full lives notice sacred days, understand their local context, and make room for practice."
      asideTitle="The Name"
      asideBody="Shoonaya draws inspiration from śūnya (शून्य), a Sanskrit word associated with zero and emptiness. ‘Find your infinite’ is an invitation to pause, return inward, and make space for what matters."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Who is it for?
        </h2>
        <p>
          Shoonaya is for people who want to stay connected to sacred time and spiritual practice while living full, modern lives. It can also help families and diaspora communities keep meaningful practices, learning, and connection close across distance.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          What does it include?
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Daily practice:</strong> make room for Japa, sadhana, and reflection at a pace that fits your day.
          </li>
          <li>
            <strong>Panchang and sacred time:</strong> see daily tithi, nakshatra, and selected timings with local context.
          </li>
          <li>
            <strong>Observances:</strong> notice sacred days such as Ekadashi and Amavasya, with guidance where available.
          </li>
          <li>
            <strong>Japa:</strong> use a mala counter to support a focused mantra practice.
          </li>
          <li>
            <strong>Scripture and Pathshala:</strong> explore texts and guided learning, including the Bhagavad Gita, Upanishads, Gurbani, Dhammapada, and Jain texts.
          </li>
          <li>
            <strong>Rashiphal and Kundali:</strong> explore chart views and reflective astrology features.
          </li>
          <li>
            <strong>Live Darshan and sacred places:</strong> explore available streams and discover sacred places.
          </li>
          <li>
            <strong>Kul and Mandali:</strong> connect with family and community, and preserve family stories and lineage details.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Why not just use social media or video apps?
        </h2>
        <p>
          Sacred dates, daily practice, learning, and community often live in separate places. Shoonaya brings these experiences together in one space, so you can notice what is unfolding and choose how you want to engage. It is a companion for practice and discovery, not a substitute for personal guidance or tradition-specific teachers.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Which traditions does it support?
        </h2>
        <p>
          Shoonaya is rooted in <strong>Sanatan (Hindu)</strong> traditions and includes distinct content and experiences for <strong>Sikh</strong>, <strong>Jain</strong>, and <strong>Buddhist</strong> paths. These traditions have their own teachings and practices; available content and tools vary by feature.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Is it free?
        </h2>
        <p>
          All features currently available in Shoonaya are free to use. There are no paid plans or subscriptions at this time.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-[color:var(--text-cream)] mb-2">
          Is it live?
        </h2>
        <p>
          Shoonaya is available on the web at shoonaya.com. You can explore its current features and begin a daily practice there.
        </p>
      </section>
    </PublicPageShell>
  );
}
