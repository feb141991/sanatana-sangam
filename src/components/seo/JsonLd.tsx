import React from 'react';
import type { GeoModel } from '@/lib/seo/geo-model';

export function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
    articleSchema.author = {
      "@type": "Organization",
      "name": geo.provenance
    };
    articleSchema.publisher = {
      "@type": "Organization",
      "name": "Shoonaya",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shoonaya.com/icons/icon-512x512.png"
      }
    };
  } else {
    articleSchema.publisher = {
      "@type": "Organization",
      "name": "Shoonaya"
    };
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
