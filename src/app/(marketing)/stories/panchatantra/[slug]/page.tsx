import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PANCHATANTRA_HUB_PATH,
  SITE_ORIGIN,
  findPublicPanchatantraStory,
  listPublicPanchatantraStories,
  panchatantraStoryUrl,
} from "@/lib/panchatantra-public";
import { PanchatantraStoryView } from "../PanchatantraStoryView";

type StoryPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return listPublicPanchatantraStories().map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = findPublicPanchatantraStory(slug);
  if (!story) return {};

  const url = panchatantraStoryUrl(slug, "en");
  const title = `${story.title}: Panchatantra Story | Shoonaya`;
  const description = `${story.title}, a Panchatantra fable retold by Shoonaya. ${story.moral}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: url, hi: panchatantraStoryUrl(slug, "hi"), "x-default": url },
    },
    openGraph: { title, description, url, type: "article", locale: "en_US" },
  };
}

export default async function PanchatantraStoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = findPublicPanchatantraStory(slug);
  if (!story) notFound();

  const url = panchatantraStoryUrl(slug, "en");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: story.title,
      description: story.moral,
      inLanguage: "en",
      genre: "Fable",
      url,
      mainEntityOfPage: url,
      isBasedOn: { "@type": "Book", name: "The Panchatantra" },
      publisher: { "@type": "Organization", name: "Shoonaya", url: SITE_ORIGIN },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Panchatantra stories", item: `${SITE_ORIGIN}${PANCHATANTRA_HUB_PATH}` },
        { "@type": "ListItem", position: 2, name: story.title, item: url },
      ],
    },
  ];

  const others = listPublicPanchatantraStories().filter((other) => other.id !== story.id);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PanchatantraStoryView story={story} lang="en" others={others} />
    </>
  );
}
