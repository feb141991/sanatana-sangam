import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mantras, Stotrams & Sacred Chants with Meaning | Shoonaya',
  description: 'Browse Hindu mantras and stotrams, Sikh bani and simran, Buddhist chants and Jain prayers with original text, transliteration, meaning and audio where available.',
  alternates: {
    canonical: 'https://www.shoonaya.com/bhakti/browse',
  },
  openGraph: {
    title: 'Mantras, Stotrams & Sacred Chants with Meaning',
    description: 'A multi-tradition library of sacred chants, transliterations and meanings.',
    url: 'https://www.shoonaya.com/bhakti/browse',
    type: 'website',
  },
};

export default function BhaktiBrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
