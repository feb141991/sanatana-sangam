import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Perform Aarti: Steps, Meaning & Practice | Shoonaya',
  description: 'Follow a guided Aarti practice with the bell, diya, dhoop, flowers, naivedya and closing prayer, with clear steps and devotional context.',
  alternates: {
    canonical: 'https://www.shoonaya.com/bhakti/aarti',
  },
  openGraph: {
    title: 'How to Perform Aarti: Steps & Meaning',
    description: 'A guided Aarti practice with clear devotional steps.',
    url: 'https://www.shoonaya.com/bhakti/aarti',
    type: 'website',
  },
};

export default function AartiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
