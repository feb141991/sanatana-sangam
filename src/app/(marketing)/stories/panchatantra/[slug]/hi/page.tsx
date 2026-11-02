import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PANCHATANTRA_HUB_PATH,
  SITE_ORIGIN,
  findPublicPanchatantraStory,
  listPublicPanchatantraStories,
  panchatantraCoverImage,
  panchatantraStoryUrl,
} from "@/lib/panchatantra-public";
import { PanchatantraStoryView } from "../../PanchatantraStoryView";

type StoryPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return listPublicPanchatantraStories().map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = findPublicPanchatantraStory(slug);
  if (!story) return {};

  const url = panchatantraStoryUrl(slug, "hi");
  const enUrl = panchatantraStoryUrl(slug, "en");
  const title = `${story.titleHi}: पंचतंत्र की कहानी | Shoonaya`;
  const description = `${story.titleHi}, पंचतंत्र की एक कथा। ${story.moralHi}`;
  const cover = panchatantraCoverImage(story, "hi");

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: enUrl, hi: url, "x-default": enUrl },
    },
    openGraph: { title, description, url, type: "article", locale: "hi_IN", ...(cover ? { images: [cover] } : {}) },
  };
}

export default async function PanchatantraHindiStoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = findPublicPanchatantraStory(slug);
  if (!story) notFound();

  const url = panchatantraStoryUrl(slug, "hi");
  const cover = panchatantraCoverImage(story, "hi");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: story.titleHi,
      description: story.moralHi,
      inLanguage: "hi",
      genre: "Fable",
      url,
      mainEntityOfPage: url,
      ...(cover ? { image: cover.url } : {}),
      isBasedOn: { "@type": "Book", name: "The Panchatantra" },
      publisher: { "@type": "Organization", name: "Shoonaya", url: SITE_ORIGIN },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Panchatantra stories", item: `${SITE_ORIGIN}${PANCHATANTRA_HUB_PATH}` },
        { "@type": "ListItem", position: 2, name: story.titleHi, item: url },
      ],
    },
  ];

  const others = listPublicPanchatantraStories().filter((other) => other.id !== story.id);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PanchatantraStoryView story={story} lang="hi" others={others} />
    </>
  );
}
