import type { Metadata } from 'next';
import PublicPageShell from '@/components/public/PublicPageShell';
import { getPublicSourceDisclosures } from '@/lib/public-source-disclosures';

export const metadata: Metadata = {
  title: 'Content Sources | Shoonaya',
  description: 'Verified source and rights information for sacred texts published by Shoonaya.',
  alternates: { canonical: 'https://www.shoonaya.com/sources' },
};

export default function SourcesPage() {
  const disclosures = getPublicSourceDisclosures();
  return (
    <PublicPageShell
      eyebrow="Content provenance"
      title="Sources we can stand behind."
      intro="This page lists only content whose source and public-domain status are explicit in Shoonaya's governed catalog. Content still under rights review is withheld from this list rather than guessed."
      asideTitle="Fail-Closed Publishing"
      asideBody="A missing entry here is not a claim that a tradition lacks a source. It means the app's current metadata is not complete enough for a public rights statement."
    >
      {disclosures.map((item) => (
        <section key={item.sectionId} className="rounded-2xl border border-current/10 p-4">
          <h2 className="font-display text-xl font-semibold capitalize">{item.sectionId.replaceAll('_', ' ')}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#9a641e]">{item.rightsLabel}</p>
          <p className="mt-3">{item.scope}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {item.sources.map((source) => <li key={source}>{source}</li>)}
          </ul>
        </section>
      ))}
    </PublicPageShell>
  );
}

