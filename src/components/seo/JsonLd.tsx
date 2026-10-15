import { OFFICIAL_SOCIAL_LINKS } from "@/config/official-links";
import React from 'react';
import type { GeoModel } from '@/lib/seo/geo-model';

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
  return <JsonLd data={schema} />;
}

export function GeoArticleJsonLd({ geo, url }: { geo: GeoModel; url: string }) {
  const graph: any[] = [];

  // WebPage base
  graph.push({
    "@type": "WebPage",
    "url": url,
    "name": geo.title,
    "description": geo.summary,
  });

  // Article representation
  const articleSchema: any = {
    "@type": "Article",
    "headline": geo.title,
    "description": geo.summary,
    "url": url,
  };

  if (geo.provenance) {
    articleSchema.isBasedOn = {
      "@type": "CreativeWork",
      "name": geo.provenance
    };
  }

  articleSchema.publisher = {
    "@type": "Organization",
    "name": "Shoonaya",
    "url": "https://www.shoonaya.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.shoonaya.com/icons/icon-512x512.png"
    },
    "sameAs": [
      OFFICIAL_SOCIAL_LINKS.linkedin,
      OFFICIAL_SOCIAL_LINKS.instagram,
      OFFICIAL_SOCIAL_LINKS.facebook,
    ],
  };

  if (geo.reviewedBy) {
    articleSchema.reviewedBy = {
      "@type": "Person",
      "name": geo.reviewedBy
    };
  }

  if (geo.datePublished) {
    articleSchema.datePublished = geo.datePublished;
  }

  if (geo.dateModified) {
    articleSchema.dateModified = geo.dateModified;
  }

  graph.push(articleSchema);

  // FAQPage representation for Q&A
  if (geo.qa && geo.qa.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "mainEntity": geo.qa.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    });
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": graph
  };

  return <JsonLd data={schema} />;
}

export function PanchangPageJsonLd({
  url,
  name,
  description,
}: {
  url: string;
  name: string;
  description: string;
}) {
  const panchangSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": name,
    "description": description,
    "url": url,
    "publisher": {
      "@type": "Organization",
      "@id": "https://www.shoonaya.com/#organization",
      "name": "Shoonaya",
      "url": "https://www.shoonaya.com",
    },
    "about": { "@type": "Thing", "name": "Hindu Panchang" },
  };

  return <JsonLd data={panchangSchema} />;
}

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.shoonaya.com/#organization",
        "name": "Shoonaya",
        "url": "https://www.shoonaya.com",
        "logo": "https://www.shoonaya.com/icons/icon-512x512.png",
        "description": "Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection.",
        "sameAs": [
          OFFICIAL_SOCIAL_LINKS.linkedin,
          OFFICIAL_SOCIAL_LINKS.instagram,
          OFFICIAL_SOCIAL_LINKS.facebook,
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://www.shoonaya.com/#website",
        "url": "https://www.shoonaya.com",
        "name": "Shoonaya",
        "description": "Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection.",
        "publisher": { "@id": "https://www.shoonaya.com/#organization" },
      },
    ],
  };
  return <JsonLd data={schema} />;
}
